import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Book } from '@/lib/models/Book';
import { Highlight } from '@/lib/models/Highlight';

// Recently deleted highlights, newest first
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const deleted = await Highlight.find({ userId: session.user.id, deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 })
      .limit(200)
      .select('bookId text note page locStart locEnd deletedAt')
      .lean();

    const bookIds = Array.from(new Set(deleted.map(h => h.bookId.toString())));
    const books = await Book.find({ _id: { $in: bookIds }, userId: session.user.id })
      .select('title author')
      .lean();
    const bookMap = new Map(books.map(b => [b._id.toString(), b]));

    return NextResponse.json({
      highlights: deleted.map(h => {
        const book = bookMap.get(h.bookId.toString());
        return {
          _id: h._id.toString(),
          bookId: h.bookId.toString(),
          bookTitle: book?.title || 'Unknown book',
          bookAuthor: book?.author || null,
          text: h.text,
          note: h.note,
          page: h.page,
          locStart: h.locStart,
          locEnd: h.locEnd,
          deletedAt: h.deletedAt
        };
      })
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
