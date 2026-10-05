import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { Highlight } from '@/lib/models/Highlight';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { sendDailyDigest } from '@/lib/email';
import crypto from 'node:crypto';
import TestEmailButton from '@/components/TestEmailButton';
import LogoutButton from '@/components/LogoutButton';
import ExportAllOfflineButton from '@/components/ExportAllOfflineButton';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return redirect('/login');

  await dbConnect();
  const user = await User.findById(session.user.id).lean();

  async function updateSettings(formData: FormData) {
    'use server';
    const session = await auth();
    if (!session?.user?.id) return;
    
    await dbConnect();
    const enabled = formData.get('dailyEmail') === 'on';
    
    await User.updateOne(
      { _id: session.user.id },
      { $set: { 'settings.dailyEmail': enabled } }
    );
    
    revalidatePath('/settings');
  }

  async function sendTestEmail() {
    'use server';
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Not logged in' };
    
    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) return { success: false, error: 'User not found' };
    
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'Resend API Key is not configured' };
    }

    const randomHighlights = await Highlight.aggregate([
      { $match: { userId: user._id, deletedAt: null } },
      { $sample: { size: 1 } }
    ]);
    
    if (randomHighlights.length === 0) return { success: false, error: 'No highlights found to send' };
    
    let token = user.unsubscribeToken;
    if (!token) {
      token = crypto.randomBytes(32).toString('hex');
      user.unsubscribeToken = token;
      await user.save();
    }
    
    try {
      await sendDailyDigest(user.email, randomHighlights, token);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to send' };
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-serif text-ink mb-8">Settings</h1>
      
      <div className="bg-card/30 border border-border rounded-xl p-6 backdrop-blur-md">
        <h2 className="text-xl font-serif text-ink mb-4">Daily Digest Email</h2>
        <p className="text-sm text-muted mb-6">
          Receive a daily email with 1 random highlight from your library to rediscover past insights.
        </p>
        
        <form action={updateSettings} className="space-y-4">
          <div className="flex items-center space-x-3">
            <input 
              type="checkbox" 
              id="email-enabled" 
              name="dailyEmail"
              className="w-4 h-4 rounded border-border text-ink focus:ring-ink bg-transparent"
              defaultChecked={user?.settings?.dailyEmail ?? false}
            />
            <label htmlFor="email-enabled" className="text-sm font-medium text-ink">
              Enable Daily Emails
            </label>
          </div>
          
          <button 
            type="submit" 
            className="mt-4 bg-ink text-background px-4 py-2 rounded text-sm font-medium hover:bg-ink/90 transition-colors"
          >
            Save preferences
          </button>
        </form>
        
        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-serif text-ink mb-2">Test Delivery</h3>
          <p className="text-sm text-muted mb-4">
            Verify your email configuration by sending a test digest immediately.
          </p>
          <TestEmailButton action={sendTestEmail} />
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-serif text-ink mb-2">Account</h3>
          <p className="text-sm text-muted mb-4">
            Sign out and clear local offline data from this device.
          </p>
          <LogoutButton />
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <h3 className="text-lg font-serif text-ink mb-2">Data</h3>
          <p className="text-sm text-muted mb-4">
            Download a markdown file of all your highlights. Works offline.
          </p>
          <ExportAllOfflineButton />
        </div>
      </div>
    </div>
  );
}
