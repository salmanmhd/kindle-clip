'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { LocalBook } from '@/lib/indexeddb';
import { getReadingProgress, ReadingProgress } from '@/lib/reading-progress';
import BookCover from '@/components/BookCover';

function timeAgo(at: number) {
  const mins = Math.round((Date.now() - at) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(at).toLocaleDateString();
}

// "Pick up where you left off": the last book opened in the reader on this device
export default function ContinueReading({ books }: { books: LocalBook[] }) {
  // Only rendered after the library loads from IndexedDB, i.e. never during SSR/hydration
  const [progress] = useState<ReadingProgress | null>(() => (typeof window === 'undefined' ? null : getReadingProgress()));

  const book = progress && books.find(b => b._id === progress.bookId);
  if (!progress || !book) return null;

  const total = Math.max(book.highlightCount || progress.total, 1);
  const position = Math.min(progress.index + 1, total);
  const finished = position >= total;
  const percent = Math.round((position / total) * 100);

  return (
    <section className="mb-12" aria-labelledby="continue-reading">
      <h2 id="continue-reading" className="text-sm font-sans uppercase tracking-widest text-muted mb-4">
        Pick up where you left off
      </h2>
      <Link
        href={`/read?book=${book._id}`}
        className="group flex items-center gap-5 bg-card/30 border border-border rounded-xl p-4 sm:p-5 backdrop-blur-md hover:bg-secondary/20 transition-colors"
      >
        <BookCover title={book.title} coverUrl={book.coverUrl} compact className="w-14 sm:w-16 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-serif text-lg text-ink leading-snug line-clamp-2">{book.title}</p>
          {book.author && <p className="text-sm text-muted truncate">{book.author}</p>}
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1 flex-1 max-w-56 rounded-full bg-secondary overflow-hidden" aria-hidden="true">
              <div className="h-full bg-ink/70 rounded-full" style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs text-muted tabular-nums shrink-0">
              {finished ? 'Finished' : `${position} of ${total}`} · {timeAgo(progress.at)}
            </span>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-sm text-ink shrink-0 group-hover:translate-x-0.5 transition-transform">
          {finished ? 'Open' : 'Continue'}
          <ArrowRight className="w-4 h-4" />
        </span>
        <ArrowRight className="sm:hidden w-5 h-5 text-muted shrink-0" />
      </Link>
    </section>
  );
}
