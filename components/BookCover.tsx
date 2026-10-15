'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BookCoverProps {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  className?: string;
  // Compact covers (thumbnails) only show the title in the fallback
  compact?: boolean;
}

// Cover image from Open Library / Google Books with a typographic fallback.
// A plain <img> (not next/image) so the service worker can cache it for offline use.
export default function BookCover({ title, author, coverUrl, className, compact }: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const showImage = coverUrl && !failed;

  return (
    <div
      className={cn(
        'relative aspect-[2/3] overflow-hidden rounded-lg border border-border bg-gradient-to-br from-secondary/60 to-background',
        className
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={`Cover of ${title}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          // Open Library sends CORS headers; a CORS request lets the service worker cache a
          // normal response instead of an opaque one, which browsers pad heavily against quota
          crossOrigin={coverUrl.includes('openlibrary.org') ? 'anonymous' : undefined}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
          <span
            className={cn(
              'font-serif text-ink font-medium leading-snug',
              compact ? 'text-[10px] line-clamp-4' : 'line-clamp-4'
            )}
          >
            {title}
          </span>
          {!compact && author && (
            <span className="mt-2 text-[11px] font-sans text-muted line-clamp-1">{author}</span>
          )}
        </div>
      )}
    </div>
  );
}
