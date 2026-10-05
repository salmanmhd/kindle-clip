'use client';

import { useIDBQuery } from '@/lib/indexeddb';
import Reader from '@/components/Reader';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ReadBookPageContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('book');
  
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
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center space-y-4">
        <p className="font-serif text-xl text-ink">No book specified</p>
        <Link href="/library" className="text-sm font-sans uppercase tracking-widest text-muted hover:text-ink">
          Return to Library
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex h-[calc(100vh-64px)] flex-col items-center justify-center space-y-4">
        <p className="font-serif text-xl text-ink">Book not found</p>
        <Link href="/library" className="text-sm font-sans uppercase tracking-widest text-muted hover:text-ink">
          Return to Library
        </Link>
      </div>
    );
  }

  const safeHighlights = (highlights || []).map(h => ({
    _id: h._id,
    text: h.text,
    note: h.note,
    locStart: h.locStart,
    locEnd: h.locEnd,
    page: h.page,
    favorite: h.favorite
  }));

  return (
    <Reader highlights={safeHighlights} bookId={id} title={book.title} />
  );
}

export default function ReadBookPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" />
      </div>
    }>
      <ReadBookPageContent />
    </Suspense>
  );
}
