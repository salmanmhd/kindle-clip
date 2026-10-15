'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIDBQuery, getDB, LocalHighlight, LocalBook } from '@/lib/indexeddb';
import Link from 'next/link';

export default function DashboardRandomHighlight() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [seed, setSeed] = useState(Date.now());

  const { data: highlights } = useIDBQuery(async (db) => {
    const all = await db.getAll('highlights');
    return all.sort(() => Math.random() - 0.5);
  }, [seed]);

  const [bookTitle, setBookTitle] = useState('');

  useEffect(() => {
    if (highlights && highlights.length > currentIndex) {
      const p = getDB();
      if (p) {
        p.then(db => {
          if (!db) return;
          db.get('books', highlights[currentIndex].bookId).then(b => {
            setBookTitle(b?.title || 'Unknown Book');
          });
        });
      }
    }
  }, [currentIndex, highlights]);

  if (!highlights || highlights.length === 0) return null;

  const current = highlights[currentIndex % highlights.length];

  const handleSwipe = (direction: number) => {
    setCurrentIndex(prev => prev + 1);
  };

  return (
    <div className="w-full relative h-[300px] sm:h-[400px] mb-12 flex flex-col items-center justify-center overflow-hidden">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -20, filter: 'blur(10px)' }}
          transition={{ duration: 0.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = Math.abs(offset.x) * velocity.x;
            if (swipe < -10000 || offset.x < -100 || swipe > 10000 || offset.x > 100) {
              handleSwipe(1);
            }
          }}
          className="absolute inset-0 bg-card/50 backdrop-blur-md border border-border rounded-xl p-8 sm:p-12 shadow-sm flex flex-col justify-center items-center cursor-grab active:cursor-grabbing text-center"
        >
          <p className="font-serif text-xl sm:text-2xl text-ink leading-relaxed line-clamp-6 pointer-events-none select-none">
            {current.text}
          </p>
          {current.note && (
            <p className="mt-4 text-ink/80 font-serif italic border-t border-border pt-4 px-4 pointer-events-none select-none">
              {current.note}
            </p>
          )}
          <Link 
            href={`/read?book=${current.bookId}`}
            className="mt-6 text-sm font-sans uppercase tracking-widest text-muted hover:text-ink transition-colors"
          >
            {bookTitle}
          </Link>
          
          <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-30 text-xs text-muted font-sans uppercase tracking-widest pointer-events-none select-none">
            Swipe for another
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
