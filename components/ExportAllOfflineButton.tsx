'use client';

import { Download } from 'lucide-react';
import { getDB, LocalBook, LocalHighlight } from '@/lib/indexeddb';

export default function ExportAllOfflineButton() {
  const handleExport = async () => {
    try {
      const db = await getDB();
      if (!db) {
        alert('Database not initialized');
        return;
      }
      
      const books = await db.getAll('books');
      const highlights = await db.getAll('highlights');
      
      if (books.length === 0 || highlights.length === 0) {
        alert('No data available to export');
        return;
      }

      // Group highlights by bookId
      const highlightsByBook = highlights.reduce((acc, h) => {
        if (!acc[h.bookId]) acc[h.bookId] = [];
        acc[h.bookId].push(h);
        return acc;
      }, {} as Record<string, LocalHighlight[]>);

      let markdown = `# My Kindle Highlights\n\n`;
      
      for (const book of books) {
        const bookHighlights = highlightsByBook[book._id] || [];
        if (bookHighlights.length === 0) continue;
        
        bookHighlights.sort((a, b) => (a.locStart || 0) - (b.locStart || 0));
        
        markdown += `## ${book.title}\n`;
        if (book.author) markdown += `*${book.author}*\n\n`;
        else markdown += `\n`;
        
        for (const h of bookHighlights) {
          markdown += `> ${h.text}\n\n`;
          if (h.note) markdown += `**Note:** ${h.note}\n\n`;
        }
        markdown += `---\n\n`;
      }

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `All_Kindle_Highlights.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to export offline', e);
      alert('Failed to export highlights');
    }
  };

  return (
    <button 
      onClick={handleExport}
      className="flex items-center space-x-2 text-sm text-ink/80 hover:text-ink transition-colors py-2"
    >
      <Download className="w-4 h-4" />
      <span>Export all highlights</span>
    </button>
  );
}
