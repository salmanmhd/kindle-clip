import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

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

  return (
    <div className="max-w-2xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-serif text-ink mb-8">Settings</h1>
      
      <div className="bg-card/30 border border-border rounded-xl p-6 backdrop-blur-md">
        <h2 className="text-xl font-serif text-ink mb-4">Daily Digest Email</h2>
        <p className="text-sm text-muted mb-6">
          Receive a daily email with 5 random highlights from your library to rediscover past insights.
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
      </div>
    </div>
  );
}
