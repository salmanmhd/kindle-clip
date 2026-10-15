import { describe, it, expect, vi } from 'vitest';
import { cleanTitle, cleanAuthor, pickOpenLibraryCover, findCover } from '../lib/covers';

function jsonResponse(body: any, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('cover lookup helpers', () => {
  it('strips Kindle title noise', () => {
    expect(cleanTitle('Atomic Habits: An Easy & Proven Way to Build Good Habits (English Edition)')).toBe('Atomic Habits');
    expect(cleanTitle('﻿The Psychology of Money - Timeless lessons on wealth')).toBe('The Psychology of Money');
    expect(cleanTitle('Sapiens [Kindle Edition]')).toBe('Sapiens');
    expect(cleanTitle('Spider-Man')).toBe('Spider-Man');
  });

  it('normalizes "Last, First" and multi-author strings', () => {
    expect(cleanAuthor('Clear, James')).toBe('James Clear');
    expect(cleanAuthor('Kahneman, Daniel;Tversky, Amos')).toBe('Daniel Kahneman');
    expect(cleanAuthor('Morgan Housel')).toBe('Morgan Housel');
    expect(cleanAuthor(null)).toBeNull();
    expect(cleanAuthor('  ')).toBeNull();
  });

  it('prefers an exact title match over box sets and workbooks', () => {
    const docs = [
      { title: 'Atomic Habits, I Will Teach You To Be Rich, Mindset 4 Books Collection Set', cover_i: 3 },
      { title: 'Atomic Habits Workbook', cover_i: 2 },
      { title: 'Atomic Habits', cover_i: 1 }
    ];
    expect(pickOpenLibraryCover(docs, 'Atomic Habits')).toBe(1);
    expect(pickOpenLibraryCover([{ title: 'Atomic Habits' }], 'Atomic Habits')).toBeNull();
    expect(pickOpenLibraryCover([{ title: 'Something Else', cover_i: 9 }], 'Atomic Habits')).toBeNull();
  });
});

describe('findCover', () => {
  it('returns an Open Library cover url', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ docs: [{ title: 'Atomic Habits', cover_i: 12539702 }] }));
    const url = await findCover('Atomic Habits: Tiny Changes', 'Clear, James', fetchFn as any);
    expect(url).toBe('https://covers.openlibrary.org/b/id/12539702-M.jpg');
    const requested = new URL(fetchFn.mock.calls[0][0]);
    expect(requested.searchParams.get('title')).toBe('Atomic Habits');
    expect(requested.searchParams.get('author')).toBe('James Clear');
  });

  it('retries by title alone when the author search finds nothing', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ docs: [] }))
      .mockResolvedValueOnce(jsonResponse({ docs: [{ title: 'Meditations', cover_i: 7 }] }));
    expect(await findCover('Meditations', 'Aurelius, Marcus', fetchFn as any)).toBe('https://covers.openlibrary.org/b/id/7-M.jpg');
    expect(new URL(fetchFn.mock.calls[1][0]).searchParams.has('author')).toBe(false);
  });

  it('returns null when the book has no cover anywhere', async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ docs: [] }));
    expect(await findCover('Unknown Self-Published Notes', null, fetchFn as any)).toBeNull();
  });

  it('throws when every source is unreachable, so the caller retries later', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('network down'));
    await expect(findCover('Atomic Habits', 'James Clear', fetchFn as any)).rejects.toThrow();
  });

  it('falls back to Google Books when a key is configured', async () => {
    vi.stubEnv('GOOGLE_BOOKS_API_KEY', 'test-key');
    try {
      const fetchFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Open Library down'))
        .mockResolvedValueOnce(
          jsonResponse({ items: [{ volumeInfo: { imageLinks: { thumbnail: 'http://books.google.com/books/content?id=x&zoom=1&edge=curl' } } }] })
        );
      expect(await findCover('Atomic Habits', null, fetchFn as any)).toBe('https://books.google.com/books/content?id=x&zoom=1');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
