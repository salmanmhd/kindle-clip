'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Star, Trash2, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getDB, LocalHighlight, notifyLocalChange, queueAction } from '@/lib/indexeddb';
import ShareCardButton from '@/components/ShareCardButton';

type BookInfo = { title: string; author?: string | null };

interface HighlightListProps {
  initialHighlights: LocalHighlight[];
  bookId?: string;
  // Book details per bookId, for share cards and for lists that span books (favourites)
  books?: Record<string, BookInfo>;
}

async function adjustLocalBookCount(bookId: string, delta: number) {
  const db = await getDB();
  const book = db && (await db.get('books', bookId));
  if (db && book) await db.put('books', { ...book, highlightCount: Math.max(0, (book.highlightCount || 0) + delta) });
}

export default function HighlightList({ initialHighlights, bookId, books = {} }: HighlightListProps) {
  const [highlights, setHighlights] = useState(initialHighlights);
  const [prevInitial, setPrevInitial] = useState(initialHighlights);

  // Follow the parent when IndexedDB changes (sync, edits in another view)
  if (initialHighlights !== prevInitial) {
    setPrevInitial(initialHighlights);
    setHighlights(initialHighlights);
  }

  const toggleStar = async (id: string, current: boolean) => {
    const newFavorite = !current;
    setHighlights(prev => prev.map(h => (h._id === id ? { ...h, favorite: newFavorite } : h)));

    try {
      const db = await getDB();
      const highlight = db && (await db.get('highlights', id));
      if (db && highlight) await db.put('highlights', { ...highlight, favorite: newFavorite });
    } catch (e) {
      console.error('Failed to update local db', e);
    }

    try {
      if (!navigator.onLine) throw new Error('offline');
      const res = await fetch(`/api/highlights/${id}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: newFavorite })
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch {
      try {
        await queueAction('favorite', { id, favorite: newFavorite });
        toast.success('Saved offline');
      } catch {
        setHighlights(prev => prev.map(h => (h._id === id ? { ...h, favorite: current } : h)));
        toast.error('Failed to update favorite status');
      }
    }
  };

  const restore = async (removed: LocalHighlight, queuedOffline: boolean) => {
    setHighlights(prev =>
      prev.some(h => h._id === removed._id)
        ? prev
        : [...prev, removed].sort((a, b) => (a.locStart || 0) - (b.locStart || 0))
    );
    const db = await getDB();
    if (db) await db.put('highlights', removed);
    await adjustLocalBookCount(removed.bookId, 1);

    if (queuedOffline && db) {
      // The delete never reached the server: just cancel it
      const queue = await db.getAll('syncQueue');
      const tx = db.transaction('syncQueue', 'readwrite');
      for (const item of queue) {
        if (item.action === 'delete' && item.payload.id === removed._id) await tx.store.delete(item._id);
      }
      await tx.done;
    } else {
      try {
        const res = await fetch(`/api/highlights/${removed._id}/undelete`, { method: 'POST' });
        if (!res.ok && res.status !== 404) throw new Error();
      } catch {
        toast.error('Could not restore. Try again from Recently deleted in Settings.');
      }
    }
    notifyLocalChange();
  };

  const softDelete = async (removed: LocalHighlight) => {
    setHighlights(prev => prev.filter(h => h._id !== removed._id));

    const db = await getDB();
    if (db) await db.delete('highlights', removed._id);
    await adjustLocalBookCount(removed.bookId, -1);

    let queuedOffline = false;
    try {
      if (!navigator.onLine) throw new Error('offline');
      // Created offline and not synced yet: the delete must run after the queued create
      const pendingCreate = db && (await db.getAll('syncQueue')).some(q => q.action === 'create' && q.payload._id === removed._id);
      if (pendingCreate) throw new Error('unsynced');
      const res = await fetch(`/api/highlights/${removed._id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) throw new Error('Failed');
    } catch {
      await queueAction('delete', { id: removed._id });
      queuedOffline = true;
    }
    notifyLocalChange();

    toast('Highlight moved to Recently deleted', {
      action: { label: 'Undo', onClick: () => restore(removed, queuedOffline) }
    });
  };

  if (highlights.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">No highlights to show.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <AnimatePresence mode="popLayout" initial={false}>
        {highlights.map((h, i) => {
          const book = books[h.bookId];
          return (
            <motion.div
              key={h._id}
              layout
              className="group relative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: Math.min(i * 0.05, 0.5) }}
            >
              <p className="text-ink font-serif text-[1.25rem] leading-relaxed text-balance">{h.text}</p>

              {h.note && (
                <p className="mt-4 text-ink/80 font-serif text-[1.1rem] italic border-l-2 border-border pl-4">{h.note}</p>
              )}

              {!bookId && book && (
                <Link
                  href={`/read?book=${h.bookId}&highlight=${h._id}`}
                  className="mt-4 inline-block text-xs font-sans uppercase tracking-widest text-muted hover:text-ink transition-colors"
                >
                  {book.title}
                </Link>
              )}

              {/* Always visible on touch screens, revealed on hover with a mouse */}
              <div className="mt-4 flex items-center justify-between transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100">
                <div className="flex items-center space-x-2 text-sm text-muted font-sans">
                  {h.source === 'manual' && (
                    <span className="inline-flex items-center gap-1" title="Added by hand">
                      <PenLine className="w-3.5 h-3.5" />
                      {h.page ? '' : 'Added by hand'}
                    </span>
                  )}
                  {h.source === 'manual' && h.page ? <span>·</span> : null}
                  {h.page ? `Page ${h.page}` : ''}
                  {h.page && h.locStart ? ' · ' : ''}
                  {h.locStart ? (h.locStart === h.locEnd ? `Loc ${h.locStart}` : `Loc ${h.locStart}-${h.locEnd}`) : null}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => toggleStar(h._id, h.favorite)}
                    className="text-muted hover:text-star transition-colors focus:outline-none p-2"
                    aria-label={h.favorite ? 'Remove from favourites' : 'Add to favourites'}
                    aria-pressed={h.favorite}
                  >
                    <Star
                      className="w-5 h-5 transition-transform active:scale-90"
                      fill={h.favorite ? 'currentColor' : 'none'}
                      color={h.favorite ? 'var(--star)' : 'currentColor'}
                    />
                  </button>
                  <ShareCardButton
                    highlightId={h._id}
                    text={h.text}
                    bookTitle={book?.title || 'Kindle highlight'}
                    author={book?.author}
                  />
                  <button
                    onClick={() => softDelete(h)}
                    className="text-muted hover:text-destructive transition-colors focus:outline-none p-2"
                    aria-label="Delete highlight"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="absolute -bottom-6 left-0 right-0 h-px bg-border/50 hidden group-last:hidden sm:block" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
