'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { getDB, LocalHighlight, newObjectId, notifyLocalChange, queueAction, useIDBQuery } from '@/lib/indexeddb';

const NEW_BOOK = '__new__';

const inputClass =
  'block w-full px-3 py-2.5 border border-border rounded bg-popover text-ink focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring placeholder:text-muted/70 transition-colors';
const labelClass = 'block text-xs font-sans uppercase tracking-widest text-muted mb-2';

function AddHighlightContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetBook = searchParams.get('book');

  const { data: books, loading } = useIDBQuery(async db => {
    const all = await db.getAll('books');
    return all.sort((a, b) => a.title.localeCompare(b.title));
  });

  const [pickedBook, setBookChoice] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [page, setPage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Until the user picks, default to the book in the URL, or "new book" for an empty library
  const defaultBook = !books
    ? ''
    : presetBook && books.some(b => b._id === presetBook)
      ? presetBook
      : books.length === 0
        ? NEW_BOOK
        : '';
  const bookChoice = pickedBook || defaultBook;

  const isNewBook = bookChoice === NEW_BOOK;
  const selectedBook = books?.find(b => b._id === bookChoice);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!text.trim()) return setError('Write or paste the highlight.');
    if (!bookChoice) return setError('Choose a book.');
    if (isNewBook && !newTitle.trim()) return setError('Give the book or source a title.');
    const pageNum = page.trim() ? parseInt(page, 10) : null;
    if (page.trim() && (!pageNum || pageNum < 1)) return setError('Page must be a positive number.');

    setSaving(true);
    const db = await getDB();
    if (!db) {
      setSaving(false);
      return setError('Local storage is unavailable in this browser.');
    }

    const now = Date.now();
    const bookId = isNewBook ? newObjectId() : bookChoice;
    const payload = {
      _id: newObjectId(),
      bookId,
      // Sent even for existing books so the server can resolve a book created offline by title
      bookTitle: isNewBook ? newTitle.trim() : selectedBook!.title,
      bookAuthor: isNewBook ? newAuthor.trim() || null : selectedBook!.author,
      text: text.trim(),
      note: note.trim() || null,
      page: pageNum
    };

    // Optimistic local write so it shows up everywhere immediately, even offline
    const local: LocalHighlight = {
      _id: payload._id,
      userId: '',
      bookId,
      text: payload.text,
      note: payload.note,
      page: payload.page,
      locStart: 0,
      locEnd: 0,
      favorite: false,
      source: 'manual',
      createdAt: new Date(now).toISOString(),
      syncedAt: now
    };
    await db.put('highlights', local);
    if (isNewBook) {
      await db.put('books', { _id: bookId, userId: '', title: payload.bookTitle, author: payload.bookAuthor, highlightCount: 1, syncedAt: now });
    } else if (selectedBook) {
      await db.put('books', { ...selectedBook, highlightCount: (selectedBook.highlightCount || 0) + 1 });
    }

    let finalBookId = bookId;
    let savedOffline = false;
    try {
      if (!navigator.onLine) throw new Error('offline');
      const res = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));

      if (res.status >= 400 && res.status < 500) {
        // Rejected (duplicate, invalid): roll back the local copy
        await db.delete('highlights', payload._id);
        if (isNewBook) await db.delete('books', bookId);
        else if (selectedBook) await db.put('books', selectedBook);
        notifyLocalChange();
        setSaving(false);
        return setError(data.error || 'Could not save this highlight.');
      }
      if (!res.ok) throw new Error(data.error || 'Server error');

      await db.put('highlights', { ...data.highlight, syncedAt: Date.now() });
      await db.put('books', { ...data.book, syncedAt: Date.now() });
      finalBookId = data.book._id;
      // A "new" book that matched an existing title was merged into it
      if (isNewBook && finalBookId !== bookId) await db.delete('books', bookId);
    } catch {
      await queueAction('create', payload);
      savedOffline = true;
    }

    notifyLocalChange();
    setSaving(false);
    setText('');
    setNote('');
    setPage('');
    if (isNewBook) {
      setBookChoice(finalBookId);
      setNewTitle('');
      setNewAuthor('');
    }

    toast.success(savedOffline ? 'Saved offline. It will sync when you reconnect.' : 'Highlight added', {
      action: { label: 'View book', onClick: () => router.push(`/book?id=${finalBookId}`) }
    });
  };

  const backHref = presetBook ? `/book?id=${presetBook}` : '/library';

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Link href={backHref} className="inline-flex items-center space-x-2 text-sm text-muted hover:text-ink transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" />
        <span>{presetBook ? 'Back to book' : 'Library'}</span>
      </Link>

      <h1 className="text-3xl font-serif text-ink mb-2">Add a highlight</h1>
      <p className="text-muted mb-10">From a paper book, an article, or anything worth keeping.</p>

      <form onSubmit={handleSubmit} className="space-y-7" noValidate>
        <div>
          <label htmlFor="book" className={labelClass}>Book or source</label>
          <select
            id="book"
            value={bookChoice}
            onChange={e => setBookChoice(e.target.value)}
            disabled={loading}
            className={inputClass}
          >
            <option value="" disabled>
              {loading ? 'Loading your library…' : 'Choose a book'}
            </option>
            <option value={NEW_BOOK}>+ New book or source</option>
            {books?.map(b => (
              <option key={b._id} value={b._id}>
                {b.title}{b.author ? ` — ${b.author}` : ''}
              </option>
            ))}
          </select>
        </div>

        {isNewBook && (
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr] animate-in fade-in slide-in-from-top-1 duration-200">
            <div>
              <label htmlFor="new-title" className={labelClass}>Title</label>
              <input id="new-title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className={inputClass} placeholder="Meditations" autoFocus />
            </div>
            <div>
              <label htmlFor="new-author" className={labelClass}>Author <span className="normal-case tracking-normal">(optional)</span></label>
              <input id="new-author" value={newAuthor} onChange={e => setNewAuthor(e.target.value)} className={inputClass} placeholder="Marcus Aurelius" />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="text" className={labelClass}>Highlight</label>
          <textarea
            id="text"
            value={text}
            onChange={e => setText(e.target.value)}
            rows={6}
            className={`${inputClass} font-serif text-lg leading-relaxed resize-y`}
            placeholder="The words that stopped you…"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
          <div>
            <label htmlFor="note" className={labelClass}>Your note <span className="normal-case tracking-normal">(optional)</span></label>
            <textarea id="note" value={note} onChange={e => setNote(e.target.value)} rows={2} className={`${inputClass} font-serif resize-y`} />
          </div>
          <div>
            <label htmlFor="page" className={labelClass}>Page</label>
            <input id="page" inputMode="numeric" value={page} onChange={e => setPage(e.target.value.replace(/\D/g, ''))} className={inputClass} placeholder="—" />
          </div>
        </div>

        {error && <p className="text-destructive text-sm" role="alert">{error}</p>}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-ink text-background px-6 py-2.5 rounded font-sans text-sm hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save highlight'}
          </button>
          <Link href={backHref} className="text-sm text-muted hover:text-ink transition-colors">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

export default function AddHighlightPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6 flex justify-center items-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" />
        </div>
      }
    >
      <AddHighlightContent />
    </Suspense>
  );
}
