'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { requestSync } from '@/lib/indexeddb';

interface DeletedHighlight {
  _id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string | null;
  text: string;
  note: string | null;
  page: number | null;
  deletedAt: string;
}

function deletedLabel(iso: string) {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return 'Deleted today';
  if (days === 1) return 'Deleted yesterday';
  if (days < 30) return `Deleted ${days} days ago`;
  return `Deleted ${d.toLocaleDateString()}`;
}

type LoadState = 'loading' | 'ready' | 'offline' | 'error' | 'unauthorized';

async function fetchTrash(): Promise<{ state: LoadState; items?: DeletedHighlight[] }> {
  if (!navigator.onLine) return { state: 'offline' };
  try {
    const res = await fetch('/api/highlights/trash');
    // Signed-out API calls are redirected to the login page by the proxy
    if (res.status === 401 || res.redirected) return { state: 'unauthorized' };
    if (!res.ok) return { state: 'error' };
    return { state: 'ready', items: (await res.json()).highlights };
  } catch {
    return { state: navigator.onLine ? 'error' : 'offline' };
  }
}

export default function TrashPage() {
  const router = useRouter();
  const [items, setItems] = useState<DeletedHighlight[] | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [restoring, setRestoring] = useState<Set<string>>(new Set());

  const load = useCallback(
    () =>
      fetchTrash().then(result => {
        if (result.state === 'unauthorized') return router.push('/login?callbackUrl=%2Ftrash');
        if (result.items) setItems(result.items);
        setState(result.state);
      }),
    [router]
  );

  useEffect(() => {
    load();
    window.addEventListener('online', load);
    return () => window.removeEventListener('online', load);
  }, [load]);

  const retry = () => {
    setState('loading');
    load();
  };

  const restore = async (h: DeletedHighlight) => {
    setRestoring(prev => new Set(prev).add(h._id));
    try {
      const res = await fetch(`/api/highlights/${h._id}/undelete`, { method: 'POST' });
      // 404 means it was already restored elsewhere; either way it's no longer in the trash
      if (!res.ok && res.status !== 404) throw new Error();
      setItems(prev => prev?.filter(i => i._id !== h._id) ?? null);
      requestSync();
      toast.success(`Restored to ${h.bookTitle}`, {
        action: { label: 'View', onClick: () => router.push(`/book?id=${h.bookId}`) }
      });
    } catch {
      toast.error('Could not restore this highlight');
    } finally {
      setRestoring(prev => {
        const next = new Set(prev);
        next.delete(h._id);
        return next;
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Link href="/settings" className="inline-flex items-center space-x-2 text-sm text-muted hover:text-ink transition-colors mb-10">
        <ArrowLeft className="w-4 h-4" />
        <span>Settings</span>
      </Link>

      <div className="mb-10 flex justify-between items-baseline gap-4">
        <h1 className="text-3xl font-serif text-ink">Recently deleted</h1>
        {state === 'ready' && items && <span className="text-muted text-sm shrink-0">{items.length} item{items.length === 1 ? '' : 's'}</span>}
      </div>

      {state === 'loading' && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" />
        </div>
      )}

      {state === 'offline' && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <WifiOff className="w-6 h-6 text-muted mx-auto mb-3" />
          <p className="text-muted font-serif">Deleted highlights live on the server. Reconnect to see them.</p>
        </div>
      )}

      {state === 'error' && (
        <div className="text-center py-16">
          <p className="text-muted mb-4">Couldn&apos;t load deleted highlights.</p>
          <button onClick={retry} className="text-sm underline underline-offset-4 text-ink">Try again</button>
        </div>
      )}

      {state === 'ready' && items?.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-muted font-serif">Nothing here. Highlights you delete will appear here so you can restore them.</p>
        </div>
      )}

      {state === 'ready' && items && items.length > 0 && (
        <ul className="divide-y divide-border">
          {items.map(h => (
            <li key={h._id} className="py-6 first:pt-0">
              <p className="text-ink/80 font-serif text-lg leading-relaxed line-clamp-4">{h.text}</p>
              {h.note && <p className="mt-2 text-ink/60 font-serif italic border-l-2 border-border pl-3 line-clamp-2">{h.note}</p>}
              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="min-w-0 text-xs font-sans text-muted">
                  <p className="uppercase tracking-widest truncate">{h.bookTitle}</p>
                  <p className="mt-1">{deletedLabel(h.deletedAt)}</p>
                </div>
                <button
                  onClick={() => restore(h)}
                  disabled={restoring.has(h._id)}
                  className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded border border-border text-sm text-ink hover:bg-secondary/50 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {restoring.has(h._id) ? 'Restoring…' : 'Restore'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
