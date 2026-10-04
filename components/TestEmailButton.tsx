'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

export default function TestEmailButton({ action }: { action: () => Promise<{ success: boolean; error?: string }> }) {
  const [isPending, startTransition] = useTransition();

  const handleTestEmail = () => {
    startTransition(async () => {
      try {
        const result = await action();
        if (result.success) {
          toast.success('Test email sent successfully! Check your inbox.');
        } else {
          toast.error(result.error || 'Failed to send test email.');
        }
      } catch (err) {
        toast.error('An unexpected error occurred.');
      }
    });
  };

  return (
    <button 
      onClick={handleTestEmail}
      disabled={isPending}
      className="bg-secondary text-ink px-4 py-2 rounded text-sm font-medium hover:bg-secondary/80 transition-colors border border-border disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? 'Sending...' : 'Send test email now'}
    </button>
  );
}
