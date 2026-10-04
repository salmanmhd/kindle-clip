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
    
    // Fetch all books for the user
    const books = await Book.find({ userId: session.user.id }).lean();
    
    // Fetch all non-deleted highlights for the user
    const highlights = await Highlight.find({ 
      userId: session.user.id,
      deletedAt: null
    }).lean();

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
      }))
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
