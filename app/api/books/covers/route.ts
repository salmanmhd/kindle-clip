import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Book } from '@/lib/models/Book';
import { findCover } from '@/lib/covers';

export const maxDuration = 30;

const BATCH_SIZE = 6;

// Looks up covers for a batch of books that haven't been checked yet.
// The client calls this after sync and repeats while `remaining` > 0.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const pending = await Book.find({ userId: session.user.id, coverCheckedAt: null })
      .limit(BATCH_SIZE)
      .select('title author')
      .lean();

    let updated = 0;
    let failed = 0;
    await Promise.all(
      pending.map(async b => {
        try {
          const coverUrl = await findCover(b.title, b.author);
          await Book.updateOne({ _id: b._id }, { $set: { coverUrl, coverCheckedAt: new Date() } });
          if (coverUrl) updated++;
        } catch {
          // Lookup services unreachable; leave unchecked so a later sync retries
          failed++;
        }
      })
    );

    const remaining = await Book.countDocuments({ userId: session.user.id, coverCheckedAt: null });
    // If the whole batch failed, stop the client loop rather than hammering a down service
    return NextResponse.json({ updated, remaining: failed === pending.length ? 0 : remaining });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
