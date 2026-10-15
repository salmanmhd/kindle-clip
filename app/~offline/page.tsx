export const metadata = {
  title: 'Offline — Kindle Clipper',
  robots: { index: false, follow: false },
};

export default function OfflineFallback() {
  return (
    <div className="max-w-2xl mx-auto py-24 px-6 text-center animate-in fade-in duration-300">
      <div className="mb-8 flex justify-center text-muted">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 9.86a10.94 10.94 0 00-3.32 2.69M8.53 16.11a6 6 0 011.5-1.11M12 20h.01"/>
        </svg>
      </div>
      <h1 className="text-3xl font-serif text-ink mb-4">You are offline</h1>
      <p className="text-muted font-sans text-lg mb-8 max-w-md mx-auto">
        This page requires a network connection to load. When you reconnect, try refreshing the page.
      </p>
      <a 
        href="/"
        className="px-6 py-3 bg-ink text-background rounded-full font-sans text-sm tracking-wide hover:bg-ink/90 transition-colors inline-block"
      >
        Try Again
      </a>
    </div>
  );
}
