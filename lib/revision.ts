import mongoose from 'mongoose';
import { Book, IBook } from './models/Book';
import { Highlight, IHighlight } from './models/Highlight';
import { User, IUser } from './models/User';

export interface BookRevisionStats {
  bookId: string;
  title: string;
  author: string | null;
  total: number;
  revised: number;
  percent: number;
  isCompleted: boolean;
}

export interface NextRevisionResult {
  book: IBook | null;
  highlights: IHighlight[];
  progress: {
    revised: number;
    total: number;
    percent: number;
    isCompleted: boolean;
  } | null;
}

/**
 * Returns revision statistics for all books belonging to the user.
 */
export async function getUserBooksRevisionStats(
  userId: string | mongoose.Types.ObjectId
): Promise<BookRevisionStats[]> {
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  const books = await Book.find({ userId: userObjectId }).sort({ title: 1 }).lean();
  if (books.length === 0) return [];

  // Group non-deleted highlights by bookId to count total & revised (emailedAt != null)
  const stats = await Highlight.aggregate([
    { $match: { userId: userObjectId, deletedAt: null } },
    {
      $group: {
        _id: '$bookId',
        total: { $sum: 1 },
        revised: {
          $sum: { $cond: [{ $ne: ['$emailedAt', null] }, 1, 0] }
        }
      }
    }
  ]);

  const statsMap = new Map<string, { total: number; revised: number }>();
  for (const s of stats) {
    statsMap.set(s._id.toString(), { total: s.total, revised: s.revised });
  }

  return books
    .map((b) => {
      const bookStat = statsMap.get(b._id.toString()) || { total: 0, revised: 0 };
      const percent = bookStat.total > 0 ? Math.round((bookStat.revised / bookStat.total) * 100) : 0;
      return {
        bookId: b._id.toString(),
        title: b.title,
        author: b.author,
        total: bookStat.total,
        revised: bookStat.revised,
        percent,
        isCompleted: bookStat.total > 0 && bookStat.revised >= bookStat.total
      };
    })
    .filter((b) => b.total > 0); // Only books with at least 1 active highlight
}

/**
 * Retrieves the next batch of highlights to revise for a user in book-wise order.
 * - Prioritizes un-emailed highlights from the current reminder book.
 * - Highlights are ordered sequentially by reading location (locStart) and creation date.
 * - When a book is completed, it auto-advances to the next book or cycles over.
 */
export async function getNextRevisionHighlights(
  userId: string | mongoose.Types.ObjectId,
  options?: { previewOnly?: boolean }
): Promise<NextRevisionResult> {
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  const user = await User.findById(userObjectId);
  if (!user) {
    return { book: null, highlights: [], progress: null };
  }

  const batchSize = Math.max(1, user.settings?.highlightsPerEmail || 3);
  const autoAdvance = user.settings?.autoAdvanceBook !== false;

  // Get all user's books that have highlights
  const eligibleBooks = await Book.find({ userId: userObjectId }).sort({ createdAt: 1, title: 1 });
  if (eligibleBooks.length === 0) {
    return { book: null, highlights: [], progress: null };
  }

  let targetBook: IBook | null = null;

  // 1. If user has a specific reminder book selected
  if (user.settings?.reminderBookId) {
    const selectedBook = eligibleBooks.find(
      (b) => b._id.toString() === user.settings.reminderBookId?.toString()
    );

    if (selectedBook) {
      // Check if this book has un-emailed highlights
      const unemailedCount = await Highlight.countDocuments({
        userId: userObjectId,
        bookId: selectedBook._id,
        deletedAt: null,
        emailedAt: null
      });

      if (unemailedCount > 0) {
        targetBook = selectedBook;
      } else if (autoAdvance) {
        // Book is finished, find the next uncompleted book
        for (const candidate of eligibleBooks) {
          const candidateRemaining = await Highlight.countDocuments({
            userId: userObjectId,
            bookId: candidate._id,
            deletedAt: null,
            emailedAt: null
          });
          if (candidateRemaining > 0) {
            targetBook = candidate;
            // Update user settings to track this new book
            if (!options?.previewOnly) {
              await User.updateOne(
                { _id: userObjectId },
                { $set: { 'settings.reminderBookId': candidate._id } }
              );
            }
            break;
          }
        }
      } else {
        // Auto-advance disabled: reset progress for this specific book to restart cycle
        if (!options?.previewOnly) {
          await Highlight.updateMany(
            { userId: userObjectId, bookId: selectedBook._id, deletedAt: null },
            { $set: { emailedAt: null } }
          );
        }
        targetBook = selectedBook;
      }
    }
  }

  // 2. If no target book chosen or auto mode
  if (!targetBook) {
    for (const candidate of eligibleBooks) {
      const candidateRemaining = await Highlight.countDocuments({
        userId: userObjectId,
        bookId: candidate._id,
        deletedAt: null,
        emailedAt: null
      });
      if (candidateRemaining > 0) {
        targetBook = candidate;
        break;
      }
    }
  }

  // 3. If all books in the entire library are 100% revised, restart revision cycle
  if (!targetBook) {
    if (!options?.previewOnly) {
      await Highlight.updateMany(
        { userId: userObjectId, deletedAt: null },
        { $set: { emailedAt: null } }
      );
    }
    targetBook = eligibleBooks[0];
  }

  // Fetch the next highlights in sequential reading order
  let highlights = await Highlight.find({
    userId: userObjectId,
    bookId: targetBook._id,
    deletedAt: null,
    emailedAt: null
  })
    .sort({ locStart: 1, createdAt: 1 })
    .limit(batchSize);

  // If in preview mode and all were already emailed (and we didn't wipe), fetch top highlights
  if (highlights.length === 0) {
    highlights = await Highlight.find({
      userId: userObjectId,
      bookId: targetBook._id,
      deletedAt: null
    })
      .sort({ locStart: 1, createdAt: 1 })
      .limit(batchSize);
  }

  if (highlights.length === 0) {
    return { book: null, highlights: [], progress: null };
  }

  // Mark as emailed if not a preview
  if (!options?.previewOnly) {
    const highlightIds = highlights.map((h) => h._id);
    await Highlight.updateMany(
      { _id: { $in: highlightIds } },
      { $set: { emailedAt: new Date() } }
    );
  }

  const totalInBook = await Highlight.countDocuments({
    userId: userObjectId,
    bookId: targetBook._id,
    deletedAt: null
  });

  const revisedInBook = await Highlight.countDocuments({
    userId: userObjectId,
    bookId: targetBook._id,
    deletedAt: null,
    emailedAt: { $ne: null }
  });

  const percent = totalInBook > 0 ? Math.min(100, Math.round((revisedInBook / totalInBook) * 100)) : 0;

  return {
    book: targetBook,
    highlights,
    progress: {
      revised: revisedInBook,
      total: totalInBook,
      percent,
      isCompleted: totalInBook > 0 && revisedInBook >= totalInBook
    }
  };
}

/**
 * Resets the revision progress for a specific book.
 */
export async function resetBookRevision(
  userId: string | mongoose.Types.ObjectId,
  bookId: string | mongoose.Types.ObjectId
) {
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  const bookObjectId = typeof bookId === 'string' ? new mongoose.Types.ObjectId(bookId) : bookId;

  return await Highlight.updateMany(
    { userId: userObjectId, bookId: bookObjectId, deletedAt: null },
    { $set: { emailedAt: null } }
  );
}

/**
 * Resets the revision progress for all books in the user's library.
 */
export async function resetAllBooksRevision(userId: string | mongoose.Types.ObjectId) {
  const userObjectId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  return await Highlight.updateMany(
    { userId: userObjectId, deletedAt: null },
    { $set: { emailedAt: null } }
  );
}
