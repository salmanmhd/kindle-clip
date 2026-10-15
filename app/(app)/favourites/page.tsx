'use client';

import { useIDBQuery, LocalHighlight } from '@/lib/indexeddb';
import HighlightList from '@/components/HighlightList';

const EMPTY: LocalHighlight[] = [];

export default function FavouritesPage() {
  const { data, loading } = useIDBQuery(async (db) => {
    // Stored booleans aren't valid IndexedDB keys, so the by-favorite index can't be queried
    const all = await db.getAll('highlights');
    const favourites = all.filter(h => h.favorite).sort((a, b) => b.syncedAt - a.syncedAt);
    const books = await db.getAll('books');
    return {
      favourites,
      books: Object.fromEntries(books.map(b => [b._id, { title: b.title, author: b.author }]))
    };
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin mb-4" />
      </div>
    );
  }

  const favourites = data?.favourites ?? EMPTY;

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-12 flex justify-between items-baseline">
        <h1 className="text-3xl font-serif text-ink">Favourites</h1>
        <span className="text-muted text-sm">{favourites.length} saved</span>
      </div>

      <HighlightList initialHighlights={favourites} books={data?.books} />
    </div>
  );
}
