'use client';

import { useEffect } from 'react';
import { getDB } from '@/lib/indexeddb';

export default function OfflineSync() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('Service Worker registration failed: ', err);
      });
    }

    // Check online status
    if (!navigator.onLine) return;

    const syncData = async () => {
      try {
        const db = await getDB();
        if (!db) return;

        // Process Offline Sync Queue first
        const queue = await db.getAll('syncQueue');
        if (queue.length > 0) {
          // Compress the queue: keep only the latest action per item if multiple
          const actionMap = new Map();
          for (const item of queue.sort((a, b) => a.timestamp - b.timestamp)) {
            // For favourite toggles, only the latest matters per highlight
            if (item.action === 'favorite') {
              actionMap.set(`fav_${item.payload.id}`, item);
            } else {
              actionMap.set(item._id, item);
            }
          }

          const compressedQueue = Array.from(actionMap.values());
          for (const item of compressedQueue) {
            if (item.action === 'favorite') {
              try {
                const res = await fetch(`/api/highlights/${item.payload.id}/star`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ favorite: item.payload.favorite })
                });
                if (res.ok) {
                  // If successful, delete all related actions from queue
                  const allRelated = queue.filter(q => q.action === 'favorite' && q.payload.id === item.payload.id);
                  const tx = db.transaction('syncQueue', 'readwrite');
                  for (const rel of allRelated) {
                    await tx.store.delete(rel._id);
                  }
                  await tx.done;
                } else if (res.status >= 400 && res.status < 500) {
                  // Server rejection (e.g. 404), drop the task
                  const tx = db.transaction('syncQueue', 'readwrite');
                  await tx.store.delete(item._id);
                  await tx.done;
                }
              } catch (err) {
                console.error('Failed to replay sync action', err);
              }
            }
          }
        }
        const lastSync = localStorage.getItem('lastSyncDate');
        const query = lastSync ? `?since=${lastSync}` : '';
        const res = await fetch(`/api/sync${query}`);
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (!res.ok) return;

        const data = await res.json();
        const now = Date.now();
        
        // const db = await getDB(); // already initialized
        // if (!db) return;

        const tx = db.transaction(['books', 'highlights'], 'readwrite');
        
        if (data.books && data.books.length > 0) {
          for (const b of data.books) {
            await tx.objectStore('books').put({ ...b, syncedAt: now });
          }
        }
        
        if (data.highlights && data.highlights.length > 0) {
          for (const h of data.highlights) {
            await tx.objectStore('highlights').put({ ...h, syncedAt: now });
          }
        }
        
        if (data.deletedHighlightIds?.length > 0) {
          for (const id of data.deletedHighlightIds) {
            await tx.objectStore('highlights').delete(id);
          }
        }

        await tx.done;

        if (data.timestamp) {
          localStorage.setItem('lastSyncDate', data.timestamp);
        }

        // Request persistence to prevent browser eviction (PWA-003)
        if (navigator.storage && navigator.storage.persist) {
          const isPersisted = await navigator.storage.persist();
          console.log(`Storage persisted: ${isPersisted}`);
        }
        
        console.log('Successfully synced data to IndexedDB');
        window.dispatchEvent(new Event('sync-completed'));
      } catch (err) {
        console.error('Failed to sync to IndexedDB', err);
      }
    };

    // Run sync on mount
    syncData();
    
    // Optionally run sync on interval
    const interval = setInterval(syncData, 5 * 60 * 1000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  return null;
}
