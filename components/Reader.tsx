'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shuffle, Settings, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Highlight {
  _id: string;
  text: string;
  note?: string;
  locStart?: number;
  locEnd?: number;
  page?: number;
  favorite: boolean;
}

export default function Reader({ highlights, bookId, title }: { highlights: Highlight[], bookId: string, title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [shuffleMode, setShuffleMode] = useState(false);
  const [displayList, setDisplayList] = useState(highlights);

  // Sync with local storage to remember last read position
  useEffect(() => {
    const saved = localStorage.getItem(`reader_pos_${bookId}`);
    if (saved && !shuffleMode) {
      setCurrentIndex(Math.min(parseInt(saved, 10), highlights.length - 1));
    }
  }, [bookId, highlights.length, shuffleMode]);

  const savePosition = (index: number) => {
    if (!shuffleMode) {
      localStorage.setItem(`reader_pos_${bookId}`, index.toString());
    }
  };

  const toggleShuffle = () => {
    if (!shuffleMode) {
      const shuffled = [...highlights].sort(() => Math.random() - 0.5);
      setDisplayList(shuffled);
      setCurrentIndex(0);
      setShuffleMode(true);
      toast('Shuffle mode activated', { icon: '🔀' });
    } else {
      setDisplayList(highlights);
      const saved = localStorage.getItem(`reader_pos_${bookId}`);
      setCurrentIndex(saved ? Math.min(parseInt(saved, 10), highlights.length - 1) : 0);
      setShuffleMode(false);
      toast('Returned to chronological order', { icon: '⏱️' });
    }
  };

  const paginate = (newDirection: number) => {
    if (currentIndex + newDirection < 0 || currentIndex + newDirection >= displayList.length) {
      return;
    }
    setDirection(newDirection);
    setCurrentIndex(prev => {
      const next = prev + newDirection;
      savePosition(next);
      return next;
    });
  };

  if (displayList.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted font-sans">No highlights found.</p>
      </div>
    );
  }

  const current = displayList[currentIndex];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center overflow-hidden selection:bg-muted/30">
      
      {/* Minimalist Top Nav */}
      <div className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <Link 
          href={`/books/${bookId}`} 
          className="flex items-center space-x-2 text-muted hover:text-ink transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-sans text-sm hidden sm:inline">Back to book</span>
        </Link>

        <div className="flex items-center space-x-6">
          <button 
            onClick={toggleShuffle} 
            className={`transition-colors ${shuffleMode ? 'text-ink' : 'text-muted hover:text-ink'}`}
            title="Shuffle Mode"
          >
            <Shuffle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Reader Card */}
      <div className="w-full max-w-2xl px-6 relative flex flex-col items-center h-[60vh] justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current._id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = Math.abs(offset.x) * velocity.x;
              if (swipe < -10000) {
                paginate(1);
              } else if (swipe > 10000) {
                paginate(-1);
              }
            }}
            className="absolute w-full px-6 flex flex-col justify-center items-center cursor-grab active:cursor-grabbing"
          >
            {current.favorite && (
              <Bookmark className="absolute -top-12 text-muted/50 w-6 h-6 fill-current" />
            )}
            
            <p className="text-ink font-serif text-[1.5rem] sm:text-[2rem] leading-relaxed text-center text-balance select-none">
              {current.text}
            </p>

            {current.note && (
              <p className="mt-8 text-ink/80 font-serif text-[1.1rem] sm:text-[1.25rem] italic text-center select-none border-t border-border pt-8 max-w-md">
                {current.note}
              </p>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* Minimalist Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 p-8 sm:p-12 flex justify-between items-end z-50 pointer-events-none">
        
        <div className="flex flex-col space-y-1">
          <span className="text-muted/60 font-sans text-xs uppercase tracking-widest">{title}</span>
          <span className="text-muted font-sans text-sm">
            {current.page ? `Page ${current.page}` : ''}
            {current.page && current.locStart ? ' · ' : ''}
            {current.locStart && (current.locStart === current.locEnd ? `Loc ${current.locStart}` : `Loc ${current.locStart}-${current.locEnd}`)}
          </span>
        </div>

        <div className="flex items-center space-x-8 pointer-events-auto">
          <button 
            onClick={() => paginate(-1)} 
            disabled={currentIndex === 0}
            className="text-muted hover:text-ink disabled:opacity-30 transition-all active:scale-95 p-2"
          >
            <ChevronLeft className="w-8 h-8 stroke-[1.5]" />
          </button>
          
          <span className="text-muted font-sans text-sm font-medium tracking-widest w-12 text-center tabular-nums">
            {currentIndex + 1} / {displayList.length}
          </span>

          <button 
            onClick={() => paginate(1)} 
            disabled={currentIndex === displayList.length - 1}
            className="text-muted hover:text-ink disabled:opacity-30 transition-all active:scale-95 p-2"
          >
            <ChevronRight className="w-8 h-8 stroke-[1.5]" />
          </button>
        </div>
        
      </div>
    </div>
  );
}
