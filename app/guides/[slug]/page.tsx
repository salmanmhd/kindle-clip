import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Clock, Calendar, ArrowLeft, CheckCircle2, Lightbulb } from 'lucide-react';
import { getAllGuides, getGuideBySlug } from '@/lib/guides';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kindle-clip.vercel.app';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const guides = getAllGuides();
  return guides.map((g) => ({
    slug: g.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    return {
      title: 'Guide Not Found — Kindle Clipper',
      robots: { index: false, follow: false },
    };
  }

  const guideUrl = `${appUrl}/guides/${guide.slug}`;

  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: guideUrl,
    },
    openGraph: {
      title: `${guide.title} — Kindle Clipper`,
      description: guide.description,
      url: guideUrl,
      type: 'article',
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      siteName: 'Kindle Clipper',
      images: [
        {
          url: `${appUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: guide.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.title,
      description: guide.description,
      images: [`${appUrl}/opengraph-image`],
    },
  };
}

export default async function GuideDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.updatedAt,
    author: {
      '@type': 'Organization',
      name: 'Kindle Clipper',
      url: appUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Kindle Clipper',
      url: appUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${appUrl}/icon.jpg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${appUrl}/guides/${guide.slug}`,
    },
  };

  return (
    <div className="min-h-screen bg-background text-ink flex flex-col justify-between">
      {/* JSON-LD Article Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

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
            <Link href="/guides" className="text-ink font-medium">
              Guides
            </Link>
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
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center space-x-2 text-xs font-sans text-muted">
            <li>
              <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/guides" className="hover:text-ink transition-colors">Guides</Link>
            </li>
            <li>/</li>
            <li className="text-ink truncate max-w-[200px] sm:max-w-none" aria-current="page">
              {guide.shortTitle}
            </li>
          </ol>
        </nav>

        {/* Article Header */}
        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-muted mb-4">
            <span className="bg-secondary/60 text-ink/80 px-2.5 py-0.5 rounded font-medium">
              {guide.category}
            </span>
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{guide.readTime}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <time dateTime={guide.updatedAt}>Updated {guide.updatedAt}</time>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif text-ink tracking-tight leading-tight mb-6">
            {guide.title}
          </h1>

          <p className="font-serif text-lg text-ink/85 italic leading-relaxed border-l-2 border-border pl-4">
            {guide.lead}
          </p>
        </header>

        {/* Article Body */}
        <article className="space-y-10 border-t border-border pt-8">
          {guide.sections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-2xl font-serif text-ink font-medium tracking-tight">
                {section.heading}
              </h2>

              {section.paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="font-sans text-sm sm:text-base text-muted leading-relaxed">
                  {para}
                </p>
              ))}

              {section.steps && section.steps.length > 0 && (
                <ol className="space-y-4 my-6">
                  {section.steps.map((st) => (
                    <li key={st.step} className="bg-card/40 border border-border rounded-xl p-5 flex items-start space-x-4">
                      <div className="w-7 h-7 rounded-full bg-ink text-background flex items-center justify-center font-sans font-bold text-xs shrink-0 mt-0.5">
                        {st.step}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-serif font-medium text-ink">
                          {st.title}
                        </h3>
                        <p className="font-sans text-sm text-muted leading-relaxed">
                          {st.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {section.tips && section.tips.length > 0 && (
                <div className="bg-secondary/40 border border-border/80 rounded-xl p-5 space-y-2.5 my-6">
                  <div className="flex items-center space-x-2 text-ink text-xs font-sans uppercase tracking-wider font-semibold">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span>Helpful Tips</span>
                  </div>
                  <ul className="space-y-2 text-sm font-sans text-muted leading-relaxed list-disc list-inside">
                    {section.tips.map((tip, tIdx) => (
                      <li key={tIdx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          ))}
        </article>

        {/* Call to action card */}
        <div className="mt-14 p-6 sm:p-8 bg-card/40 border border-border rounded-xl text-center space-y-4">
          <h2 className="text-xl font-serif text-ink font-medium">Ready to organize your clippings?</h2>
          <p className="font-sans text-sm text-muted max-w-md mx-auto">
            Upload your My Clippings.txt file to Kindle Clipper. Free, offline-first, and completely private.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-block bg-ink text-background px-5 py-2.5 rounded-lg font-sans text-sm font-medium hover:bg-ink/90 transition-colors"
            >
              Get Started for Free &rarr;
            </Link>
          </div>
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
