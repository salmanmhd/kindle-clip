import { Metadata } from 'next';
import Link from 'next/link';
import { 
  BookOpen, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  FileText, 
  Download, 
  Search, 
  Star,
  CheckCircle2,
  BookMarked
} from 'lucide-react';
import { getAllGuides } from '@/lib/guides';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kindle-clip.vercel.app';

export const metadata: Metadata = {
  title: {
    absolute: 'Kindle Clipper — Read & Rediscover Your Kindle Highlights',
  },
  description: 'Transform your raw Kindle My Clippings.txt into an organized, searchable personal library. Read offline on any device with zero tracking and full privacy.',
  alternates: {
    canonical: `${appUrl}/`,
  },
  openGraph: {
    title: 'Kindle Clipper — Read & Rediscover Your Kindle Highlights',
    description: 'Transform your raw Kindle My Clippings.txt into an organized, searchable personal library. Read offline on desktop or mobile.',
    url: `${appUrl}/`,
    siteName: 'Kindle Clipper',
    images: [
      {
        url: `${appUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: 'Kindle Clipper Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kindle Clipper — Read & Rediscover Your Kindle Highlights',
    description: 'Organize, search, and read your Kindle highlights offline on any device.',
    images: [`${appUrl}/opengraph-image`],
  },
};

export default function LandingPage() {
  const guides = getAllGuides();

  const webAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Kindle Clipper',
    url: appUrl,
    description: 'Transform your raw Kindle My Clippings.txt into an organized, searchable personal library. Read offline on any device with zero tracking.',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'All',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Parse My Clippings.txt with automatic deduplication',
      'Offline-first reading with IndexedDB PWA support',
      'Distraction-free card reader mode',
      'Export to Markdown and JSON for Obsidian and Notion',
      'Optional daily digest email',
      'Zero ads, zero trackers, zero AI training on reading notes',
    ],
  };

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col justify-between selection:bg-secondary/80">
      {/* JSON-LD WebApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      {/* Public Header */}
      <header className="border-b border-border bg-card/30 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 text-ink hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-full bg-ink text-background flex items-center justify-center shadow-xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-serif font-medium text-xl tracking-tight">Kindle Clipper</span>
          </Link>

          <nav className="flex items-center space-x-6 text-sm font-sans">
            <Link href="/guides" className="text-muted hover:text-ink transition-colors hidden sm:inline-block">
              Guides
            </Link>
            <Link href="/privacy" className="text-muted hover:text-ink transition-colors hidden sm:inline-block">
              Privacy
            </Link>
            <Link href="/login" className="text-muted hover:text-ink transition-colors font-medium">
              Log in
            </Link>
            <Link 
              href="/signup" 
              className="bg-ink text-background px-4 py-2 rounded-lg font-medium hover:bg-ink/90 transition-all text-xs tracking-wide shadow-xs"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Landing Page Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 sm:py-24 space-y-24">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-border bg-card/40 text-xs font-sans text-muted">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Offline-First &bull; Private &bull; 100% Free</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif text-ink tracking-tight font-normal leading-[1.15]">
            Your Kindle clippings, organized and readable anywhere.
          </h1>

          <p className="font-sans text-base sm:text-lg text-muted leading-relaxed max-w-2xl mx-auto">
            You highlighted memorable passages on your e-reader, but they remain trapped in a messy text file. Kindle Clipper imports your clippings in seconds, parses them into a clean personal library, and lets you rediscover your reading notes on any device.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-ink text-background px-6 py-3.5 rounded-xl font-sans text-sm font-medium hover:bg-ink/90 transition-all shadow-sm group"
            >
              <span>Import Your Clippings</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/guides/how-to-find-my-clippings-txt"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 border border-border bg-card/40 hover:bg-secondary/40 text-ink px-6 py-3.5 rounded-xl font-sans text-sm font-medium transition-all"
            >
              <span>How to Find the File</span>
            </Link>
          </div>
        </section>

        {/* Visual Preview / Reader Demonstration Card */}
        <section className="max-w-2xl mx-auto">
          <div className="bg-card/40 border border-border rounded-2xl p-6 sm:p-10 shadow-xs space-y-6 relative overflow-hidden backdrop-blur-xs">
            <div className="flex items-center justify-between border-b border-border pb-4 text-xs font-sans text-muted">
              <div>
                <span className="font-serif font-medium text-ink text-sm">Meditations</span>
                <span className="mx-2">&bull;</span>
                <span>Marcus Aurelius</span>
              </div>
              <span className="text-[11px] uppercase tracking-wider bg-secondary/60 px-2 py-0.5 rounded">
                Highlight 14 of 42
              </span>
            </div>

            <blockquote className="font-serif text-lg sm:text-xl text-ink leading-relaxed italic pt-2">
              &ldquo;When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love.&rdquo;
            </blockquote>

            <div className="bg-secondary/30 border-l-2 border-border p-3 text-xs font-sans text-muted space-y-1">
              <span className="text-ink font-medium">Your Note:</span>
              <p>Re-read this whenever morning anxiety takes over.</p>
            </div>

            <div className="flex items-center justify-between pt-2 text-[11px] font-sans text-muted/80">
              <span>Location 412–415 &bull; Added on Kindle</span>
              <span className="flex items-center space-x-1 text-amber-700/80">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Starred</span>
              </span>
            </div>
          </div>
        </section>

        {/* How It Works in Three Steps */}
        <section className="space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-xs font-sans uppercase tracking-widest text-muted">Simple &amp; Seamless</p>
            <h2 className="text-3xl font-serif text-ink tracking-tight">How it works in three steps</h2>
            <p className="font-sans text-sm text-muted">No cloud syncing accounts required. No Amazon passwords.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-card/30 border border-border rounded-xl p-8 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center font-serif text-ink font-bold">
                  1
                </div>
                <h3 className="text-xl font-serif text-ink font-medium">Connect Your Kindle</h3>
                <p className="font-sans text-sm text-muted leading-relaxed">
                  Plug your Kindle into your computer via USB. Navigate to the <code className="text-xs bg-secondary/50 px-1 py-0.5 rounded">documents</code> folder and copy the <code className="text-xs bg-secondary/50 px-1 py-0.5 rounded">My Clippings.txt</code> file.
                </p>
              </div>
              <Link 
                href="/guides/how-to-find-my-clippings-txt"
                className="inline-flex items-center space-x-1 text-xs font-sans font-medium text-ink hover:underline pt-2"
              >
                <span>Read step-by-step guide</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Step 2 */}
            <div className="bg-card/30 border border-border rounded-xl p-8 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center font-serif text-ink font-bold">
                  2
                </div>
                <h3 className="text-xl font-serif text-ink font-medium">Instant Smart Import</h3>
                <p className="font-sans text-sm text-muted leading-relaxed">
                  Drop your file into Kindle Clipper. Our parser collapses overlapping highlight revisions, attaches user notes to the right passages, and groups everything cleanly by book.
                </p>
              </div>
              <span className="text-xs font-sans text-muted/80 flex items-center space-x-1 pt-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Automatic deduplication</span>
              </span>
            </div>

            {/* Step 3 */}
            <div className="bg-card/30 border border-border rounded-xl p-8 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center font-serif text-ink font-bold">
                  3
                </div>
                <h3 className="text-xl font-serif text-ink font-medium">Read &amp; Rediscover</h3>
                <p className="font-sans text-sm text-muted leading-relaxed">
                  Browse your personal library in focused distraction-free cards. Search past thoughts, read offline on your phone as a PWA, or receive one random quote daily via email.
                </p>
              </div>
              <Link 
                href="/guides/how-to-read-kindle-highlights-on-phone"
                className="inline-flex items-center space-x-1 text-xs font-sans font-medium text-ink hover:underline pt-2"
              >
                <span>Mobile PWA guide</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* Privacy Note Section */}
        <section className="bg-card/30 border border-border rounded-2xl p-8 sm:p-12 max-w-3xl mx-auto space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-ink">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-serif text-ink font-medium">Honest, Plain-Text Privacy</h2>
          </div>
          <p className="font-sans text-sm text-muted leading-relaxed">
            Your reading notes are an intimate window into what you think and learn. We will never sell your data, never serve advertisements, and will never train AI models on your personal notes. All offline reading data remains cached locally on your device in IndexedDB.
          </p>
          <div className="pt-2">
            <Link 
              href="/privacy" 
              className="text-xs font-sans font-medium text-ink hover:underline inline-flex items-center space-x-1"
            >
              <span>Read our complete privacy policy</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>

        {/* Featured Guides Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-serif text-ink tracking-tight">Kindle Guides &amp; Tutorials</h2>
              <p className="font-sans text-xs text-muted mt-1">Useful walkthroughs for Kindle readers</p>
            </div>
            <Link 
              href="/guides" 
              className="text-xs font-sans font-medium text-ink hover:underline inline-flex items-center space-x-1"
            >
              <span>View all guides</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {guides.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="group block bg-card/20 border border-border rounded-xl p-5 hover:bg-secondary/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-sans uppercase tracking-wider text-muted font-medium block mb-2">
                    {guide.category} &bull; {guide.readTime}
                  </span>
                  <h3 className="font-serif text-base text-ink font-medium leading-snug group-hover:text-ink/80 transition-colors mb-2">
                    {guide.shortTitle}
                  </h3>
                  <p className="font-sans text-xs text-muted line-clamp-2">
                    {guide.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center text-xs font-sans text-ink font-medium">
                  <span>Read guide</span>
                  <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="text-center py-12 border-t border-border space-y-6">
          <h2 className="text-3xl font-serif text-ink tracking-tight">
            Rediscover the books you have read.
          </h2>
          <p className="font-sans text-sm text-muted max-w-md mx-auto">
            Create an account in 10 seconds. No credit card, no telemetry, no subscriptions.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center space-x-2 bg-ink text-background px-6 py-3 rounded-xl font-sans text-sm font-medium hover:bg-ink/90 transition-all shadow-xs"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer with Amazon Disclaimer */}
      <footer className="border-t border-border py-10 bg-card/20">
        <div className="max-w-5xl mx-auto px-6 space-y-6 text-center">
          <div className="flex flex-wrap justify-center gap-6 text-xs font-sans text-muted">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            <Link href="/guides" className="hover:text-ink transition-colors">Guides</Link>
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/login" className="hover:text-ink transition-colors">Log in</Link>
            <Link href="/signup" className="hover:text-ink transition-colors">Sign up</Link>
          </div>

          <p className="text-xs font-sans text-muted max-w-xl mx-auto leading-normal">
            Kindle Clipper is an independent open-source reader companion and is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or Kindle.
          </p>
        </div>
      </footer>
    </div>
  );
}
