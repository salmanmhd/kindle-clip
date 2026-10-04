import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Book } from '@/lib/models/Book';
import { Highlight } from '@/lib/models/Highlight';

export async function GET(req: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { bookId } = await params;

  await dbConnect();
  
  const book = await Book.findOne({ _id: bookId, userId: session.user.id });
  if (!book) {
    return new Response('Book not found', { status: 404 });
  }

  const highlights = await Highlight.find({ bookId, userId: session.user.id, deletedAt: null })
    .sort({ locStart: 1 })
    .lean();

  let markdown = `# ${book.title}\n`;
  if (book.author) {
    markdown += `**Author:** ${book.author}\n`;
  }
  markdown += `\n---\n\n`;

  for (const h of highlights) {
    markdown += `> ${h.text}\n`;
    if (h.note) {
      markdown += `\n**Note:** ${h.note}\n`;
    }
    
    let meta = [];
    if (h.page) meta.push(`Page ${h.page}`);
    if (h.locStart) {
      if (h.locStart === h.locEnd) meta.push(`Loc ${h.locStart}`);
      else meta.push(`Loc ${h.locStart}-${h.locEnd}`);
    }
    if (meta.length > 0) {
      markdown += `\n*${meta.join(' · ')}*\n`;
    }
    markdown += `\n---\n\n`;
  }

  const filename = `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_highlights.md`;

  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/markdown',
      'Content-Disposition': `attachment; filename="${filename}"`
    }
  });
}
