import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Highlight } from '@/lib/models/Highlight';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const { favorite } = await req.json();
    await dbConnect();
    
    const h = await Highlight.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { favorite },
      { new: true }
    );

    if (!h) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, favorite: h.favorite });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
