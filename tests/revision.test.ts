import { describe, it, expect, beforeEach, vi } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../lib/models/User';
import { Book } from '../lib/models/Book';
import { Highlight } from '../lib/models/Highlight';
import {
  getUserBooksRevisionStats,
  getNextRevisionHighlights,
  resetBookRevision,
  resetAllBooksRevision
} from '../lib/revision';
import { GET as dailyCron } from '../app/api/cron/daily/route';
import * as emailModule from '../lib/email';

vi.mock('../lib/email', () => ({
  sendDailyDigest: vi.fn().mockResolvedValue({ id: 'mock-email-id' })
}));

describe('Book-Wise Revision System', () => {
  let user: any;
  let bookA: any;
  let bookB: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    user = await User.create({
      email: 'reader@example.com',
      passwordHash: 'hashed123',
      unsubscribeToken: 'test-token-123',
      settings: {
        dailyEmail: true,
        highlightsPerEmail: 2,
        autoAdvanceBook: true,
        reminderBookId: null
      }
    });

    bookA = await Book.create({
      userId: user._id,
      title: 'Atomic Habits',
      author: 'James Clear',
      titleKey: 'atomic habits',
      highlightCount: 3
    });

    bookB = await Book.create({
      userId: user._id,
      title: 'Deep Work',
      author: 'Cal Newport',
      titleKey: 'deep work',
      highlightCount: 2
    });

    // Create 3 highlights for Book A with sequential locations
    await Highlight.create([
      {
        userId: user._id,
        bookId: bookA._id,
        kind: 'highlight',
        text: 'Habits are the compound interest of self-improvement.',
        normText: 'habits are the compound interest of self-improvement.',
        textHash: 'hash1',
        locStart: 100,
        locEnd: 105,
        source: 'kindle'
      },
      {
        userId: user._id,
        bookId: bookA._id,
        kind: 'highlight',
        text: 'You do not rise to the level of your goals.',
        normText: 'you do not rise to the level of your goals.',
        textHash: 'hash2',
        locStart: 200,
        locEnd: 205,
        source: 'kindle'
      },
      {
        userId: user._id,
        bookId: bookA._id,
        kind: 'highlight',
        text: 'Every action you take is a vote for the type of person you wish to become.',
        normText: 'every action you take is a vote for the type of person you wish to become.',
        textHash: 'hash3',
        locStart: 300,
        locEnd: 305,
        source: 'kindle'
      }
    ]);

    // Create 2 highlights for Book B
    await Highlight.create([
      {
        userId: user._id,
        bookId: bookB._id,
        kind: 'highlight',
        text: 'Deep work is the ability to focus without distraction.',
        normText: 'deep work is the ability to focus without distraction.',
        textHash: 'hash4',
        locStart: 50,
        locEnd: 55,
        source: 'kindle'
      },
      {
        userId: user._id,
        bookId: bookB._id,
        kind: 'highlight',
        text: 'Clarity about what matters provides clarity about what does not.',
        normText: 'clarity about what matters provides clarity about what does not.',
        textHash: 'hash5',
        locStart: 150,
        locEnd: 155,
        source: 'kindle'
      }
    ]);
  });

  it('computes accurate revision stats per book', async () => {
    let stats = await getUserBooksRevisionStats(user._id);
    expect(stats.length).toBe(2);

    const statA = stats.find((s) => s.bookId === bookA._id.toString());
    expect(statA?.total).toBe(3);
    expect(statA?.revised).toBe(0);
    expect(statA?.percent).toBe(0);
    expect(statA?.isCompleted).toBe(false);

    // Mark 1 highlight of Book A as emailed
    await Highlight.updateOne({ textHash: 'hash1' }, { $set: { emailedAt: new Date() } });

    stats = await getUserBooksRevisionStats(user._id);
    const updatedA = stats.find((s) => s.bookId === bookA._id.toString());
    expect(updatedA?.revised).toBe(1);
    expect(updatedA?.percent).toBe(33);
  });

  it('delivers highlights sequentially by locStart from the active book', async () => {
    // Round 1: batch size is 2, should get first 2 highlights of Book A
    const round1 = await getNextRevisionHighlights(user._id);
    expect(round1.book?._id.toString()).toBe(bookA._id.toString());
    expect(round1.highlights.length).toBe(2);
    expect(round1.highlights[0].locStart).toBe(100);
    expect(round1.highlights[1].locStart).toBe(200);
    expect(round1.progress?.revised).toBe(2);
    expect(round1.progress?.total).toBe(3);

    // Round 2: should get 3rd highlight of Book A (locStart 300)
    const round2 = await getNextRevisionHighlights(user._id);
    expect(round2.book?._id.toString()).toBe(bookA._id.toString());
    expect(round2.highlights.length).toBe(1);
    expect(round2.highlights[0].locStart).toBe(300);
    expect(round2.progress?.revised).toBe(3);
    expect(round2.progress?.isCompleted || round2.progress?.revised === 3).toBe(true);
  });

  it('completes all revisions of Book A before auto-advancing to Book B', async () => {
    // Finish Book A
    await Highlight.updateMany({ bookId: bookA._id }, { $set: { emailedAt: new Date() } });

    // Next revision should auto-advance to Book B
    const result = await getNextRevisionHighlights(user._id);
    expect(result.book?._id.toString()).toBe(bookB._id.toString());
    expect(result.highlights.length).toBe(2);
    expect(result.highlights[0].locStart).toBe(50);
    expect(result.highlights[1].locStart).toBe(150);
  });

  it('respects explicitly selected reminderBookId in user settings', async () => {
    // Select Book B explicitly
    await User.updateOne({ _id: user._id }, { $set: { 'settings.reminderBookId': bookB._id } });

    const result = await getNextRevisionHighlights(user._id);
    expect(result.book?._id.toString()).toBe(bookB._id.toString());
    expect(result.highlights[0].textHash).toBe('hash4');
  });

  it('resets book revision progress when requested', async () => {
    await Highlight.updateMany({ bookId: bookA._id }, { $set: { emailedAt: new Date() } });

    let stats = await getUserBooksRevisionStats(user._id);
    expect(stats.find((s) => s.bookId === bookA._id.toString())?.revised).toBe(3);

    await resetBookRevision(user._id, bookA._id);

    stats = await getUserBooksRevisionStats(user._id);
    expect(stats.find((s) => s.bookId === bookA._id.toString())?.revised).toBe(0);
  });

  it('daily cron triggers book-wise revision and sends email with book info', async () => {
    const req = new Request('http://localhost/api/cron/daily');
    const res = await dailyCron(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.emailsSent).toBe(1);

    expect(emailModule.sendDailyDigest).toHaveBeenCalledTimes(1);
    const [recipient, highlights, token, bookInfo] = vi.mocked(emailModule.sendDailyDigest).mock.calls[0];

    expect(recipient).toBe('reader@example.com');
    expect(highlights.length).toBe(2);
    expect(bookInfo?.title).toBe('Atomic Habits');
    expect(bookInfo?.author).toBe('James Clear');
    expect(bookInfo?.progress?.revised).toBe(2);
    expect(bookInfo?.progress?.total).toBe(3);
  });
});
