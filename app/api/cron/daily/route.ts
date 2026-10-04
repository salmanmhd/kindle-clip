import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { Highlight } from '@/lib/models/Highlight';
import { sendDailyDigest } from '@/lib/email';
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
    const users = await User.find({ 'settings.dailyEmail': true }).lean();

    let emailsSent = 0;

    for (const user of users) {
      // Find 5 random highlights for this user
      // We use aggregation pipeline $sample
      const randomHighlights = await Highlight.aggregate([
        { $match: { userId: user._id, deletedAt: null } },
        { $sample: { size: 5 } }
      ]);

      if (randomHighlights.length === 0) continue;

      const today = new Date().toISOString().split('T')[0];
      if (user.lastDailyEmailDate === today) {
        continue;
      }

      // Ensure user has an unsubscribe token (create one if missing for backwards compatibility)
      let token = user.unsubscribeToken;
      if (!token) {
        token = crypto.randomBytes(32).toString('hex');
      }

      try {
        await sendDailyDigest(user.email, randomHighlights, token);
        await User.updateOne({ _id: user._id }, { 
          $set: { 
            unsubscribeToken: token,
            lastDailyEmailDate: today 
          } 
        });
        await Highlight.updateMany(
          { _id: { $in: randomHighlights.map(h => h._id) } },
          { $set: { emailedAt: new Date() } }
        );
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
