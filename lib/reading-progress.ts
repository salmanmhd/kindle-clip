// Per-device "continue reading" state, kept in localStorage so it works offline.

const KEY = 'reader_last';

export interface ReadingProgress {
  bookId: string;
  index: number;
  total: number;
  at: number;
}

export function saveReadingProgress(bookId: string, index: number, total: number) {
  try {
    localStorage.setItem(`reader_pos_${bookId}`, index.toString());
    localStorage.setItem(KEY, JSON.stringify({ bookId, index, total, at: Date.now() }));
  } catch {
    // Storage full or blocked: progress is a convenience, so ignore
  }
}

export function getReadingProgress(): ReadingProgress | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.bookId === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function clearReadingProgress() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (key === KEY || key.startsWith('reader_pos_')) localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
