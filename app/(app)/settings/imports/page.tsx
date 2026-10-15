import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Import } from '@/lib/models/Import';
import LocalDateTime from '@/components/LocalDateTime';

export const metadata = { title: 'Import history' };

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}


export default async function ImportHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect('/login');

  await dbConnect();
  const imports = await Import.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(50).lean();

  const latest = imports[0];

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Link href="/settings" className="inline-flex items-center space-x-2 text-sm text-muted hover:text-ink transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" />
        <span>Settings</span>
      </Link>

      <h1 className="text-3xl font-serif text-ink mb-3">Import history</h1>
      {latest ? (
        <p className="text-muted mb-10">
          Last import: {plural(latest.stats.newCount, 'new highlight')} across{' '}
          {plural(latest.perBook.length, 'book')}, <LocalDateTime iso={latest.createdAt.toISOString()} />.
        </p>
      ) : (
        <p className="text-muted mb-10">You haven&apos;t imported anything yet.</p>
      )}

      {imports.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-muted font-serif mb-4">Your imports will show up here.</p>
          <Link href="/upload" className="text-sm underline underline-offset-4 text-ink hover:text-muted">
            Upload My Clippings.txt
          </Link>
        </div>
      ) : (
        <ol className="space-y-6">
          {imports.map(imp => {
            const s = imp.stats;
            const details = [
              s.duplicateCount > 0 && `${s.duplicateCount} already saved`,
              s.mergedCount > 0 && `${s.mergedCount} extended`,
              s.previouslyRemovedCount > 0 && `${s.previouslyRemovedCount} previously removed`,
              s.skippedCount > 0 && plural(s.skippedCount, 'bookmark') + ' skipped',
              s.failedCount > 0 && `${s.failedCount} failed`
            ].filter(Boolean);

            return (
              <li key={imp._id.toString()} className="bg-card/30 border border-border rounded-xl p-6 backdrop-blur-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-serif text-xl text-ink">
                      {s.newCount > 0 ? plural(s.newCount, 'new highlight') : 'Nothing new'}
                    </p>
                    <p className="text-xs font-sans uppercase tracking-widest text-muted mt-1">
                      <LocalDateTime iso={imp.createdAt.toISOString()} />
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-muted shrink-0 max-w-[45%]" title={imp.fileName}>
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{imp.fileName}</span>
                  </span>
                </div>

                {details.length > 0 && <p className="text-sm text-muted mt-3">{details.join(' · ')}</p>}

                {imp.perBook.length > 0 && (
                  <ul className="mt-5 pt-4 border-t border-border space-y-2">
                    {imp.perBook.map(b => (
                      <li key={b.bookId.toString()}>
                        <Link
                          href={`/book?id=${b.bookId.toString()}`}
                          className="flex items-baseline justify-between gap-4 group"
                        >
                          <span className="font-serif text-ink group-hover:text-ink/70 transition-colors truncate">{b.title}</span>
                          <span className="text-sm text-muted shrink-0">+{b.newCount}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
