'use client';

import { Suspense, useEffect, useState } from 'react';
import { useIDBQuery, LocalBook } from '@/lib/indexeddb';
import HighlightList from '@/components/HighlightList';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function BookPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { data: book, loading: bookLoading } = useIDBQuery(async (db) => {
    if (!id) return null;
    return await db.get('books', id);
  });

  const { data: highlights, loading: hlLoading } = useIDBQuery(async (db) => {
    if (!id) return [];
    const all = await db.getAllFromIndex('highlights', 'by-bookId', id);
    return all.sort((a, b) => (a.locStart || 0) - (b.locStart || 0));
  });

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

  const safeHighlights = (highlights || []).map(h => ({
    ...h,
    _id: h._id,
    userId: h.userId,
    bookId: h.bookId,
    syncedAt: h.syncedAt,
  }));

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      <Link href="/library" className="inline-flex items-center space-x-2 text-sm text-muted hover:text-ink transition-colors mb-12">
        <ArrowLeft className="w-4 h-4" />
        <span>Library</span>
      </Link>

      <div className="mb-16 flex flex-col sm:flex-row sm:items-end justify-between space-y-6 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">{book.title}</h1>
          {book.author && <p className="text-lg text-muted">{book.author}</p>}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
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
        </div>
      </div>

      <HighlightList initialHighlights={safeHighlights as any} bookId={id} />
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
