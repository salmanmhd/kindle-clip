'use client';

import { useState } from 'react';
import { useIDBQuery } from '@/lib/indexeddb';
import Link from 'next/link';
import { Search as SearchIcon, BookOpen } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  const { data: results } = useIDBQuery(async (db) => {
    if (query.trim().length < 2) return [];

    const lowerQuery = query.toLowerCase();
    
    const allHighlights = await db.getAll('highlights');
    const matches = allHighlights.filter(h => 
      h.text.toLowerCase().includes(lowerQuery) || 
      (h.note?.toLowerCase() || '').includes(lowerQuery)
    );

    // Attach book titles
    const bookIds = Array.from(new Set(matches.map(m => m.bookId)));
    const bookPromises = bookIds.map(id => db.get('books', id));
    const books = (await Promise.all(bookPromises)).filter(b => !!b);
    const bookMap = new Map(books.map(b => [b!._id, b!.title]));

    return matches.map(m => ({
      ...m,
      bookTitle: bookMap.get(m.bookId) || 'Unknown Book'
    }));
  }, [query]);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="mb-8 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-muted" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search highlights and notes..."
          className="block w-full pl-10 pr-3 py-3 border border-border rounded bg-popover text-ink focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring placeholder-muted transition-colors"
          autoFocus
        />
      </div>

      <div className="space-y-6">
        {results?.length === 0 && query.trim().length >= 2 && (
          <p className="text-muted text-center py-10">No matches found for "{query}"</p>
        )}

        {results?.map(h => (
          <div key={h._id} className="border-b border-border pb-6 last:border-0">
            <Link href={`/read?book=${h.bookId}`} className="group block">
              <p className="text-ink font-serif text-lg leading-relaxed group-hover:text-ink/80 transition-colors">
                {h.text}
              </p>
              {h.note && (
                <p className="mt-2 text-ink/80 font-serif italic border-l-2 border-border pl-3">
                  {h.note}
                </p>
              )}
              <div className="mt-3 flex items-center space-x-2 text-xs text-muted font-sans uppercase tracking-widest">
                <BookOpen className="w-3 h-3" />
                <span>{h.bookTitle}</span>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
