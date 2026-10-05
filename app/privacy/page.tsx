import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ShieldCheck, ArrowLeft } from 'lucide-react';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kindle-clip.vercel.app';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Kindle Clipper is built with zero tracking, no ad networks, no data selling, and zero AI training on your private reading notes.',
  alternates: {
    canonical: `${appUrl}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy — Kindle Clipper',
    description: 'Our honest privacy commitment: zero trackers, offline-first storage, no AI training, and full ownership of your highlights.',
    url: `${appUrl}/privacy`,
    siteName: 'Kindle Clipper',
    images: [{ url: `${appUrl}/opengraph-image`, width: 1200, height: 630, alt: 'Kindle Clipper Privacy Policy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy — Kindle Clipper',
    description: 'Our honest privacy commitment: zero trackers, offline-first storage, and no AI training on your notes.',
    images: [`${appUrl}/opengraph-image`],
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-ink flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-ink hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-ink text-background flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif font-medium text-lg tracking-tight">Kindle Clipper</span>
          </Link>

          <nav className="flex items-center space-x-6 text-sm font-sans">
            <Link href="/guides" className="text-muted hover:text-ink transition-colors">
              Guides
            </Link>
            <Link href="/login" className="text-muted hover:text-ink transition-colors">
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="bg-ink text-background px-3.5 py-1.5 rounded-lg font-medium hover:bg-ink/90 transition-colors text-xs"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-12 flex-1 w-full">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center space-x-1.5 text-xs font-sans text-muted hover:text-ink transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to home</span>
          </Link>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center text-ink">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-xs font-sans uppercase tracking-widest text-muted">Plain Language Policy</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-ink tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm font-sans text-muted mt-2">
            Last updated: October 2026 &bull; Effective immediately
          </p>
        </div>

        <article className="space-y-8 font-serif text-ink/90 leading-relaxed text-base border-t border-border pt-8">
          <section className="space-y-3">
            <h2 className="text-xl font-serif text-ink font-semibold">1. Our Core Principle</h2>
            <p className="font-sans text-sm text-muted leading-relaxed">
              Your reading notes, highlights, and bookmarks reflect your personal thoughts and intellectual life. We believe this data belongs exclusively to you. Kindle Clipper is built to respect your privacy by default, collecting only the bare minimum information necessary to render your library and sync your highlights.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif text-ink font-semibold">2. What Data We Store</h2>
            <div className="font-sans text-sm text-muted space-y-2 leading-relaxed">
              <p><strong className="text-ink">Account Credentials:</strong> When you sign up, we store your email address and a salted, bcrypt-hashed version of your password. We never have access to your plain-text password.</p>
              <p><strong className="text-ink">Highlights & Clippings:</strong> When you upload a <code className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">My Clippings.txt</code> file, our parser extracts the book title, author, highlight content, location numbers, and any notes you typed on your e-reader. These records are stored in an encrypted MongoDB database strictly associated with your account.</p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif text-ink font-semibold">3. What We Never Do</h2>
            <ul className="font-sans text-sm text-muted space-y-2 list-disc list-inside leading-relaxed">
              <li><strong className="text-ink">No Data Selling:</strong> We do not sell, rent, or monetize your reading history or personal data under any circumstances.</li>
              <li><strong className="text-ink">No AI Training:</strong> Your highlights and personal notes are never ingested, scraped, or used to train public or private machine learning or generative AI models.</li>
              <li><strong className="text-ink">No Third-Party Analytics Trackers:</strong> We do not embed surveillance tracking pixels, Google Analytics, Facebook Pixel, or cross-site tracking cookies.</li>
              <li><strong className="text-ink">No Advertising:</strong> Kindle Clipper is completely free of banner ads, sponsored book placements, and affiliate link hijacking.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif text-ink font-semibold">4. Daily Digest Emails</h2>
            <p className="font-sans text-sm text-muted leading-relaxed">
              If you enable the optional Daily Digest in your settings, our server sends a single daily email with one random highlight from your library. Emails are sent via Resend. Every digest email includes a direct, one-click unsubscribe link with a unique cryptographic token that immediately disables the emails without requiring you to log in.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif text-ink font-semibold">5. Offline Caching (IndexedDB)</h2>
            <p className="font-sans text-sm text-muted leading-relaxed">
              To support reading offline without an internet connection, Kindle Clipper caches your library in your browser’s IndexedDB storage. This data resides entirely on your device. Clicking &quot;Sign Out&quot; in the Settings menu immediately purges all IndexedDB data and Service Worker caches from your browser.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif text-ink font-semibold">6. Data Deletion and Portability</h2>
            <p className="font-sans text-sm text-muted leading-relaxed">
              You retain 100% ownership of your reading history. You can export any book as clean Markdown (<code className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">.md</code>) or raw JSON (<code className="text-xs bg-secondary/50 px-1.5 py-0.5 rounded">.json</code>) at any time. If you wish to permanently delete your highlights, books, or entire account, you can do so directly or contact us to wipe all database records.
            </p>
          </section>
        </article>
      </main>

      {/* Footer with Amazon Disclaimer */}
      <footer className="border-t border-border py-8 mt-16 bg-card/20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-3">
          <div className="flex justify-center space-x-6 text-xs font-sans text-muted">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <Link href="/guides" className="hover:text-ink transition-colors">Guides</Link>
            <Link href="/privacy" className="text-ink font-medium">Privacy Policy</Link>
            <Link href="/login" className="hover:text-ink transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-ink transition-colors">Sign up</Link>
          </div>
          <p className="text-[11px] font-sans text-muted/70 max-w-xl mx-auto leading-normal">
            Kindle Clipper is an independent open-source reader companion and is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or Kindle.
          </p>
        </div>
      </footer>
    </div>
  );
}
