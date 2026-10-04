import { describe, it, expect } from 'vitest';
import { parseClippings } from './parse';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('parseClippings', () => {
  it('parses the fixture correctly', () => {
    const raw = readFileSync(join(process.cwd(), 'fixtures', 'My_Clippings.txt'), 'utf8');
    const entries = parseClippings(raw);
    
    // Check lengths - fixture has 9 blocks
    expect(entries.length).toBe(9);
    
    // First: Highlight with page
    expect(entries[0].title).toBe('Book Title');
    expect(entries[0].author).toBe('Author Name');
    expect(entries[0].type).toBe('highlight');
    expect(entries[0].page).toBe(6);
    expect(entries[0].locStart).toBe(78);
    expect(entries[0].locEnd).toBe(79);
    expect(entries[0].text).toBe('The highlighted text, possibly spanning several lines.');
    
    // Second: Note with page
    expect(entries[1].title).toBe('Book Title');
    expect(entries[1].author).toBe('Author Name');
    expect(entries[1].type).toBe('note');
    expect(entries[1].page).toBe(6);
    expect(entries[1].locStart).toBe(79);
    expect(entries[1].locEnd).toBe(79); // location 79
    expect(entries[1].text).toBe('This is a note attached to the highlight.');
    
    // Third: Unknown author
    expect(entries[2].title).toBe('Another Book');
    expect(entries[2].author).toBeNull();
    expect(entries[2].type).toBe('highlight');
    expect(entries[2].page).toBeNull();
    expect(entries[2].locStart).toBe(135);
    
    // Fourth: Hindi Title
    expect(entries[3].title).toBe('Third Book (Hindi Edition)');
    expect(entries[3].author).toBe('Divya Prakash Dubey');
    expect(entries[3].text).toBe('Some Hindi text: नमस्ते दुनिया');
    
    // Eighth: Bookmark
    expect(entries[7].type).toBe('bookmark');
    
    // Ninth: Bad date
    expect(entries[8].addedAt).toBeNull();
  });
});
