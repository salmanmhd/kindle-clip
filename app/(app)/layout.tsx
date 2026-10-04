import { ReactNode } from 'react';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop/Tablet Navigation */}
      <nav className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-border p-6 space-y-8">
        <div className="text-ink font-serif text-xl tracking-tight">Kindle Clipper</div>
        <div className="flex flex-col space-y-4">
          <Link href="/" className="text-ink hover:text-muted transition-colors">Library</Link>
          <Link href="/read" className="text-ink hover:text-muted transition-colors">Read</Link>
          <Link href="/favourites" className="text-ink hover:text-muted transition-colors">Favourites</Link>
          <Link href="/search" className="text-ink hover:text-muted transition-colors">Search</Link>
        </div>
        <div className="mt-auto">
          <Link href="/upload" className="text-sm text-muted hover:text-ink transition-colors block mb-4">Upload clippings</Link>
          <Link href="/settings" className="text-sm text-muted hover:text-ink transition-colors">Settings</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-background border-t border-border flex justify-around items-center h-14 z-50">
        <Link href="/" className="text-sm text-ink px-4 py-2 hover:bg-secondary/50 rounded transition-colors">Library</Link>
        <Link href="/read" className="text-sm text-ink px-4 py-2 hover:bg-secondary/50 rounded transition-colors">Read</Link>
        <Link href="/favourites" className="text-sm text-ink px-4 py-2 hover:bg-secondary/50 rounded transition-colors">Starred</Link>
        <Link href="/search" className="text-sm text-ink px-4 py-2 hover:bg-secondary/50 rounded transition-colors">Search</Link>
      </nav>
    </div>
  );
}
