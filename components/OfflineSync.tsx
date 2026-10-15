'use client';

import { useEffect } from 'react';
import { getDB, LocalSyncQueueItem } from '@/lib/indexeddb';

type DB = NonNullable<Awaited<ReturnType<typeof getDB>>>;

// Actions where only the latest queued value per highlight matters
const COLLAPSIBLE = new Set<LocalSyncQueueItem['action']>(['favorite', 'edit_note']);

function queueKey(item: LocalSyncQueueItem) {
  return COLLAPSIBLE.has(item.action) ? `${item.action}_${item.payload.id}` : item._id;
}

async function deleteQueueItems(db: DB, ids: string[]) {
  const tx = db.transaction('syncQueue', 'readwrite');
  await Promise.all(ids.map(id => tx.store.delete(id)));
  await tx.done;
}

// Removes a book that only ever existed locally once nothing points at it
async function dropOrphanLocalBook(db: DB, bookId: string) {
  const remaining = await db.countFromIndex('highlights', 'by-bookId', bookId);
  if (remaining === 0) await db.delete('books', bookId);
}

async function replayCreate(db: DB, item: LocalSyncQueueItem) {
  const res = await fetch('/api/highlights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item.payload)
  });
  if (res.ok) {
    const { highlight, book } = await res.json();
    const now = Date.now();
    await db.put('highlights', { ...highlight, syncedAt: now });
    if (book) await db.put('books', { ...book, syncedAt: now });
    // The server may have filed it under an existing book with the same title
    if (book && item.payload.bookId && book._id !== item.payload.bookId) {
      await dropOrphanLocalBook(db, item.payload.bookId);
    }
    return 'done';
  }
  if (res.status >= 400 && res.status < 500 && res.status !== 401) {
    // Rejected (duplicate or invalid): undo the optimistic local copy
    await db.delete('highlights', item.payload._id);
    if (item.payload.bookId) await dropOrphanLocalBook(db, item.payload.bookId);
    return 'done';
  }
  return 'retry';
}

async function replay(db: DB, item: LocalSyncQueueItem): Promise<'done' | 'retry'> {
  if (item.action === 'create') return replayCreate(db, item);

  let res: Response;
  if (item.action === 'favorite') {
    res = await fetch(`/api/highlights/${item.payload.id}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ favorite: item.payload.favorite })
    });
  } else if (item.action === 'edit_note') {
    res = await fetch(`/api/highlights/${item.payload.id}/note`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: item.payload.note })
    });
  } else if (item.action === 'delete') {
    res = await fetch(`/api/highlights/${item.payload.id}`, { method: 'DELETE' });
  } else {
    return 'done';
  }
  // 4xx (e.g. 404 for something already gone) can never succeed, so drop it
  if (res.ok || (res.status >= 400 && res.status < 500 && res.status !== 401)) return 'done';
  return 'retry';
}

async function flushQueue(db: DB) {
  const queue = await db.getAll('syncQueue');
  if (queue.length === 0) return;

  queue.sort((a, b) => a.timestamp - b.timestamp);
  // Keep the latest item per key, in order of first appearance (so a create runs before later edits)
  const latest = new Map<string, LocalSyncQueueItem>();
  for (const item of queue) latest.set(queueKey(item), item);

  for (const [key, item] of latest) {
    try {
      if ((await replay(db, item)) === 'done') {
        await deleteQueueItems(db, queue.filter(q => queueKey(q) === key).map(q => q._id));
      }
    } catch (err) {
      // Network dropped mid-flush; keep the rest for next time
      console.error('Failed to replay sync action', err);
      return;
    }
  }
}

async function pullChanges(db: DB) {
  const lastSync = localStorage.getItem('lastSyncDate');
  const query = lastSync ? `?since=${encodeURIComponent(lastSync)}` : '';
  const res = await fetch(`/api/sync${query}`);
  // The proxy answers signed-out API calls with a redirect to the login page, not a 401
  if (res.status === 401 || (res.redirected && new URL(res.url).pathname === '/login')) {
    window.location.href = '/login';
    return false;
  }
  if (!res.ok) return false;

  const data = await res.json();
  const now = Date.now();
  const tx = db.transaction(['books', 'highlights'], 'readwrite');
  for (const b of data.books || []) {
    await tx.objectStore('books').put({ ...b, syncedAt: now });
  }
  for (const h of data.highlights || []) {
    await tx.objectStore('highlights').put({ ...h, syncedAt: now });
  }
  for (const id of data.deletedHighlightIds || []) {
    await tx.objectStore('highlights').delete(id);
  }
  await tx.done;

  if (data.timestamp) localStorage.setItem('lastSyncDate', data.timestamp);
  return true;
}

// Looks up covers for books that haven't been checked yet, a batch at a time
async function fetchMissingCovers(db: DB) {
  const books = await db.getAll('books');
  if (!books.some(b => !b.coverCheckedAt)) return false;

  for (let i = 0; i < 10; i++) {
    const res = await fetch('/api/books/covers', { method: 'POST' });
    if (!res.ok) break;
    const data = await res.json();
    if (!data.remaining) break;
  }
  // Pull even when no cover was found, so coverCheckedAt reaches the client and we stop asking
  return true;
}

export default function OfflineSync() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service Worker registration failed: ', err);
      });
    }

    let running = false;
    let rerun = false;

    const syncData = async () => {
      if (!navigator.onLine) return;
      if (running) {
        rerun = true;
        return;
      }
      running = true;
      try {
        const db = await getDB();
        if (!db) return;

        await flushQueue(db);
        if (!(await pullChanges(db))) return;

        if (navigator.storage && navigator.storage.persist) {
          await navigator.storage.persist();
        }
        window.dispatchEvent(new Event('sync-completed'));

        if (await fetchMissingCovers(db)) {
          await pullChanges(db);
          window.dispatchEvent(new Event('sync-completed'));
        }
      } catch (err) {
        console.error('Failed to sync to IndexedDB', err);
      } finally {
        running = false;
        if (rerun) {
          rerun = false;
          syncData();
        }
      }
    };

    syncData();
    const interval = setInterval(syncData, 5 * 60 * 1000);
    window.addEventListener('online', syncData);
    window.addEventListener('request-sync', syncData);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', syncData);
      window.removeEventListener('request-sync', syncData);
    };
  }, []);

  return null;
}
