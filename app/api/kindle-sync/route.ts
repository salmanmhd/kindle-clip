import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User } from '@/lib/models/User';
import { processImport } from '@/lib/kindle/import';

export const maxDuration = 60;

// Token-authenticated ingestion for an unattended client (e.g. a script running on the
// Kindle itself) that can't hold a browser session cookie. The token is opaque and only
// ever sent by a script the user controls, so a bearer check is enough here.
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Missing Authorization: Bearer <token>' }, { status: 401 });
  }

  try {
    await dbConnect();
    const user = await User.findOne({ uploadToken: token });
    if (!user) {
      return NextResponse.json({ error: 'Invalid upload token' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let rawText: string;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      if (file.size > 4 * 1024 * 1024) {
        return NextResponse.json({ error: 'File exceeds 4MB limit' }, { status: 400 });
      }
      rawText = await file.text();
    } else {
      // Plain-text body: the simplest case for a curl/wget one-liner from the device.
      rawText = await req.text();
      if (rawText.length > 4 * 1024 * 1024) {
        return NextResponse.json({ error: 'File exceeds 4MB limit' }, { status: 400 });
      }
    }

    if (!rawText.trim()) {
      return NextResponse.json({ error: 'Empty file' }, { status: 400 });
    }

    // processImport already dedupes by a hash of the normalized highlight text, so
    // re-sending the same My Clippings.txt (growing or not) is always safe to repeat.
    const result = await processImport(user._id.toString(), rawText, 'My Clippings.txt');

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Kindle sync import error:', error);
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
  }
}
