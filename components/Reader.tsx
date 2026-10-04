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
  
  // Font controls
  const [fontSize, setFontSize] = useState(24);
  const [lineHeight, setLineHeight] = useState(1.6);
  
  // Note editing
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState('');

  // Sync with local storage
  useEffect(() => {
    const saved = localStorage.getItem(`reader_pos_${bookId}`);
    if (saved && !shuffleMode) {
      setCurrentIndex(Math.min(parseInt(saved, 10), highlights.length - 1));
    }
    const savedSize = localStorage.getItem('reader_fontSize');
    if (savedSize) setFontSize(parseInt(savedSize, 10));
    const savedLineHeight = localStorage.getItem('reader_lineHeight');
    if (savedLineHeight) setLineHeight(parseFloat(savedLineHeight));
  }, [bookId, highlights.length, shuffleMode]);

  const saveSettings = (newSize: number, newHeight: number) => {
    localStorage.setItem('reader_fontSize', newSize.toString());
    localStorage.setItem('reader_lineHeight', newHeight.toString());
    setFontSize(newSize);
    setLineHeight(newHeight);
  };

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
  
  const saveNote = async () => {
    try {
      const res = await fetch(`/api/highlights/${current._id}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: editingNote })
      });
      if (res.ok) {
        const newList = [...displayList];
        newList[currentIndex] = { ...newList[currentIndex], note: editingNote };
        setDisplayList(newList);
        setIsEditing(false);
        toast.success('Note saved');
      } else {
        toast.error('Failed to save note');
      }
    } catch (error) {
      toast.error('Error saving note');
    }
  };

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
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-50">
        <Link 
          href={`/books/${bookId}`} 
          className="flex items-center space-x-2 text-muted hover:text-ink transition-colors group"
          aria-label="Back to book"
        >
          <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
          <span className="font-sans text-sm hidden sm:inline">Back to book</span>
        </Link>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 border border-border rounded-full p-1 bg-popover shadow-sm mr-2 hidden sm:flex">
            <button 
              onClick={() => saveSettings(Math.max(16, fontSize - 2), lineHeight)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-ink hover:bg-secondary transition-colors font-serif text-sm"
              title="Decrease font size"
            >
              A-
            </button>
            <button 
              onClick={() => saveSettings(Math.min(48, fontSize + 2), lineHeight)}
              className="w-8 h-8 flex items-center justify-center rounded-full text-ink hover:bg-secondary transition-colors font-serif text-lg"
              title="Increase font size"
            >
              A+
            </button>
          </div>
          
          <button 
            onClick={toggleShuffle} 
            className={`transition-colors p-2 -mr-2 ${shuffleMode ? 'text-ink' : 'text-muted hover:text-ink'}`}
            title="Shuffle Mode"
            aria-label={shuffleMode ? "Disable shuffle" : "Enable shuffle"}
            aria-pressed={shuffleMode}
          >
            <Shuffle className="w-5 h-5" aria-hidden="true" />
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
              // Trigger on fast swipe OR large drag distance
              if (swipe < -10000 || offset.x < -100) {
                paginate(1);
              } else if (swipe > 10000 || offset.x > 100) {
                paginate(-1);
              }
            }}
            className="absolute w-full px-6 flex flex-col justify-center items-center cursor-grab active:cursor-grabbing"
          >
            {current.favorite && (
              <Bookmark className="absolute -top-12 text-muted/50 w-6 h-6 fill-current" />
            )}
            
            <p 
              className="text-ink font-serif text-center text-balance select-none transition-all duration-300"
              style={{ fontSize: `${fontSize}px`, lineHeight }}
            >
              {current.text}
            </p>

              <p 
                className="mt-8 text-ink/80 font-serif italic text-center select-none border-t border-border pt-8 max-w-md transition-all duration-300"
                style={{ fontSize: `${Math.max(14, fontSize - 8)}px`, lineHeight }}
                onDoubleClick={() => {
                  setEditingNote(current.note || '');
                  setIsEditing(true);
                }}
              >
                {current.note}
              </p>
            )}

            {!current.note && !isEditing && (
              <button 
                onClick={() => {
                  setEditingNote('');
                  setIsEditing(true);
                }}
                className="mt-8 text-xs uppercase tracking-widest text-muted hover:text-ink transition-colors font-sans"
              >
                + Add Note
              </button>
            )}

            {isEditing && (
              <div className="mt-8 w-full max-w-md" onPointerDownCapture={(e) => e.stopPropagation()}>
                <textarea
                  value={editingNote}
                  onChange={(e) => setEditingNote(e.target.value)}
                  className="w-full bg-secondary/30 border border-border rounded p-3 text-ink font-serif focus:ring-1 focus:ring-ink focus:outline-none resize-none"
                  rows={3}
                  placeholder="Type your note here..."
                  autoFocus
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-sans uppercase tracking-widest text-muted hover:text-ink px-2 py-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveNote}
                    className="text-xs font-sans uppercase tracking-widest bg-ink text-background hover:bg-ink/90 px-3 py-1 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Minimalist Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12 flex justify-between items-end z-50 pointer-events-none">
        
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
            className="text-muted hover:text-ink disabled:opacity-30 transition-all active:scale-95 p-2 -ml-2"
            aria-label="Previous highlight"
          >
            <ChevronLeft className="w-8 h-8 stroke-[1.5]" aria-hidden="true" />
          </button>
          
          <span className="text-muted font-sans text-sm font-medium tracking-widest w-12 text-center tabular-nums" aria-live="polite">
            {currentIndex + 1} <span className="sr-only">out of</span> / {displayList.length}
          </span>

          <button 
            onClick={() => paginate(1)} 
            disabled={currentIndex === displayList.length - 1}
            className="text-muted hover:text-ink disabled:opacity-30 transition-all active:scale-95 p-2 -mr-2"
            aria-label="Next highlight"
          >
            <ChevronRight className="w-8 h-8 stroke-[1.5]" aria-hidden="true" />
          </button>
        </div>
        
      </div>
    </div>
  );
}
