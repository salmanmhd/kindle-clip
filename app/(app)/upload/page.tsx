'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.txt')) {
      setError('Only .txt files are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large (max 5MB).');
      return;
    }

    setLoading(true);
    setError(null);
    setSummary(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setSummary(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      // Reset input
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-2xl font-serif mb-6 text-ink">Upload clippings</h1>
      
      {!summary && (
        <div className="space-y-6">
          <p className="text-muted text-sm">
            Connect your Kindle over USB and find the file at <code className="font-mono bg-secondary px-1 py-0.5 rounded">documents/My Clippings.txt</code>.
          </p>
          
          <div className="relative border border-dashed border-border rounded-lg p-8 text-center hover:bg-secondary/50 transition-colors">
            <input
              type="file"
              accept=".txt"
              onChange={handleFileChange}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {loading ? (
              <p className="text-sm text-ink">Reading your clippings…</p>
            ) : (
              <p className="text-sm text-ink">Click or drag your file here to upload</p>
            )}
          </div>
          
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
      )}

      {summary && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-secondary/30 rounded-lg p-6 text-center">
            <p className="text-ink font-medium">
              {summary.stats.newCount} new &middot; {summary.stats.duplicateCount} already in your library &middot; {summary.stats.mergedCount} extended &middot; {summary.stats.previouslyRemovedCount} previously removed &middot; {summary.stats.skippedCount} bookmarks skipped
            </p>
          </div>

          <div className="space-y-4">
            {summary.perBook.map((b: any) => (
              <div key={b.bookId} className="flex justify-between items-baseline border-b border-border pb-2">
                <span className="font-serif text-lg text-ink truncate mr-4">{b.title}</span>
                <span className="text-sm text-muted shrink-0">{b.newCount} new</span>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setSummary(null)}
            className="text-sm underline underline-offset-4 text-ink hover:text-muted transition-colors"
          >
            Upload another file
          </button>
        </div>
      )}
    </div>
  );
}
