'use client';

import { useEffect } from 'react';
import { db } from '@/lib/indexeddb';

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
        
        const books = data.books.map((b: any) => ({ ...b, syncedAt: now }));
        const highlights = data.highlights.map((h: any) => ({ ...h, syncedAt: now }));

        await db.transaction('rw', db.books, db.highlights, async () => {
          // Update all records. We could be smarter about diffing, but for a kindle clipper 
          // (which usually has <10k highlights), a bulk put is extremely fast.
          await db.books.bulkPut(books);
          await db.highlights.bulkPut(highlights);
          
          if (data.deletedHighlightIds?.length > 0) {
            await db.highlights.bulkDelete(data.deletedHighlightIds);
          }
          
          if (data.timestamp) {
            localStorage.setItem('lastSyncDate', data.timestamp);
          }
        });
        
        console.log('Successfully synced data to IndexedDB');
      } catch (err) {
        console.error('Failed to sync to IndexedDB', err);
      }
    };

    // Run sync on mount
    syncData();
    
    // Optionally run sync on interval or window focus
    const interval = setInterval(syncData, 5 * 60 * 1000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  return null;
}
