import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Book } from '@/lib/models/Book';
import { Highlight } from '@/lib/models/Highlight';
import { normalizeText, hashText, normalizeTitle } from '@/lib/kindle/normalize';

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

const createSchema = z
  .object({
    // Client-generated so a highlight created offline keeps the same id once synced
    _id: objectId.optional(),
    bookId: objectId.optional(),
    bookTitle: z.string().trim().min(1).max(500).optional(),
    bookAuthor: z.string().trim().max(300).nullish(),
    text: z.string().trim().min(1).max(10000),
    note: z.string().trim().max(10000).nullish(),
    page: z.number().int().positive().nullish()
  })
  .refine(d => d.bookId || d.bookTitle, { message: 'A book is required' });

function serialize(h: any) {
  return {
    ...h,
    _id: h._id.toString(),
    userId: h.userId.toString(),
    bookId: h.bookId.toString()
  };
}

function serializeBook(b: any) {
  return { ...b, _id: b._id.toString(), userId: b.userId.toString() };
}

async function resolveBook(userId: string, data: z.infer<typeof createSchema>) {
  if (data.bookId) {
    const existing = await Book.findOne({ _id: data.bookId, userId }).lean();
    if (existing) return existing;
  }
  if (!data.bookTitle) return null;

  const titleKey = normalizeTitle(data.bookTitle);
  const byTitle = await Book.findOne({ userId, titleKey }).lean();
  if (byTitle) return byTitle;

  const create = (id: string | undefined) =>
    Book.create({
      _id: id ? new mongoose.Types.ObjectId(id) : new mongoose.Types.ObjectId(),
      userId,
      title: data.bookTitle,
      titleKey,
      author: data.bookAuthor || null
    }).then(b => b.toObject());

  try {
    return await create(data.bookId);
  } catch (e: any) {
    if (e.code !== 11000) throw e;
    // Lost a race with a concurrent create for the same title...
    const raced = await Book.findOne({ userId, titleKey }).lean();
    if (raced) return raced;
    // ...or the client-supplied id is already taken (by another user's book): use a fresh one
    return create(undefined);
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  let data: z.infer<typeof createSchema>;
  try {
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input' }, { status: 400 });
    }
    data = parsed.data;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const normText = normalizeText(data.text);
  if (!normText) {
    return NextResponse.json({ error: 'Highlight needs some words in it' }, { status: 400 });
  }

  try {
    await dbConnect();

    // Replayed offline create: already saved, return it unchanged
    if (data._id) {
      const existing = await Highlight.findOne({ _id: data._id, userId }).lean();
      if (existing) {
        const book = await Book.findById(existing.bookId).lean();
        return NextResponse.json({ highlight: serialize(existing), book: book && serializeBook(book) });
      }
    }

    const book = await resolveBook(userId, data);
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });

    const textHash = hashText(normText);
    const duplicate = await Highlight.findOne({ userId, bookId: book._id, textHash });
    if (duplicate) {
      if (!duplicate.deletedAt) {
        return NextResponse.json(
          { error: 'This highlight is already in that book', highlightId: duplicate._id.toString() },
          { status: 409 }
        );
      }
      // Re-adding something from the trash restores it
      duplicate.deletedAt = null;
      if (data.note) duplicate.note = data.note;
      await duplicate.save();
      if (duplicate.kind === 'highlight') {
        await Book.updateOne({ _id: book._id }, { $inc: { highlightCount: 1 } });
      }
      const updatedBook = await Book.findById(book._id).lean();
      return NextResponse.json(
        { highlight: serialize(duplicate.toObject()), book: serializeBook(updatedBook), restored: true },
        { status: 201 }
      );
    }

    const created = await Highlight.create({
      _id: data._id ? new mongoose.Types.ObjectId(data._id) : new mongoose.Types.ObjectId(),
      userId,
      bookId: book._id,
      kind: 'highlight',
      text: data.text,
      normText,
      textHash,
      // Manual highlights have no Kindle location; 0 sorts them before located ones
      locStart: 0,
      locEnd: 0,
      page: data.page ?? null,
      note: data.note || null,
      highlightedAt: new Date(),
      source: 'manual'
    });
    await Book.updateOne({ _id: book._id }, { $inc: { highlightCount: 1 } });
    const updatedBook = await Book.findById(book._id).lean();

    return NextResponse.json(
      { highlight: serialize(created.toObject()), book: serializeBook(updatedBook) },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
