import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Highlight } from '@/lib/models/Highlight';
import { Book } from '@/lib/models/Book';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    await dbConnect();
    const h = await Highlight.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { deletedAt: null },
      { new: true }
    );

    if (!h) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Increment highlightCount on Book
    if (h.kind === 'highlight') {
      await Book.updateOne({ _id: h.bookId }, { $inc: { highlightCount: 1 } });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
