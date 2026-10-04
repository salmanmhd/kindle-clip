import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Highlight } from '@/lib/models/Highlight';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  
  try {
    const { note } = await req.json();

    await dbConnect();

    const highlight = await Highlight.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: { note } },
      { new: true }
    );

    if (!highlight) {
      return NextResponse.json({ error: 'Highlight not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, note: highlight.note });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
