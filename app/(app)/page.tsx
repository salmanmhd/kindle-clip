import { auth } from '@/auth';
import { Book } from '@/lib/models/Book';
import dbConnect from '@/lib/db';
import Link from 'next/link';


export default async function LibraryPage() {
  const session = await auth();
  await dbConnect();

  // Books sorted by last activity (could be based on recent highlights or a specific timestamp)
  // We'll just sort by highlightCount for now, or lastReadIndex if it was updated
  const books = await Book.find({ userId: session?.user?.id })
    .sort({ highlightCount: -1 })
    .lean();

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Top area */}
      <div className="mb-12 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-sans text-muted mb-1">Continue reading</h1>
          <p className="text-ink font-serif text-lg">You don't have any recent activity yet.</p>
        </div>
        <Link href="/upload" className="text-sm text-ink underline underline-offset-4 hover:text-muted transition-colors">
          Upload clippings
        </Link>
      </div>

      {books.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted">Nothing here yet. Upload your clippings to begin.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {books.map(b => (
            <li key={b._id.toString()}>
              <Link href={`/books/${b._id.toString()}`} className="group flex justify-between items-baseline py-2 border-b border-transparent hover:border-border transition-colors">
                <div className="flex items-baseline space-x-3">
                  <span className="font-serif text-lg text-ink group-hover:text-ink/80 transition-colors">
                    {b.title}
                  </span>
                  {b.author && (
                    <span className="text-sm text-muted">
                      {b.author}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted shrink-0 ml-4">
                  {b.highlightCount}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
