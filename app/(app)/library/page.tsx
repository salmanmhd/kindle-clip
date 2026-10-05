'use client';

import Link from 'next/link';
import { BookOpen, ScrollText } from 'lucide-react';
import DashboardRandomHighlight from '@/components/DashboardRandomHighlight';
import { useIDBQuery } from '@/lib/indexeddb';

export default function LibraryPage() {
  const { data: books, loading: booksLoading } = useIDBQuery(async (db) => {
    const all = await db.getAll('books');
    return all.sort((a, b) => b.highlightCount - a.highlightCount);
  });

  const { data: totalHighlights } = useIDBQuery(async (db) => {
    return await db.count('highlights');
  });

  if (booksLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-6 lg:px-12 flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin mb-4" />
          <p className="text-muted font-sans text-sm uppercase tracking-widest">Loading Library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 lg:px-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header & Stats */}
      <div className="mb-16">
        <h1 className="text-3xl font-serif text-ink mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card/30 border border-border rounded-xl p-6 flex flex-col justify-between h-32 backdrop-blur-md">
            <BookOpen className="w-5 h-5 text-muted" />
            <div>
              <p className="text-2xl font-serif text-ink">{books?.length || 0}</p>
              <p className="text-xs font-sans uppercase tracking-widest text-muted mt-1">Books</p>
            </div>
          </div>
          <div className="bg-card/30 border border-border rounded-xl p-6 flex flex-col justify-between h-32 backdrop-blur-md">
            <ScrollText className="w-5 h-5 text-muted" />
            <div>
              <p className="text-2xl font-serif text-ink">{totalHighlights || 0}</p>
              <p className="text-xs font-sans uppercase tracking-widest text-muted mt-1">Highlights</p>
            </div>
          </div>
        </div>
      </div>

      <DashboardRandomHighlight />

      {!books || books.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-xl">
          <p className="text-muted font-serif">Nothing here yet. Upload your clippings to begin.</p>
        </div>
      ) : (
        <>
          <h2 className="text-sm font-sans uppercase tracking-widest text-muted mb-6">Your Library</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map(b => (
              <Link 
                key={b._id}
                href={`/books/${b._id}/read`}
                className="group flex flex-col bg-card/30 border border-border rounded-xl p-6 hover:bg-secondary/20 transition-all hover:-translate-y-1 hover:shadow-sm"
              >
                <div className="aspect-[2/3] w-full bg-gradient-to-br from-secondary/50 to-background rounded-lg border border-border mb-4 flex flex-col items-center justify-center p-4 text-center">
                  <h3 className="font-serif text-ink font-medium leading-snug line-clamp-3 group-hover:text-ink/80 transition-colors">
                    {b.title}
                  </h3>
                </div>
                
                <div className="flex-1">
                  {b.author && (
                    <p className="text-xs font-sans text-muted mb-3 truncate">{b.author}</p>
                  )}
                  <div className="flex items-center space-x-1 text-xs text-muted/80 font-sans mt-auto">
                    <span>{b.highlightCount}</span>
                    <span>highlights</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
