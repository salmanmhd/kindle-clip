'use client';

import { Suspense } from 'react';
import { useIDBQuery, LocalHighlight } from '@/lib/indexeddb';
import HighlightList from '@/components/HighlightList';
import BookCover from '@/components/BookCover';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

const EMPTY: LocalHighlight[] = [];

function BookPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { data: book, loading: bookLoading } = useIDBQuery(async (db) => {
    if (!id) return null;
    return await db.get('books', id);
  }, [id]);

  const { data: highlights, loading: hlLoading } = useIDBQuery(async (db) => {
    if (!id) return [];
    const all = await db.getAllFromIndex('highlights', 'by-bookId', id);
    return all.sort((a, b) => (a.locStart || 0) - (b.locStart || 0));
  }, [id]);

  const isLoading = bookLoading || hlLoading;

  if (!id) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <h1 className="text-2xl font-serif mb-4">No book specified</h1>
        <Link href="/library" className="text-muted hover:text-ink">Return to Library</Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin mb-4" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="max-w-3xl mx-auto py-24 text-center">
        <h1 className="text-2xl font-serif mb-4">Book not found</h1>
        <Link href="/library" className="text-muted hover:text-ink">Return to Library</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

      <Link href="/library" className="inline-flex items-center space-x-2 text-sm text-muted hover:text-ink transition-colors mb-12">
        <ArrowLeft className="w-4 h-4" />
        <span>Library</span>
      </Link>

      <div className="mb-16 flex flex-col gap-8">
        <div className="flex items-end gap-5 sm:gap-6">
          <BookCover title={book.title} coverUrl={book.coverUrl} compact className="w-20 sm:w-28 shrink-0 shadow-sm" />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-serif text-ink mb-2 text-balance">{book.title}</h1>
            {book.author && <p className="text-lg text-muted">{book.author}</p>}
            <p className="text-xs font-sans uppercase tracking-widest text-muted mt-2">
              {book.highlightCount} highlight{book.highlightCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <Link 
            href={`/read?book=${id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-ink text-background px-6 py-2 rounded font-sans text-sm hover:bg-ink/90 transition-colors"
          >
            Read highlights
          </Link>
          <a
            href={`/api/export/${id}`}
            download
            className="w-full sm:w-auto inline-flex items-center justify-center bg-secondary text-ink px-6 py-2 rounded font-sans text-sm hover:bg-secondary/80 transition-colors border border-border"
          >
            Export Markdown
          </a>
          <Link
            href={`/add?book=${id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-ink px-3 py-2 rounded font-sans text-sm hover:bg-secondary/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </Link>
        </div>
      </div>

      <HighlightList
        initialHighlights={highlights ?? EMPTY}
        bookId={id}
        books={{ [book._id]: { title: book.title, author: book.author } }}
      />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin mb-4" />
      </div>
    }>
      <BookPageContent />
    </Suspense>
  );
}
