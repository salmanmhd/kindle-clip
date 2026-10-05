'use client';

import { useIDBQuery } from '@/lib/indexeddb';
import HighlightList from '@/components/HighlightList';

export default function FavouritesPage() {
  const { data: highlights, loading } = useIDBQuery(async (db) => {
    const allFavs = await db.getAllFromIndex('highlights', 'by-favorite', 1);
    // Sort by syncedAt descending as an approximation for updatedAt
    return allFavs.sort((a, b) => b.syncedAt - a.syncedAt);
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 flex justify-center items-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin mb-4" />
      </div>
    );
  }

  const safeHighlights = (highlights || []).map(h => ({
    _id: h._id,
    userId: h.userId,
    bookId: h.bookId,
    text: h.text,
    note: h.note,
    locStart: h.locStart,
    locEnd: h.locEnd,
    page: h.page,
    favorite: h.favorite,
    // Provide string dates for HighlightList compatibility if needed, or update HighlightList to accept IDB format
    syncedAt: h.syncedAt
  }));

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-12 flex justify-between items-baseline">
        <h1 className="text-3xl font-serif text-ink">Favourites</h1>
        <span className="text-muted text-sm">{safeHighlights.length} saved</span>
      </div>

      <HighlightList initialHighlights={safeHighlights as any} />
    </div>
  );
}
