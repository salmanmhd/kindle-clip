import mongoose from 'mongoose';
import { parseClippings, ParsedEntry } from './parse';
import { normalizeText, hashText, normalizeTitle } from './normalize';
import { Book, IBook } from '../models/Book';
import { Highlight, IHighlight } from '../models/Highlight';
import { Import } from '../models/Import';
import { createHash } from 'node:crypto';

export async function processImport(
  userId: string,
  rawText: string,
  fileName: string
) {
  // Parse
  const entries = parseClippings(rawText);
  
  // File Hash
  const fileHash = createHash('sha256').update(rawText).digest('hex');
  
  // Check if identical file imported previously?
  // User spec: "uploading identical file twice must result in 0 new highlights". 
  // We don't abort, we process it but it will naturally give 0 new.
  // Still, we can store fileHash for Import record.
  
  const stats = {
    newCount: 0,
    duplicateCount: 0,
    mergedCount: 0,
    previouslyRemovedCount: 0,
    skippedCount: 0,
    failedCount: 0
  };
  
  const bookStats = new Map<string, { bookId: string, title: string, newCount: number }>();
  
  // 1. Filter out bookmarks
  const validEntries = entries.filter(e => {
    if (e.type === 'bookmark') {
      stats.skippedCount++;
      return false;
    }
    return true;
  });

  // 2. Sort by date ascending to handle growing highlights sequentially
  validEntries.sort((a, b) => {
    const aTime = a.addedAt?.getTime() || 0;
    const bTime = b.addedAt?.getTime() || 0;
    return aTime - bTime;
  });

  // Group by titleKey to minimize DB queries
  const booksData = new Map<string, { bookId: string, title: string, author: string | null }>();
  
  for (const e of validEntries) {
    const titleKey = normalizeTitle(e.title);
    if (!booksData.has(titleKey)) {
      booksData.set(titleKey, { bookId: '', title: e.title, author: e.author });
    }
  }

  // Load or create books
  const booksToCreate = [];
  const existingBooks = await Book.find({ userId, titleKey: { $in: Array.from(booksData.keys()) } });
  
  for (const b of existingBooks) {
    const data = booksData.get(b.titleKey);
    if (data) {
      data.bookId = b._id.toString();
    }
  }

  for (const [key, data] of booksData.entries()) {
    if (!data.bookId) {
      const newId = new mongoose.Types.ObjectId().toString();
      data.bookId = newId;
      booksToCreate.push({
        _id: newId,
        userId,
        title: data.title,
        titleKey: key,
        author: data.author
      });
    }
    bookStats.set(key, { bookId: data.bookId, title: data.title, newCount: 0 });
  }

  if (booksToCreate.length > 0) {
    await Book.insertMany(booksToCreate);
  }

  // Load existing highlights for all affected books
  const allHighlights = await Highlight.find({ 
    userId, 
    bookId: { $in: Array.from(booksData.values()).map(v => v.bookId) } 
  });
  
  // In-memory index of highlights by bookId
  const highlightsByBook = new Map<string, IHighlight[]>();
  for (const h of allHighlights) {
    const bId = h.bookId.toString();
    if (!highlightsByBook.has(bId)) highlightsByBook.set(bId, []);
    highlightsByBook.get(bId)!.push(h);
  }

  const ops: mongoose.AnyBulkWriteOperation<IHighlight>[] = [];
  const pendingHighlights: IHighlight[] = [];

  for (const e of validEntries) {
    if (e.text === '') continue;

    const titleKey = normalizeTitle(e.title);
    const bookId = booksData.get(titleKey)!.bookId;
    if (!highlightsByBook.has(bookId)) {
      highlightsByBook.set(bookId, []);
    }
    const existingList = highlightsByBook.get(bookId)!;

    if (e.type === 'note') {
      // Find matching highlight whose location is within 15 units of note loc
      const target = existingList.find(h => 
        h.kind === 'highlight' && 
        (
          (e.locStart >= h.locStart && e.locStart <= h.locEnd) || 
          Math.abs(e.locStart - h.locEnd) <= 15 || 
          Math.abs(e.locStart - h.locStart) <= 15
        )
      );
      if (target) {
        if (!target.deletedAt) {
          target.note = e.text;
          ops.push({
            updateOne: {
              filter: { _id: target._id },
              update: { $set: { note: e.text } }
            }
          });
        }
      } else {
        // Standalone note
        const normText = normalizeText(e.text);
        const textHash = hashText(normText);
        
        // Ensure no duplicate standalone note
        const dup = existingList.find(h => h.textHash === textHash);
        if (dup) {
          stats.duplicateCount++;
        } else {
          const newHId = new mongoose.Types.ObjectId();
          const newDoc = new Highlight({
            _id: newHId,
            userId,
            bookId,
            kind: 'note',
            text: e.text,
            normText,
            textHash,
            locStart: e.locStart,
            locEnd: e.locEnd,
            page: e.page,
            highlightedAt: e.addedAt,
            source: 'kindle'
          });
          existingList.push(newDoc);
          ops.push({
            insertOne: {
              document: newDoc
            }
          });
          stats.newCount++;
          bookStats.get(titleKey)!.newCount++;
        }
      }
      continue;
    }

    // Highlight
    const normText = normalizeText(e.text);
    const textHash = hashText(normText);

    // 1. Exact Match
    const exactMatch = existingList.find(h => h.textHash === textHash);
    if (exactMatch) {
      if (exactMatch.deletedAt) {
        stats.previouslyRemovedCount++;
      } else {
        stats.duplicateCount++;
      }
      continue;
    }

    // 2. Overlap match
    let merged = false;
    for (const h of existingList) {
      if (h.kind === 'highlight') {
        const overlap = Math.max(h.locStart, e.locStart) <= Math.min(h.locEnd, e.locEnd);
        if (overlap) {
           if (h.normText.includes(normText) || normText.includes(h.normText)) {
          // One contains the other
          if (normText.length > h.normText.length) {
            if (h.deletedAt) {
              stats.previouslyRemovedCount++;
              merged = true;
              break;
            } else {
              // Merge: Incoming is longer
              h.text = e.text;
              h.normText = normText;
              h.textHash = textHash;
              h.locStart = Math.min(h.locStart, e.locStart);
              h.locEnd = Math.max(h.locEnd, e.locEnd);
              
              ops.push({
                updateOne: {
                  filter: { _id: h._id },
                  update: { 
                    $set: { 
                      text: h.text, 
                      normText: h.normText, 
                      textHash: h.textHash,
                      locStart: h.locStart,
                      locEnd: h.locEnd
                    } 
                  }
                }
              });
              stats.mergedCount++;
              merged = true;
              break;
            }
          } else {
            // Incoming is shorter or equal -> duplicate
            if (h.deletedAt) {
              stats.previouslyRemovedCount++;
            } else {
              stats.duplicateCount++;
            }
            merged = true;
            break;
          }
        }
        }
      }
    }

    if (merged) continue;

    // 4. No match -> new highlight
    const newHId = new mongoose.Types.ObjectId();
    const newDoc = new Highlight({
      _id: newHId,
      userId,
      bookId,
      kind: 'highlight',
      text: e.text,
      normText,
      textHash,
      locStart: e.locStart,
      locEnd: e.locEnd,
      page: e.page,
      highlightedAt: e.addedAt,
      source: 'kindle'
    });
    existingList.push(newDoc);
    ops.push({
      insertOne: {
        document: newDoc
      }
    });
    stats.newCount++;
    bookStats.get(titleKey)!.newCount++;
  }

  if (ops.length > 0) {
    await Highlight.bulkWrite(ops, { ordered: false });
  }

  // Update highlight counts on books
  const countOps: mongoose.AnyBulkWriteOperation<IBook>[] = [];
  for (const b of Array.from(bookStats.values())) {
    if (b.newCount > 0) {
      countOps.push({
        updateOne: {
          filter: { _id: b.bookId },
          update: { $inc: { highlightCount: b.newCount } }
        }
      });
    }
  }
  if (countOps.length > 0) {
    await Book.bulkWrite(countOps);
  }

  // Record Import
  await Import.create({
    userId,
    fileHash,
    fileName,
    stats,
    perBook: Array.from(bookStats.values()).filter(b => b.newCount > 0)
  });

  return { stats, perBook: Array.from(bookStats.values()) };
}
