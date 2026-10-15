'use client';

import { useState, useSyncExternalStore } from 'react';
import { Dialog } from 'radix-ui';
import { Share2, Download, Copy, X, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const THEMES = [
  { id: 'paper', label: 'Paper', swatch: '#FBF9F4', ink: '#1C1B19' },
  { id: 'sepia', label: 'Sepia', swatch: '#F5F0E1', ink: '#4A3E35' },
  { id: 'night', label: 'Night', swatch: '#121212', ink: '#D8D4CB' }
] as const;

const FORMATS = [
  { id: 'square', label: 'Square', hint: 'Posts' },
  { id: 'story', label: 'Story', hint: 'Stories' },
  { id: 'wide', label: 'Wide', hint: 'Links' }
] as const;

interface ShareCardButtonProps {
  highlightId: string;
  text: string;
  bookTitle: string;
  author?: string | null;
  className?: string;
}

function subscribeOnline(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'quote';
}

// Opens a preview of the highlight rendered as an image card (/api/highlights/:id/card)
// with theme and size options, then shares it via the Web Share API or downloads it.
export default function ShareCardButton({ highlightId, text, bookTitle, author, className }: ShareCardButtonProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<(typeof THEMES)[number]['id']>('paper');
  const [format, setFormat] = useState<(typeof FORMATS)[number]['id']>('square');
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [busy, setBusy] = useState(false);

  const src = `/api/highlights/${highlightId}/card?theme=${theme}&format=${format}`;

  // Each new preview url starts loading again
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setStatus('loading');
  }

  const getFile = async () => {
    const res = await fetch(src);
    if (!res.ok) throw new Error('Failed to render');
    const blob = await res.blob();
    return new File([blob], `${slug(bookTitle)}-${format}.png`, { type: 'image/png' });
  };

  const download = async () => {
    setBusy(true);
    try {
      const file = await getFile();
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not create the image');
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    setBusy(true);
    try {
      const file = await getFile();
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: bookTitle, text: author ? `${bookTitle} by ${author}` : bookTitle });
      } else {
        // Desktop browsers mostly can't share files; save it instead
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Image saved');
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') toast.error('Could not share the image');
    } finally {
      setBusy(false);
    }
  };

  const copyText = async () => {
    const attribution = [bookTitle, author].filter(Boolean).join(' — ');
    try {
      await navigator.clipboard.writeText(`“${text}”\n— ${attribution}`);
      toast.success('Quote copied');
    } catch {
      toast.error('Could not copy');
    }
  };

  const canShareFiles = typeof navigator !== 'undefined' && 'canShare' in navigator;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn('text-muted hover:text-ink transition-colors p-2 rounded-full focus:outline-none', className)}
          title="Share as image"
          aria-label="Share as image"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed z-[61] inset-x-0 bottom-0 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[min(92vw,520px)] max-h-[92vh] overflow-y-auto bg-background border border-border rounded-t-2xl sm:rounded-xl shadow-xl p-5 sm:p-6 data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-4 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=open]:fade-in"
          onPointerDownCapture={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-serif text-xl text-ink">Share highlight</Dialog.Title>
            <Dialog.Close className="p-1.5 -mr-1.5 rounded-full text-muted hover:text-ink hover:bg-secondary/50 transition-colors" aria-label="Close">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">Preview the highlight as an image, choose a style and size, then share or download it.</Dialog.Description>

          <div className="flex items-center justify-center rounded-lg bg-secondary/30 border border-border p-3 min-h-[220px]">
            {!online ? (
              <div className="flex flex-col items-center text-center text-muted py-10 px-6">
                <WifiOff className="w-6 h-6 mb-3" />
                <p className="text-sm">Image cards need a connection. You can still copy the quote.</p>
              </div>
            ) : (
              <div className={cn('relative w-full flex justify-center', format === 'story' ? 'max-w-[200px]' : '')}>
                {status !== 'ready' && status !== 'error' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-ink border-t-transparent animate-spin" />
                  </div>
                )}
                {status === 'error' ? (
                  <p className="text-sm text-muted text-center py-10 px-6">
                    Couldn&apos;t render this card. If you just added this highlight, it may not have synced yet.
                  </p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt="Preview of the quote card"
                    onLoad={() => setStatus('ready')}
                    onError={() => setStatus('error')}
                    className={cn(
                      'w-full h-auto rounded shadow-sm transition-opacity duration-300',
                      status === 'ready' ? 'opacity-100' : 'opacity-0 min-h-[200px]'
                    )}
                  />
                )}
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <fieldset>
              <legend className="text-[11px] font-sans uppercase tracking-widest text-muted mb-2">Style</legend>
              <div className="flex gap-2">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    aria-pressed={theme === t.id}
                    title={t.label}
                    className={cn(
                      'w-9 h-9 rounded-full border flex items-center justify-center font-serif text-sm transition-all',
                      theme === t.id ? 'ring-2 ring-ink ring-offset-2 ring-offset-background border-transparent' : 'border-border'
                    )}
                    style={{ backgroundColor: t.swatch, color: t.ink }}
                  >
                    Aa
                    <span className="sr-only">{t.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-[11px] font-sans uppercase tracking-widest text-muted mb-2">Size</legend>
              <div className="flex rounded-lg border border-border p-0.5">
                {FORMATS.map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    aria-pressed={format === f.id}
                    title={f.hint}
                    className={cn(
                      'flex-1 rounded-md py-1.5 text-xs font-medium transition-colors',
                      format === f.id ? 'bg-ink text-background' : 'text-muted hover:text-ink'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
            <button
              onClick={copyText}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm border border-border text-ink hover:bg-secondary/50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy text
            </button>
            <div className="flex-1" />
            <button
              onClick={download}
              disabled={!online || busy || status === 'error'}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm border border-border text-ink hover:bg-secondary/50 transition-colors disabled:opacity-40"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            {canShareFiles && (
              <button
                onClick={share}
                disabled={!online || busy || status === 'error'}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm bg-ink text-background hover:bg-ink/90 transition-colors disabled:opacity-40"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
