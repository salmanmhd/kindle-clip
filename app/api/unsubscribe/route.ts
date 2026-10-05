import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return new Response('Invalid token', { status: 400 });
  }

  try {
    await dbConnect();

    const user = await User.findOneAndUpdate(
      { unsubscribeToken: token },
      { $set: { 'settings.dailyEmail': false } }
    );

    if (!user) {
      return new Response('User not found or invalid token', { status: 404 });
    }

    return new Response(`
      <html>
        <head>
          <title>Unsubscribed</title>
          <meta name="robots" content="noindex, nofollow" />
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px; color: #1C1B19; background: #FBF9F4;">
          <h2>Unsubscribed Successfully</h2>
          <p>You have been unsubscribed from the Daily Digest emails.</p>
          <a href="/" style="color: #B8872E;">Return to Kindle Clipper</a>
        </body>
      </html>
    `, {
      headers: { 
        'Content-Type': 'text/html',
        'X-Robots-Tag': 'noindex, nofollow'
      }
    });
  } catch (error: any) {
    return new Response('Error processing request', { status: 500 });
  }
}
