'use client';

// Formats a date in the viewer's own timezone (server components would use the server's, e.g. UTC on Vercel)
export default function LocalDateTime({ iso, className }: { iso: string; className?: string }) {
  const text = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {text}
    </time>
  );
}
