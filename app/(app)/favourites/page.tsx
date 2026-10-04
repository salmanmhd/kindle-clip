import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Highlight } from '@/lib/models/Highlight';
import HighlightList from '@/components/HighlightList';
import { Book } from '@/lib/models/Book';

export default async function FavouritesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  await dbConnect();
  
  const highlights = await Highlight.find({ 
    userId: session.user.id,
    favorite: true,
    deletedAt: null
  })
    .sort({ updatedAt: -1 })
    .lean();

  const safeHighlights = highlights.map(h => ({
    ...h,
    _id: h._id.toString(),
    userId: h.userId.toString(),
    bookId: h.bookId.toString(),
    highlightedAt: h.highlightedAt?.toISOString() || null,
    createdAt: h.createdAt?.toISOString(),
    updatedAt: h.updatedAt?.toISOString()
  }));

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-12 flex justify-between items-baseline">
        <h1 className="text-3xl font-serif text-ink">Favourites</h1>
        <span className="text-muted text-sm">{highlights.length} saved</span>
      </div>

      <HighlightList initialHighlights={safeHighlights} />
    </div>
  );
}
