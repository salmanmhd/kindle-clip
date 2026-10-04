import { createHash } from 'node:crypto';

export function normalizeText(text: string): string {
  // Normalize to NFKC, lowercase, keep only letters, numbers, and combining marks
  const normalized = text.normalize('NFKC').toLowerCase();
  
  // Use unicode property escapes to keep \p{L} (letters), \p{N} (numbers), \p{M} (marks)
  // This removes spaces, punctuation, dashes, quotes etc while preserving Hindi/Arabic
  const stripped = normalized.replace(/[^\p{L}\p{N}\p{M}]/gu, '');
  
  return stripped;
}

export function hashText(normText: string): string {
  return createHash('sha256').update(normText).digest('hex');
}

export function normalizeTitle(title: string): string {
  return title
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
