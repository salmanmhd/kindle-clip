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
    
    const url = new URL(req.url);
    const updatedSince = url.searchParams.get('since');
    
    let query: any = { userId: session.user.id };
    if (updatedSince) {
      query.updatedAt = { $gt: new Date(updatedSince) };
    }
    
    // Fetch books for the user
    const books = await Book.find(query).lean();
    
    // Fetch highlights for the user
    const highlights = await Highlight.find(query).lean();
    
    // Fetch deleted highlights for the user if updatedSince
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
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
