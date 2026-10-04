import { describe, it, expect, beforeEach } from 'vitest';
import { processImport } from '../lib/kindle/import';
import { Book } from '../lib/models/Book';
import { Highlight } from '../lib/models/Highlight';
import { Import } from '../lib/models/Import';
import mongoose from 'mongoose';

const userId = new mongoose.Types.ObjectId().toString();
const fileName = 'My_Clippings.txt';
const fileHash = 'hash_123';

const basicFixture = `Book Title (Author Name)
- Your Highlight on Location 10-10 | Added on Sunday, October 4, 2026 10:00:00 AM

This is a highlight.
==========
Book Title (Author Name)
- Your Note on Location 10 | Added on Sunday, October 4, 2026 10:05:00 AM

This is a note for the highlight.
==========
Another Book (Author 2)
- Your Highlight on Location 20-25 | Added on Sunday, October 4, 2026 10:10:00 AM

Growing highlight part 1.
==========
Another Book (Author 2)
- Your Highlight on Location 20-26 | Added on Sunday, October 4, 2026 10:12:00 AM

Growing highlight part 1 and 2.
==========`;

const bomFixture = `\uFEFFBook Title (Author Name)
- Your Highlight on Location 10-10 | Added on Sunday, October 4, 2026 10:00:00 AM

This is a highlight.
==========`;

describe('Import deduplication', () => {
  beforeEach(async () => {
    // Models are cleared by setup.ts
  });

  it('re-import the same file gives 0 new', async () => {
    const res1 = await processImport(userId, basicFixture, fileName);
    expect(res1.stats.newCount).toBeGreaterThan(0);
    expect(res1.stats.duplicateCount).toBe(0);

    const res2 = await processImport(userId, basicFixture, fileName);
    expect(res2.stats.newCount).toBe(0);
    expect(res2.stats.duplicateCount).toBeGreaterThan(0);
  });

  it('growing highlights collapse to one', async () => {
    await processImport(userId, basicFixture, fileName);
    const highlights = await Highlight.find({ userId }).lean();
    
    // There are 2 highlights in 'basicFixture' (one for Book Title, one for Another Book).
    // The two in 'Another Book' should be collapsed.
    expect(highlights.length).toBe(2);
    const growing = highlights.find(h => h.normText.includes('growinghighlight'));
    expect(growing?.text).toContain('Growing highlight part 1 and 2.');
  });

  it('soft-deleted highlights are never resurrected', async () => {
    await processImport(userId, basicFixture, fileName);
    
    // Soft delete one
    await Highlight.updateOne({}, { deletedAt: new Date() });
    
    // Re-import
    const res2 = await processImport(userId, basicFixture, fileName);
    expect(res2.stats.newCount).toBe(0);
    expect(res2.stats.previouslyRemovedCount).toBeGreaterThan(0);
    
    const h = await Highlight.findOne();
    expect(h?.deletedAt).not.toBeNull(); // Still deleted
  });

  it('a note attaches to its highlight', async () => {
    await processImport(userId, basicFixture, fileName);
    const highlight = await Highlight.findOne({ normText: /thisisahighlight/i });
    expect(highlight).toBeDefined();
    expect(highlight?.note).toBe('This is a note for the highlight.');
  });

  it('a BOM-prefixed title maps to the same book', async () => {
    await processImport(userId, basicFixture, fileName);
    const booksBefore = await Book.countDocuments();
    expect(booksBefore).toBe(2);
    
    // Import again with BOM prefixed
    await processImport(userId, bomFixture, fileName);
    const booksAfter = await Book.countDocuments();
    
    expect(booksAfter).toBe(2); // Should not create a new book
  });

  it('two simultaneous imports create no duplicates', async () => {
    // Fire two promises at the same time
    const p1 = processImport(userId, basicFixture, fileName);
    const p2 = processImport(userId, basicFixture, fileName);
    
    const results = await Promise.all([p1, p2]);
    
    // One of them might process first, but together they shouldn't insert duplicates
    const highlights = await Highlight.countDocuments();
    expect(highlights).toBe(2); // Total 2 unique highlights
  });
});
