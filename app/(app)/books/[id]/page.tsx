import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Book } from '@/lib/models/Book';
import { Highlight } from '@/lib/models/Highlight';
import { notFound } from 'next/navigation';
import HighlightList from '@/components/HighlightList';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return notFound();

  const resolvedParams = await params;

  await dbConnect();
  const book = await Book.findOne({ _id: resolvedParams.id, userId: session.user.id }).lean();
  if (!book) return notFound();

  // Load highlights in location order, excluding soft-deleted ones
  const highlights = await Highlight.find({ 
    bookId: resolvedParams.id, 
    userId: session.user.id,
    deletedAt: null
  })
    .sort({ locStart: 1 })
    .lean();

  // Need to stringify ObjectIds for client component
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
      
      <Link href="/" className="inline-flex items-center space-x-2 text-sm text-muted hover:text-ink transition-colors mb-12">
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
            href={`/books/${resolvedParams.id}/read`}
            className="w-full sm:w-auto inline-flex items-center justify-center bg-ink text-background px-6 py-2 rounded font-sans text-sm hover:bg-ink/90 transition-colors"
          >
            Read highlights
          </Link>
          <a
            href={`/api/export/${resolvedParams.id}`}
            download
            className="w-full sm:w-auto inline-flex items-center justify-center bg-secondary text-ink px-6 py-2 rounded font-sans text-sm hover:bg-secondary/80 transition-colors border border-border"
          >
            Export Markdown
          </a>
        </div>
      </div>

      <HighlightList initialHighlights={safeHighlights} bookId={resolvedParams.id} />
    </div>
  );
}
