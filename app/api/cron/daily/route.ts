import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { sendDailyDigest } from '@/lib/email';
import { getNextRevisionHighlights } from '@/lib/revision';
import crypto from 'node:crypto';

export async function GET(req: Request) {
  if (
    process.env.CRON_SECRET &&
    req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await dbConnect();

    // Find users who have dailyEmail enabled
    const users = await User.find({ 'settings.dailyEmail': true });

    let emailsSent = 0;

    for (const user of users) {
      const today = new Date().toISOString().split('T')[0];
      if (user.lastDailyEmailDate === today) {
        continue;
      }

      // Fetch next revision batch in book-wise order
      const revision = await getNextRevisionHighlights(user._id, { previewOnly: false });

      if (!revision || !revision.highlights || revision.highlights.length === 0) {
        continue;
      }

      // Ensure user has an unsubscribe token (create one if missing for backwards compatibility)
      let token = user.unsubscribeToken;
      if (!token) {
        token = crypto.randomBytes(32).toString('hex');
      }

      try {
        await sendDailyDigest(
          user.email,
          revision.highlights,
          token,
          revision.book ? {
            title: revision.book.title,
            author: revision.book.author,
            progress: revision.progress || undefined
          } : undefined
        );

        await User.updateOne({ _id: user._id }, { 
          $set: { 
            unsubscribeToken: token,
            lastDailyEmailDate: today 
          } 
        });

        emailsSent++;
      } catch (err) {
        console.error(`Failed to send email to ${user.email}`, err);
      }
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (error: any) {
    console.error('Daily cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
