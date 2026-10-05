import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { useState, useEffect } from 'react';

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

export interface LocalSyncQueueItem {
  _id: string; // generated client-side id
  action: 'favorite' | 'delete' | 'edit_note';
  payload: any;
  timestamp: number;
}

interface KindleClipperDB extends DBSchema {
  books: {
    key: string;
    value: LocalBook;
    indexes: { 'by-userId': string; 'by-syncedAt': number };
  };
  highlights: {
    key: string;
    value: LocalHighlight;
    indexes: { 'by-userId': string; 'by-bookId': string; 'by-favorite': number };
  };
  syncQueue: {
    key: string;
    value: LocalSyncQueueItem;
  };
}

let dbPromise: Promise<IDBPDatabase<KindleClipperDB>> | null = null;

export function getDB() {
  if (!dbPromise && typeof window !== 'undefined') {
    dbPromise = openDB<KindleClipperDB>('KindleClipperDB', 2, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          const bookStore = db.createObjectStore('books', { keyPath: '_id' });
          bookStore.createIndex('by-userId', 'userId');
          bookStore.createIndex('by-syncedAt', 'syncedAt');

          const hlStore = db.createObjectStore('highlights', { keyPath: '_id' });
          hlStore.createIndex('by-userId', 'userId');
          hlStore.createIndex('by-bookId', 'bookId');
          hlStore.createIndex('by-favorite', 'favorite');
        }
        if (oldVersion < 2) {
          db.createObjectStore('syncQueue', { keyPath: '_id' });
        }
      },
    });
  }
  return dbPromise;
}

// Minimal hooks
export function useIDBQuery<T>(
  fetcher: (db: IDBPDatabase<KindleClipperDB>) => Promise<T>,
  deps: any[] = []
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const db = await getDB();
        if (db && active) {
          const res = await fetcher(db);
          if (active) {
            setData(res);
            setError(null);
          }
        }
      } catch (e: any) {
        if (active) setError(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [...deps, tick]);

  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}
