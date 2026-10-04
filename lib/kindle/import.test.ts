import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { processImport } from './import';
import { Book } from '../models/Book';
import { Highlight } from '../models/Highlight';
import { Import } from '../models/Import';
import { readFileSync } from 'fs';
import { join } from 'path';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Book.deleteMany({});
  await Highlight.deleteMany({});
  await Import.deleteMany({});
});

describe('processImport', () => {
  const userId = new mongoose.Types.ObjectId().toString();
  const rawText = readFileSync(join(process.cwd(), 'fixtures', 'My_Clippings.txt'), 'utf8');

  it('imports correctly on first run', async () => {
    const res = await processImport(userId, rawText, 'My_Clippings.txt');
    console.log('STATS', res.stats);
    // Check summary stats
    expect(res.stats.newCount).toBe(5); // 1 normal + 1 note attached + 1 unknown_author + 1 hindi + 1 growing_highlight (collapsed to 1) + 1 bad date = 5 highlights total created
    expect(res.stats.duplicateCount).toBe(0);
    expect(res.stats.mergedCount).toBe(2); // The growing highlight has 3 entries. 1st is new, 2nd merges, 3rd merges.
    expect(res.stats.skippedCount).toBe(1); // Bookmark
    
    // Check DB state
    const highlights = await Highlight.find({ userId });
    expect(highlights.length).toBe(5); // Total documents in Highlight collection for this user (including notes)
    
    // Check that growing highlight collapsed to one
    const growing = highlights.filter(h => h.text.includes('Short text getting longer and longer now.'));
    expect(growing.length).toBe(1);
    
    // Check note is attached
    const noteAttach = highlights.find(h => h.text === 'The highlighted text, possibly spanning several lines.');
    expect(noteAttach).toBeDefined();
    expect(noteAttach!.note).toBe('This is a note attached to the highlight.');
  });

  it('re-importing the same file results in 0 new', async () => {
    await processImport(userId, rawText, 'My_Clippings.txt');
    const res2 = await processImport(userId, rawText, 'My_Clippings.txt');
    
    expect(res2.stats.newCount).toBe(0);
    expect(res2.stats.duplicateCount).toBeGreaterThan(0); 
    
    const count = await Highlight.countDocuments();
    expect(count).toBe(5);
  });

  it('does not resurrect soft-deleted highlights', async () => {
    await processImport(userId, rawText, 'My_Clippings.txt');
    
    // Soft delete one
    const h = await Highlight.findOne({ text: 'Highlight without page and unknown author.' });
    h!.deletedAt = new Date();
    await h!.save();
    
    const res2 = await processImport(userId, rawText, 'My_Clippings.txt');
    
    // Should count as previously removed
    expect(res2.stats.previouslyRemovedCount).toBeGreaterThan(0);
    expect(res2.stats.newCount).toBe(0);
    
    const deletedH = await Highlight.findById(h!._id);
    expect(deletedH!.deletedAt).not.toBeNull();
  });
  
  it('maps BOM-prefixed title to the same book', async () => {
    const customText = `\uFEFFBook Title (Author Name)\n- Your Highlight on page 6 | location 78-79 | Added on Saturday, 18 November 2023 10:58:06\n\nText 1\n==========\nBook Title (Author Name)\n- Your Highlight on page 6 | location 80-81 | Added on Saturday, 18 November 2023 10:58:06\n\nText 2\n==========`;
    
    await processImport(userId, customText, 'test.txt');
    const books = await Book.find({ userId });
    expect(books.length).toBe(1);
    expect(books[0].highlightCount).toBe(2);
  });
});
