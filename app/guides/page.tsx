import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowRight, BookMarked, Clock } from 'lucide-react';
import { getAllGuides } from '@/lib/guides';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kindle-clip.vercel.app';

export const metadata: Metadata = {
  title: 'Kindle Guides & Tutorials',
  description: 'Practical guides and step-by-step tutorials on extracting My Clippings.txt, reading highlights on mobile, and exporting to Obsidian and Markdown.',
  alternates: {
    canonical: `${appUrl}/guides`,
  },
  openGraph: {
    title: 'Kindle Guides & Walkthroughs — Kindle Clipper',
    description: 'Practical guides on getting the most out of your Kindle highlights: locating clippings, mobile reading, and Markdown exports.',
    url: `${appUrl}/guides`,
    siteName: 'Kindle Clipper',
    images: [{ url: `${appUrl}/opengraph-image`, width: 1200, height: 630, alt: 'Kindle Clipper Guides' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kindle Guides & Walkthroughs — Kindle Clipper',
    description: 'Learn how to locate My Clippings.txt, read offline on phone, and export to Markdown.',
    images: [`${appUrl}/opengraph-image`],
  },
};

export default function GuidesIndexPage() {
  const guides = getAllGuides();

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-ink hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-full bg-ink text-background flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif font-medium text-lg tracking-tight">Kindle Clipper</span>
          </Link>

          <nav className="flex items-center space-x-6 text-sm font-sans">
            <Link href="/privacy" className="text-muted hover:text-ink transition-colors">
              Privacy
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
        <div className="mb-10">
          <div className="flex items-center space-x-2 text-xs font-sans uppercase tracking-widest text-muted mb-3">
            <BookMarked className="w-3.5 h-3.5" />
            <span>Documentation & Tutorials</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-ink tracking-tight mb-4">
            Kindle Guides &amp; Tips
          </h1>
          <p className="font-sans text-sm text-muted leading-relaxed max-w-xl">
            Practical walkthroughs for Kindle readers. Learn how to pull your clippings via USB, read without subscriptions on iOS and Android, and export your notes to modern markdown systems.
          </p>
        </div>

        {/* Guides List */}
        <div className="space-y-6">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="group block bg-card/30 border border-border rounded-xl p-6 sm:p-8 hover:bg-secondary/20 hover:border-ink/20 transition-all"
            >
              <div className="flex items-center justify-between text-xs font-sans text-muted mb-3">
                <span className="uppercase tracking-wider font-medium text-ink/70 bg-secondary/50 px-2 py-0.5 rounded">
                  {guide.category}
                </span>
                <span className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{guide.readTime}</span>
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-serif text-ink font-medium mb-3 group-hover:text-ink/80 transition-colors">
                {guide.title}
              </h2>

              <p className="font-sans text-sm text-muted leading-relaxed mb-4">
                {guide.description}
              </p>

              <div className="flex items-center space-x-1 text-xs font-sans font-medium text-ink">
                <span>Read guide</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer with Amazon Disclaimer */}
      <footer className="border-t border-border py-8 mt-16 bg-card/20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-3">
          <div className="flex justify-center space-x-6 text-xs font-sans text-muted">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <Link href="/guides" className="text-ink font-medium">Guides</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
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
