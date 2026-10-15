import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { useState, useEffect } from 'react';

export interface LocalBook {
  _id: string;
  userId: string;
  title: string;
  author: string | null;
  highlightCount: number;
  coverUrl?: string | null;
  coverCheckedAt?: string | null;
  syncedAt: number;
}

export interface LocalHighlight {
  _id: string;
  userId: string;
  bookId: string;
  text: string;
  note?: string | null;
  locStart?: number;
  locEnd?: number;
  page?: number | null;
  favorite: boolean;
  source?: 'kindle' | 'manual';
  createdAt?: string;
  syncedAt: number;
}

export interface LocalSyncQueueItem {
  _id: string; // generated client-side id
  action: 'favorite' | 'delete' | 'edit_note' | 'create';
  payload: any;
  timestamp: number;
}

// 24-hex id in MongoDB ObjectId layout, so records created offline keep their id on the server
export function newObjectId() {
  const time = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, '0')).join('');
  return time + rand;
}

export async function queueAction(action: LocalSyncQueueItem['action'], payload: any) {
  const db = await getDB();
  if (!db) return;
  const now = Date.now();
  await db.put('syncQueue', { _id: `${action}_${payload.id ?? payload._id}_${now}`, action, payload, timestamp: now });
}

// Ask OfflineSync to flush the queue and pull changes now instead of waiting for the interval
export function requestSync() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('request-sync'));
}

// Lets other open views re-read IndexedDB after a local write
export function notifyLocalChange() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('sync-completed'));
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
      // If we've never synced, stay in loading state
      if (typeof window !== 'undefined' && !localStorage.getItem('lastSyncDate')) {
        if (active) setLoading(true);
        return;
      }

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

    const handleSync = () => setTick(t => t + 1);
    if (typeof window !== 'undefined') {
      window.addEventListener('sync-completed', handleSync);
    }

    return () => { 
      active = false; 
      if (typeof window !== 'undefined') {
        window.removeEventListener('sync-completed', handleSync);
      }
    };
  }, [...deps, tick]);

  return { data, loading, error, refetch: () => setTick(t => t + 1) };
}
