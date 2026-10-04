import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { processImport } from '@/lib/kindle/import';
import dbConnect from '@/lib/db';
import { z } from 'zod';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
    }

    if (!file.name.endsWith('.txt')) {
      return NextResponse.json({ error: 'Only .txt files are allowed' }, { status: 400 });
    }

    const rawText = await file.text();

    await dbConnect();
    
    const result = await processImport(session.user.id, rawText, file.name);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
  }
}
