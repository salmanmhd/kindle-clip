// Book cover lookup. Open Library is free and keyless; Google Books is used as a
// fallback only when GOOGLE_BOOKS_API_KEY is set (its anonymous quota is effectively zero).

const USER_AGENT = 'KindleClipper/1.0 (https://kindle-clip.vercel.app)';
const TIMEOUT_MS = 6000;

type FetchFn = typeof fetch;

// "Atomic Habits: An Easy & Proven Way… (English Edition)" -> "Atomic Habits"
export function cleanTitle(title: string): string {
  return title
    .replace(/^﻿/, '')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
    .split(/:|\s[-–—]\s/)[0]
    .replace(/\s+/g, ' ')
    .trim();
}

// "Clear, James" -> "James Clear"; "Kahneman, Daniel;Tversky, Amos" -> "Daniel Kahneman"
export function cleanAuthor(author: string | null | undefined): string | null {
  if (!author) return null;
  const first = author.split(/;|&|\band\b/)[0].trim();
  if (!first) return null;
  const parts = first.split(',').map(p => p.trim()).filter(Boolean);
  const name = parts.length === 2 ? `${parts[1]} ${parts[0]}` : first;
  return name.replace(/\s+/g, ' ').trim() || null;
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

interface OpenLibraryDoc {
  title?: string;
  cover_i?: number;
  author_name?: string[];
}

// Prefer an exact title match with a cover; avoid box sets and workbooks that merely contain the title
export function pickOpenLibraryCover(docs: OpenLibraryDoc[], title: string): number | null {
  const want = normalize(title);
  const withCover = docs.filter(d => typeof d.cover_i === 'number' && d.cover_i > 0);
  const exact = withCover.find(d => d.title && normalize(cleanTitle(d.title)) === want);
  if (exact) return exact.cover_i!;
  const prefix = withCover.find(d => d.title && normalize(d.title).startsWith(want) && normalize(d.title).length - want.length < 25);
  return prefix?.cover_i ?? null;
}

export function openLibraryCoverUrl(coverId: number) {
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

async function fromOpenLibrary(title: string, author: string | null, fetchFn: FetchFn) {
  const params = new URLSearchParams({ title, limit: '10', fields: 'title,cover_i,author_name' });
  if (author) params.set('author', author);
  const res = await fetchFn(`https://openlibrary.org/search.json?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`Open Library ${res.status}`);
  const data = await res.json();
  const coverId = pickOpenLibraryCover(data.docs || [], title);
  return coverId ? openLibraryCoverUrl(coverId) : null;
}

async function fromGoogleBooks(title: string, author: string | null, key: string, fetchFn: FetchFn) {
  const q = `intitle:${title}${author ? ` inauthor:${author}` : ''}`;
  const params = new URLSearchParams({ q, maxResults: '5', key, fields: 'items(volumeInfo(title,imageLinks))' });
  const res = await fetchFn(`https://www.googleapis.com/books/v1/volumes?${params}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`Google Books ${res.status}`);
  const data = await res.json();
  for (const item of data.items || []) {
    const thumb: string | undefined = item.volumeInfo?.imageLinks?.thumbnail;
    if (thumb) return thumb.replace(/^http:/, 'https:').replace('&edge=curl', '');
  }
  return null;
}

/**
 * Returns a cover URL, null when the book genuinely has no cover, or throws when
 * every source failed (so the caller can retry later instead of giving up).
 */
export async function findCover(rawTitle: string, rawAuthor: string | null, fetchFn: FetchFn = fetch) {
  const title = cleanTitle(rawTitle);
  if (!title) return null;
  const author = cleanAuthor(rawAuthor);

  const googleKey = process.env.GOOGLE_BOOKS_API_KEY;
  let failures = 0;
  const attempts: Array<() => Promise<string | null>> = [
    () => fromOpenLibrary(title, author, fetchFn),
    // Kindle author strings are often messy; retry by title alone before falling back
    ...(author ? [() => fromOpenLibrary(title, null, fetchFn)] : []),
    ...(googleKey ? [() => fromGoogleBooks(title, author, googleKey, fetchFn)] : [])
  ];
  for (const attempt of attempts) {
    try {
      const url = await attempt();
      if (url) return url;
    } catch {
      failures++;
    }
  }
  if (failures === attempts.length) throw new Error('Cover lookup failed');
  return null;
}
