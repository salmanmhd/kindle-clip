import Dexie, { type EntityTable } from 'dexie';

export interface LocalBook {
  _id: string;
  userId: string;
  title: string;
  author: string;
  highlightCount: number;
  syncedAt: number;
}

export interface LocalHighlight {
  _id: string;
  userId: string;
  bookId: string;
  text: string;
  note?: string;
  locStart?: number;
  locEnd?: number;
  page?: number;
  favorite: boolean;
  syncedAt: number;
}

const db = new Dexie('KindleClipperDB') as Dexie & {
  books: EntityTable<LocalBook, '_id'>;
  highlights: EntityTable<LocalHighlight, '_id'>;
};

// Schema declaration
db.version(1).stores({
  books: '_id, userId, title, highlightCount, syncedAt',
  highlights: '_id, userId, bookId, favorite, text, syncedAt'
});

export { db };
