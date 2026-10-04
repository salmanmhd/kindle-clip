'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { db } from '@/lib/indexeddb';

export default function LogoutButton() {
  const handleLogout = async () => {
    // Clear offline cache
    try {
      await db.delete();
    } catch (e) {
      console.error('Failed to clear local database', e);
    }
    
    // Clear Service Worker caches if any
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (e) {
        console.error('Failed to clear caches', e);
      }
    }

    // Call NextAuth sign out
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center space-x-2 text-sm text-red-700/80 hover:text-red-700 transition-colors py-2"
    >
      <LogOut className="w-4 h-4" />
      <span>Sign Out</span>
    </button>
  );
}
