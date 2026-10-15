import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import { POST as createHighlight } from '../app/api/highlights/route';
import { GET as getTrash } from '../app/api/highlights/trash/route';
import { DELETE as deleteHighlight } from '../app/api/highlights/[id]/route';
import { POST as undeleteHighlight } from '../app/api/highlights/[id]/undelete/route';
import { GET as getCard } from '../app/api/highlights/[id]/card/route';
import { POST as fetchCovers } from '../app/api/books/covers/route';
import { GET as sync } from '../app/api/sync/route';
import { Book } from '../lib/models/Book';
import { Highlight } from '../lib/models/Highlight';
import { findCover } from '../lib/covers';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('../lib/covers', async importOriginal => ({
  ...(await importOriginal<typeof import('../lib/covers')>()),
  findCover: vi.fn()
}));

const userId = new mongoose.Types.ObjectId().toString();
const otherUserId = new mongoose.Types.ObjectId().toString();

function loginAs(id: string | null) {
  vi.mocked(auth).mockResolvedValue((id ? { user: { id } } : null) as any);
}

function post(body: any) {
  return createHighlight(
    new Request('http://localhost/api/highlights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  );
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

describe('manual highlights (POST /api/highlights)', () => {
  beforeEach(() => loginAs(userId));

  it('rejects unauthenticated requests', async () => {
    loginAs(null);
    const res = await post({ bookTitle: 'X', text: 'Hello' });
    expect(res.status).toBe(401);
  });

  it('creates a new book and a manual highlight with client ids', async () => {
    const _id = new mongoose.Types.ObjectId().toString();
    const bookId = new mongoose.Types.ObjectId().toString();
    const res = await post({ _id, bookId, bookTitle: 'Meditations', bookAuthor: 'Marcus Aurelius', text: 'You have power over your mind.', page: 12 });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.highlight._id).toBe(_id);
    expect(data.highlight.source).toBe('manual');
    expect(data.highlight.page).toBe(12);
    expect(data.book._id).toBe(bookId);
    expect(data.book.highlightCount).toBe(1);
  });

  it('files a "new" book under an existing book with the same title', async () => {
    const existing = await Book.create({ userId, title: 'Meditations', titleKey: 'meditations', author: null });
    const res = await post({ bookId: new mongoose.Types.ObjectId().toString(), bookTitle: '  MEDITATIONS ', text: 'Waste no more time arguing.' });
    const data = await res.json();
    expect(data.book._id).toBe(existing._id.toString());
    expect(await Book.countDocuments({ userId })).toBe(1);
  });

  it('is idempotent when an offline create is replayed', async () => {
    const _id = new mongoose.Types.ObjectId().toString();
    const body = { _id, bookTitle: 'Book', text: 'Same words' };
    expect((await post(body)).status).toBe(201);
    const replay = await post(body);
    expect(replay.status).toBe(200);
    expect(await Highlight.countDocuments({ userId })).toBe(1);
    expect((await Book.findOne({ userId }))!.highlightCount).toBe(1);
  });

  it('returns 409 for a duplicate and restores one from the trash', async () => {
    const first = await (await post({ bookTitle: 'Book', text: 'A line worth keeping.' })).json();
    const dup = await post({ bookTitle: 'Book', text: 'a line, worth keeping' });
    expect(dup.status).toBe(409);

    await deleteHighlight(new Request('http://localhost'), params(first.highlight._id));
    const restored = await post({ bookTitle: 'Book', text: 'A line worth keeping.', note: 'Back again' });
    expect(restored.status).toBe(201);
    const h = await Highlight.findById(first.highlight._id).lean();
    expect(h!.deletedAt).toBeNull();
    expect(h!.note).toBe('Back again');
    expect((await Book.findOne({ userId }))!.highlightCount).toBe(1);
  });

  it('validates input', async () => {
    expect((await post({ text: 'No book' })).status).toBe(400);
    expect((await post({ bookTitle: 'B', text: '   ' })).status).toBe(400);
    expect((await post({ bookTitle: 'B', text: '!!!' })).status).toBe(400);
    expect((await post({ bookTitle: 'B', text: 'ok', _id: 'not-an-id' })).status).toBe(400);
  });

  it("can't attach a highlight to another user's book", async () => {
    const theirs = await Book.create({ userId: otherUserId, title: 'Private', titleKey: 'private' });
    const res = await post({ bookId: theirs._id.toString(), bookTitle: 'Mine', text: 'Hello there' });
    const data = await res.json();
    expect(data.book._id).not.toBe(theirs._id.toString());
    expect((await Book.findById(theirs._id))!.highlightCount).toBe(0);
  });
});

describe('trash and undo', () => {
  beforeEach(() => loginAs(userId));

  it('lists deleted highlights and keeps counts right across repeated delete/undo', async () => {
    const { highlight } = await (await post({ bookTitle: 'Book', text: 'Delete me' })).json();
    const req = new Request('http://localhost');

    expect((await deleteHighlight(req, params(highlight._id))).status).toBe(200);
    // A replayed delete must not decrement again
    expect((await deleteHighlight(req, params(highlight._id))).status).toBe(404);
    expect((await Book.findOne({ userId }))!.highlightCount).toBe(0);

    const trash = await (await getTrash()).json();
    expect(trash.highlights).toHaveLength(1);
    expect(trash.highlights[0].bookTitle).toBe('Book');

    expect((await undeleteHighlight(req, params(highlight._id))).status).toBe(200);
    expect((await undeleteHighlight(req, params(highlight._id))).status).toBe(404);
    expect((await Book.findOne({ userId }))!.highlightCount).toBe(1);
    expect((await (await getTrash()).json()).highlights).toHaveLength(0);
  });

  it("does not show other users' deleted highlights", async () => {
    loginAs(otherUserId);
    const { highlight } = await (await post({ bookTitle: 'Theirs', text: 'Secret' })).json();
    await deleteHighlight(new Request('http://localhost'), params(highlight._id));
    loginAs(userId);
    expect((await (await getTrash()).json()).highlights).toHaveLength(0);
  });
});

describe('sync', () => {
  beforeEach(() => loginAs(userId));

  it('excludes deleted highlights from a full sync and picks up new books in a delta', async () => {
    const a = await (await post({ bookTitle: 'Book A', text: 'Kept' })).json();
    const b = await (await post({ bookTitle: 'Book A', text: 'Removed' })).json();
    await deleteHighlight(new Request('http://localhost'), params(b.highlight._id));

    const full = await (await sync(new Request('http://localhost/api/sync'))).json();
    expect(full.highlights.map((h: any) => h._id)).toEqual([a.highlight._id]);

    await new Promise(r => setTimeout(r, 5));
    await post({ bookTitle: 'Book B', text: 'New after first sync' });
    const delta = await (await sync(new Request(`http://localhost/api/sync?since=${encodeURIComponent(full.timestamp)}`))).json();
    expect(delta.books.map((x: any) => x.title)).toEqual(['Book B']);
    expect(delta.highlights).toHaveLength(1);
  });
});

describe('covers (POST /api/books/covers)', () => {
  beforeEach(() => {
    loginAs(userId);
    vi.mocked(findCover).mockReset();
  });

  it('stores found covers and marks books as checked', async () => {
    await Book.create({ userId, title: 'Atomic Habits', titleKey: 'atomic habits', author: 'James Clear' });
    await Book.create({ userId, title: 'Obscure Zine', titleKey: 'obscure zine' });
    vi.mocked(findCover).mockImplementation(async title => (title === 'Atomic Habits' ? 'https://covers.openlibrary.org/b/id/1-M.jpg' : null));

    const data = await (await fetchCovers()).json();
    expect(data).toEqual({ updated: 1, remaining: 0 });
    const books = await Book.find({ userId }).lean();
    expect(books.every(b => b.coverCheckedAt)).toBe(true);
    expect(books.find(b => b.title === 'Atomic Habits')!.coverUrl).toContain('openlibrary');
  });

  it('leaves books unchecked when lookups fail so they are retried', async () => {
    await Book.create({ userId, title: 'Atomic Habits', titleKey: 'atomic habits' });
    vi.mocked(findCover).mockRejectedValue(new Error('down'));
    const data = await (await fetchCovers()).json();
    expect(data.remaining).toBe(0);
    expect((await Book.findOne({ userId }))!.coverCheckedAt).toBeNull();
  });
});

describe('quote card (GET /api/highlights/:id/card)', () => {
  beforeEach(() => loginAs(userId));

  it("renders a PNG for the owner and 404s for anyone else", async () => {
    const { highlight } = await (await post({ bookTitle: 'Meditations', text: 'The impediment to action advances action.' })).json();

    const res = await getCard(new Request(`http://localhost/api/highlights/${highlight._id}/card?theme=night&format=story`), params(highlight._id));
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('image/png');
    expect(res.headers.get('cache-control')).toContain('private');
    const png = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(png.slice(1, 4))).toEqual([0x50, 0x4e, 0x47]); // "PNG"

    loginAs(otherUserId);
    const forbidden = await getCard(new Request('http://localhost'), params(highlight._id));
    expect(forbidden.status).toBe(404);
  }, 30000);
});
