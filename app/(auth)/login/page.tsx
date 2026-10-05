'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { login } from '@/app/actions/auth';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/library';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await login(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err: any) {
      if (err.message?.includes('NEXT_REDIRECT')) {
        // NextAuth redirect works via throwing an error
        router.push(callbackUrl);
        router.refresh();
      } else {
        setError('An unexpected error occurred.');
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-6 text-center">Log in to your account</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-sans text-ink mb-1" htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full bg-input border-none rounded px-3 py-2 text-ink focus:ring-1 focus:ring-ring"
          />
        </div>
        
        <div>
          <label className="block text-sm font-sans text-ink mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full bg-input border-none rounded px-3 py-2 text-ink focus:ring-1 focus:ring-ring"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-background py-2 rounded hover:bg-ink/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-ink hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-6 text-sm text-muted">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
