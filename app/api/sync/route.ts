import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Book } from '@/lib/models/Book';
import { Highlight } from '@/lib/models/Highlight';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();

    // Take the timestamp before querying so writes that land mid-request are picked up next time
    const timestamp = new Date().toISOString();

    const url = new URL(req.url);
    const updatedSince = url.searchParams.get('since');

    const bookQuery: any = { userId: session.user.id };
    // Soft-deleted highlights never go to the client; deletions are sent as ids below
    const highlightQuery: any = { userId: session.user.id, deletedAt: null };
    if (updatedSince) {
      bookQuery.updatedAt = { $gt: new Date(updatedSince) };
      highlightQuery.updatedAt = { $gt: new Date(updatedSince) };
    }

    const books = await Book.find(bookQuery).lean();
    const highlights = await Highlight.find(highlightQuery).lean();

    let deletedHighlightIds: string[] = [];
    if (updatedSince) {
      const deletedHighlights = await Highlight.find({
        userId: session.user.id,
        deletedAt: { $gt: new Date(updatedSince) }
      }).select('_id').lean();
      deletedHighlightIds = deletedHighlights.map(h => (h as any)._id.toString());
    }

    return NextResponse.json({
      books: books.map(b => ({
        ...b,
        _id: b._id.toString(),
        userId: b.userId.toString()
      })),
      highlights: highlights.map(h => ({
        ...h,
        _id: h._id.toString(),
        userId: h.userId.toString(),
        bookId: h.bookId.toString()
      })),
      deletedHighlightIds,
      timestamp
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
