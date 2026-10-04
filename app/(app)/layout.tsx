import { ReactNode } from 'react';
import Link from 'next/link';
import { Library, Star, Search, Settings, Upload, User, BookOpen } from 'lucide-react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop/Tablet Navigation */}
      <nav className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-border bg-card/30 backdrop-blur-md p-6">
        <div className="text-ink font-serif text-2xl tracking-tight font-semibold mb-12 flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-ink text-background flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <span>Kindle Clipper</span>
        </div>
        
        <div className="flex flex-col space-y-2">
          <p className="text-xs font-sans uppercase tracking-widest text-muted mb-2 px-3">Menu</p>
          <Link href="/" className="flex items-center space-x-3 text-ink/80 hover:text-ink hover:bg-secondary/50 px-3 py-2.5 rounded-lg transition-all font-medium">
            <Library className="w-5 h-5" />
            <span>Library</span>
          </Link>
          <Link href="/favourites" className="flex items-center space-x-3 text-ink/80 hover:text-ink hover:bg-secondary/50 px-3 py-2.5 rounded-lg transition-all font-medium">
            <Star className="w-5 h-5" />
            <span>Favourites</span>
          </Link>
          <Link href="/search" className="flex items-center space-x-3 text-ink/80 hover:text-ink hover:bg-secondary/50 px-3 py-2.5 rounded-lg transition-all font-medium">
            <Search className="w-5 h-5" />
            <span>Search</span>
          </Link>
        </div>
        
        <div className="mt-auto flex flex-col space-y-2">
          <Link href="/upload" className="flex items-center space-x-3 text-ink/80 hover:text-ink hover:bg-secondary/50 px-3 py-2.5 rounded-lg transition-all font-medium">
            <Upload className="w-5 h-5" />
            <span>Upload clippings</span>
          </Link>
          <Link href="/settings" className="flex items-center space-x-3 text-ink/80 hover:text-ink hover:bg-secondary/50 px-3 py-2.5 rounded-lg transition-all font-medium">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          
          <div className="pt-2 px-3 pb-2">
            <ThemeToggle />
          </div>

          <div className="border-t border-border mt-2 pt-4 px-3 flex items-center space-x-3 text-ink">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-muted" />
            </div>
            <span className="font-medium text-sm truncate">{session.user?.email}</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 min-h-screen relative">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/30 backdrop-blur-md">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-ink text-background flex items-center justify-center">
              <BookOpen className="w-3 h-3" />
            </div>
            <span className="font-serif font-medium text-ink tracking-tight">Kindle Clipper</span>
          </Link>
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Link
              href="/settings"
              className="p-2 rounded-lg text-ink/80 hover:text-ink hover:bg-secondary/50 transition-colors flex items-center justify-center"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card/85 backdrop-blur-md border-t border-border flex justify-around items-center h-16 z-50 px-1">
        <Link href="/" className="flex flex-col items-center justify-center text-ink/80 hover:text-ink transition-colors py-1 px-2">
          <Library className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Library</span>
        </Link>
        <Link href="/favourites" className="flex flex-col items-center justify-center text-ink/80 hover:text-ink transition-colors py-1 px-2">
          <Star className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Starred</span>
        </Link>
        <Link href="/upload" className="flex flex-col items-center justify-center text-ink/80 hover:text-ink transition-colors py-1 px-2">
          <Upload className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Upload</span>
        </Link>
        <Link href="/search" className="flex flex-col items-center justify-center text-ink/80 hover:text-ink transition-colors py-1 px-2">
          <Search className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Search</span>
        </Link>
        <Link href="/settings" className="flex flex-col items-center justify-center text-ink/80 hover:text-ink transition-colors py-1 px-2">
          <Settings className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Settings</span>
        </Link>
      </nav>
    </div>
  );
}
