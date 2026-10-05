'use client';

import { useEffect } from 'react';
import { getDB } from '@/lib/indexeddb';

export default function OfflineSync() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return;

    // Check online status
    if (!navigator.onLine) return;

    const syncData = async () => {
      try {
        const lastSync = localStorage.getItem('lastSyncDate');
        const query = lastSync ? `?since=${lastSync}` : '';
        const res = await fetch(`/api/sync${query}`);
        if (!res.ok) return;

        const data = await res.json();
        const now = Date.now();
        
        const db = await getDB();
        if (!db) return;

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
