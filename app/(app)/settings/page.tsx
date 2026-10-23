import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sendDailyDigest } from '@/lib/email';
import {
  getUserBooksRevisionStats,
  getNextRevisionHighlights,
  resetBookRevision,
  resetAllBooksRevision
} from '@/lib/revision';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import TestEmailButton from '@/components/TestEmailButton';
import LogoutButton from '@/components/LogoutButton';
import ExportAllOfflineButton from '@/components/ExportAllOfflineButton';
import Link from 'next/link';
import { History, Trash2, BookOpen, RotateCcw, CheckCircle2 } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect('/login');

  await dbConnect();
  const user = await User.findById(session.user.id).lean();
  const booksWithStats = await getUserBooksRevisionStats(session.user.id);

  // Active book determination
  const selectedBookId = user?.settings?.reminderBookId?.toString() || '';
  const activeBook = selectedBookId
    ? booksWithStats.find((b) => b.bookId === selectedBookId) || null
    : booksWithStats.find((b) => !b.isCompleted) || booksWithStats[0] || null;

  async function updateSettings(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user?.id) return;

    await dbConnect();
    const enabled = formData.get('dailyEmail') === 'on';
    const reminderBookIdStr = formData.get('reminderBookId')?.toString()?.trim() || '';
    const autoAdvanceBook = formData.get('autoAdvanceBook') === 'on';
    const highlightsPerEmail = parseInt(formData.get('highlightsPerEmail')?.toString() || '3', 10);

    const reminderBookId = reminderBookIdStr
      ? new mongoose.Types.ObjectId(reminderBookIdStr)
      : null;

    await User.updateOne(
      { _id: session.user.id },
      {
        $set: {
          'settings.dailyEmail': enabled,
          'settings.reminderBookId': reminderBookId,
          'settings.autoAdvanceBook': autoAdvanceBook,
          'settings.highlightsPerEmail': isNaN(highlightsPerEmail) ? 3 : highlightsPerEmail
        }
      }
    );

    revalidatePath('/settings');
  }

  async function resetProgress(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user?.id) return;

    await dbConnect();
    const bookId = formData.get('bookId')?.toString();
    if (bookId) {
      await resetBookRevision(session.user.id, bookId);
    } else {
      await resetAllBooksRevision(session.user.id);
    }
    revalidatePath('/settings');
  }

  async function sendTestEmail() {
    'use server';
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Not logged in' };

    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) return { success: false, error: 'User not found' };

    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Resend API Key is not configured' };
    }

    const revision = await getNextRevisionHighlights(user._id, { previewOnly: true });

    if (!revision || !revision.highlights || revision.highlights.length === 0) {
      return { success: false, error: 'No highlights found to send' };
    }

    let token = user.unsubscribeToken;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      user.unsubscribeToken = token;
      await user.save();
    }

    try {
      await sendDailyDigest(
        user.email,
        revision.highlights,
        token,
        revision.book
          ? {
              title: revision.book.title,
              author: revision.book.author,
              progress: revision.progress || undefined
            }
          : undefined
      );
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to send' };
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-serif text-ink mb-8">Settings</h1>

      <div className="bg-card/30 border border-border rounded-xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-muted" />
          <h2 className="text-xl font-serif text-ink">Daily Digest & Book Reminders</h2>
        </div>
        <p className="text-sm text-muted mb-6">
          Receive daily email reminders to revise your Kindle highlights book-by-book until every highlight is complete.
        </p>

        <form action={updateSettings} className="space-y-6">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="email-enabled"
              name="dailyEmail"
              className="w-4 h-4 rounded border-border text-ink focus:ring-ink bg-transparent"
              defaultChecked={user?.settings?.dailyEmail ?? false}
            />
            <label htmlFor="email-enabled" className="text-sm font-medium text-ink cursor-pointer">
              Enable Daily Revision Emails
            </label>
          </div>

          <div className="pt-2 border-t border-border/60">
            <label htmlFor="reminder-book" className="block text-sm font-medium text-ink mb-1.5">
              Current Book for Reminders
            </label>
            <p className="text-xs text-muted mb-3">
              Choose which book you want to revise, or select Auto to revise books sequentially one after another.
            </p>
            <select
              id="reminder-book"
              name="reminderBookId"
              defaultValue={selectedBookId}
              className="w-full bg-background/80 border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            >
              <option value="">Auto-select (complete book by book)</option>
              {booksWithStats.map((book) => (
                <option key={book.bookId} value={book.bookId}>
                  {book.title} ({book.revised}/{book.total} revised{book.isCompleted ? ' • Complete' : ''})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="highlights-per-email" className="block text-sm font-medium text-ink mb-1.5">
                Highlights per Email
              </label>
              <select
                id="highlights-per-email"
                name="highlightsPerEmail"
                defaultValue={user?.settings?.highlightsPerEmail ?? 3}
                className="w-full bg-background/80 border border-border rounded-lg px-3 py-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              >
                <option value="1">1 highlight per day</option>
                <option value="2">2 highlights per day</option>
                <option value="3">3 highlights per day (Recommended)</option>
                <option value="5">5 highlights per day</option>
              </select>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="autoAdvanceBook"
                  className="w-4 h-4 rounded border-border text-ink focus:ring-ink bg-transparent"
                  defaultChecked={user?.settings?.autoAdvanceBook !== false}
                />
                <span className="text-sm text-ink">
                  Auto-advance to next book when finished
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="bg-ink text-background px-4 py-2 rounded text-sm font-medium hover:bg-ink/90 transition-colors cursor-pointer"
          >
            Save preferences
          </button>
        </form>

        {/* Active Revision Progress Card */}
        {activeBook && (
          <div className="mt-8 pt-8 border-t border-border">
            <h3 className="text-sm font-sans uppercase tracking-widest text-muted mb-3">
              {selectedBookId ? 'Selected Book Progress' : 'Current Active Revision'}
            </h3>
            <div className="bg-background/60 border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-serif text-lg text-ink font-medium leading-snug">
                    {activeBook.title}
                  </h4>
                  {activeBook.author && (
                    <p className="text-xs text-muted mt-0.5">by {activeBook.author}</p>
                  )}
                </div>
                {activeBook.isCompleted ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-950/20 text-green-700 dark:text-green-400 border border-green-700/30 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completed
                  </span>
                ) : (
                  <span className="text-xs text-muted">
                    {activeBook.total - activeBook.revised} remaining
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted mb-1.5">
                  <span>Progress</span>
                  <span>
                    {activeBook.revised} / {activeBook.total} highlights ({activeBook.percent}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-border/70 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-star transition-all duration-300"
                    style={{ width: `${activeBook.percent}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted">
                  {activeBook.isCompleted
                    ? 'All highlights in this book have been revised!'
                    : 'Reminders will deliver highlights sequentially in reading order.'}
                </span>
                <form action={resetProgress}>
                  <input type="hidden" name="bookId" value={activeBook.bookId} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors cursor-pointer"
                    title="Reset progress to restart revising this book from highlight #1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset progress
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-serif text-ink mb-2">Test Delivery</h3>
          <p className="text-sm text-muted mb-4">
            Verify your email configuration and preview your current book revision highlights immediately.
          </p>
          <TestEmailButton action={sendTestEmail} />
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-serif text-ink mb-2">Account</h3>
          <p className="text-sm text-muted mb-4">
            Sign out and clear local offline data from this device.
          </p>
          <LogoutButton />
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-serif text-ink mb-2">Data</h3>
          <p className="text-sm text-muted mb-4">
            Download a markdown file of all your highlights. Works offline.
          </p>
          <ExportAllOfflineButton />
          <div className="mt-2 flex flex-col">
            <Link
              href="/settings/imports"
              className="flex items-center space-x-2 text-sm text-ink/80 hover:text-ink transition-colors py-2"
            >
              <History className="w-4 h-4" />
              <span>Import history</span>
            </Link>
            <Link
              href="/trash"
              className="flex items-center space-x-2 text-sm text-ink/80 hover:text-ink transition-colors py-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Recently deleted</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
