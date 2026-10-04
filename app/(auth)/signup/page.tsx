'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signup } from '@/app/actions/auth';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      const res = await signup(formData);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push('/login');
      }
    } catch (err: any) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-serif text-ink mb-6 text-center">Create an account</h2>
      
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
            minLength={8}
            className="w-full bg-input border-none rounded px-3 py-2 text-ink focus:ring-1 focus:ring-ring"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-background py-2 rounded hover:bg-ink/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-ink hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
