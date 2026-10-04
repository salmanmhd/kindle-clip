import { describe, it, expect, beforeEach } from 'vitest';
import { POST as starHighlight } from '../app/api/highlights/[id]/star/route';
import { DELETE as deleteHighlight } from '../app/api/highlights/[id]/route';
import { Book } from '../lib/models/Book';
import { Highlight } from '../lib/models/Highlight';

// Mock NextAuth
import { auth } from '@/auth';
import { vi } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

import mongoose from 'mongoose';

const userAId = new mongoose.Types.ObjectId().toString();
const userBId = new mongoose.Types.ObjectId().toString();

describe('Security Isolation', () => {
  let userABookId: string;
  let userAHighlightId: string;

  beforeEach(async () => {
    const book = await Book.create({
      userId: userAId,
      title: 'User A Book',
      titleKey: 'user a book',
      author: 'A',
    });
    userABookId = book._id.toString();

    const highlight = await Highlight.create({
      userId: userAId,
      bookId: book._id,
      text: 'User A highlight',
      normText: 'user a highlight',
      textHash: 'hash',
      kind: 'highlight',
      locStart: 1,
      locEnd: 10
    });
    userAHighlightId = highlight._id.toString();
  });

  it('user B cannot interact with user A highlight', async () => {
    // Mock auth to be user_B
    (auth as any).mockResolvedValue({ user: { id: userBId } });

    const req = new Request('http://localhost');
    
    // Test delete (which is a POST route per the file)
    const deleteRes = await deleteHighlight(req, { params: Promise.resolve({ id: userAHighlightId }) });
    if (deleteRes.status === 500) console.log(await deleteRes.text());
    expect(deleteRes.status).toBe(404); // the highlight findOneAndUpdate will fail to find it, returning 404

    // Test star
    const reqStar = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ isFavorite: true }) });
    const starRes = await starHighlight(reqStar, { params: Promise.resolve({ id: userAHighlightId }) });
    expect(starRes.status).toBe(404);
  });
});
