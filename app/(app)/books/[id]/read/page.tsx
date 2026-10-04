import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Book } from '@/lib/models/Book';
import { Highlight } from '@/lib/models/Highlight';
import { notFound } from 'next/navigation';
import Reader from '@/components/Reader';

export default async function ReadBookPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return notFound();

  const resolvedParams = await params;

  await dbConnect();
  const book = await Book.findOne({ _id: resolvedParams.id, userId: session.user.id }).lean();
  if (!book) return notFound();

  const highlights = await Highlight.find({ 
    bookId: resolvedParams.id, 
    userId: session.user.id,
    deletedAt: null
  })
    .sort({ locStart: 1 })
    .lean();

  const safeHighlights = highlights.map(h => ({
    _id: h._id.toString(),
    text: h.text,
    note: h.note || undefined,
    locStart: h.locStart,
    locEnd: h.locEnd,
    page: h.page || undefined,
    favorite: h.favorite
  }));

  return (
    <Reader highlights={safeHighlights} bookId={resolvedParams.id} title={book.title} />
  );
}
