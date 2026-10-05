import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found — Kindle Clipper',
  description: 'The requested page or reading highlight could not be found.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-ink flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-ink hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-ink text-background flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif font-medium text-lg tracking-tight">Kindle Clipper</span>
          </Link>
        </div>
      </header>

      {/* Main 404 Area */}
      <main className="max-w-xl mx-auto px-6 py-24 text-center space-y-6">
        <div className="inline-block px-3 py-1 rounded-full border border-border bg-card/40 text-xs font-sans text-muted">
          404 Error &bull; Missing Page
        </div>

        <h1 className="text-4xl sm:text-5xl font-serif text-ink tracking-tight">
          Page not found
        </h1>

        <p className="font-sans text-sm sm:text-base text-muted leading-relaxed">
          The page, guide, or highlight you are looking for does not exist or has been relocated.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-ink text-background px-5 py-2.5 rounded-lg font-sans text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Home</span>
          </Link>
          <Link
            href="/library"
            className="w-full sm:w-auto inline-flex items-center justify-center border border-border bg-card/40 hover:bg-secondary/40 text-ink px-5 py-2.5 rounded-lg font-sans text-sm font-medium transition-colors"
          >
            <span>Open Library</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card/20 text-center">
        <p className="text-[11px] font-sans text-muted/70 max-w-xl mx-auto px-6">
          Kindle Clipper is an independent open-source reader companion and is not affiliated with Amazon.com, Inc.
        </p>
      </footer>
    </div>
  );
}
