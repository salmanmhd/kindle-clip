'use client';

import { useState } from 'react';
import { Star, MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { getDB } from '@/lib/indexeddb';

export default function HighlightList({ initialHighlights, bookId }: { initialHighlights: any[], bookId?: string }) {
  const [highlights, setHighlights] = useState(initialHighlights);

  const toggleStar = async (id: string, current: boolean) => {
    const newFavorite = !current;
    
    // Optimistic update
    setHighlights(prev => prev.map(h => h._id === id ? { ...h, favorite: newFavorite } : h));
    
    // Update IDB cache immediately
    try {
      const db = await getDB();
      if (db) {
        const highlight = await db.get('highlights', id);
        if (highlight) {
          await db.put('highlights', { ...highlight, favorite: newFavorite });
        }
      }
    } catch (e) {
      console.error('Failed to update local db', e);
    }

    if (!navigator.onLine) {
      // Offline queue
      try {
        const db = await getDB();
        if (db) {
          await db.put('syncQueue', {
            _id: `fav_${id}_${Date.now()}`,
            action: 'favorite',
            payload: { id, favorite: newFavorite },
            timestamp: Date.now()
          });
        }
        toast.success('Saved offline');
      } catch (e) {
        console.error('Failed to queue action', e);
      }
      return;
    }

    try {
      const res = await fetch(`/api/highlights/${id}/star`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: newFavorite })
      });
      if (!res.ok) throw new Error('Failed to update');
    } catch (err) {
      // If network fails despite being "online", queue it
      try {
        const db = await getDB();
        if (db) {
          await db.put('syncQueue', {
            _id: `fav_${id}_${Date.now()}`,
            action: 'favorite',
            payload: { id, favorite: newFavorite },
            timestamp: Date.now()
          });
        }
        toast.success('Saved offline (network error)');
      } catch (e) {
        setHighlights(prev => prev.map(h => h._id === id ? { ...h, favorite: current } : h));
        toast.error('Failed to update favorite status');
      }
    }
  };

  const softDelete = async (id: string) => {
    // Optimistic update
    setHighlights(prev => prev.filter(h => h._id !== id));
    toast('Highlight removed', {
      action: {
        label: 'Undo',
        onClick: async () => {
          // Un-delete
          setHighlights(initialHighlights); // simplest rollback for now
          await fetch(`/api/highlights/${id}/undelete`, { method: 'POST' });
        }
      }
    });

    try {
      await fetch(`/api/highlights/${id}`, { method: 'DELETE' });
    } catch (err) {
      toast.error('Failed to remove highlight');
    }
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
      <AnimatePresence mode="popLayout">
      {highlights.map((h, i) => (
        <motion.div 
          key={h._id} 
          className="group relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ delay: Math.min(i * 0.05, 0.5) }}
        >
          <p className="text-ink font-serif text-[1.25rem] leading-relaxed text-balance">
            {h.text}
          </p>
          
          {h.note && (
            <p className="mt-4 text-ink/80 font-serif text-[1.1rem] italic border-l-2 border-border pl-4">
              {h.note}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center space-x-2 text-sm text-muted font-sans">
              {h.page ? `Page ${h.page}` : ''}
              {h.page && h.locStart ? ' · ' : ''}
              {h.locStart && (h.locStart === h.locEnd ? `Loc ${h.locStart}` : `Loc ${h.locStart}-${h.locEnd}`)}
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => toggleStar(h._id, h.favorite)}
                className="text-muted hover:text-star transition-colors focus:outline-none"
                aria-label="Toggle favorite"
              >
                <Star 
                  className="w-5 h-5 transition-transform active:scale-90" 
                  fill={h.favorite ? 'currentColor' : 'none'} 
                  color={h.favorite ? 'var(--star)' : 'currentColor'}
                />
              </button>
              
              <div className="relative group/menu">
                <button className="text-muted hover:text-ink transition-colors focus:outline-none">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                <div className="absolute right-0 bottom-full mb-2 hidden group-hover/menu:block">
                  <div className="bg-popover border border-border rounded shadow-sm overflow-hidden min-w-[120px]">
                    <button 
                      onClick={() => softDelete(h._id)}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-secondary/50 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-6 left-0 right-0 h-px bg-border/50 hidden group-last:hidden sm:block" />
        </motion.div>
      ))}
      </AnimatePresence>
    </div>
  );
}
