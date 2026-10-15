import { ImageResponse } from 'next/og';
import mongoose from 'mongoose';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import { Book } from '@/lib/models/Book';
import { Highlight } from '@/lib/models/Highlight';
import {
  CARD_FORMATS,
  CARD_THEMES,
  CardFormat,
  CardTheme,
  QuoteCard,
  fitQuote,
  loadCardFonts,
  loadCoverDataUrl
} from '@/lib/quote-card';
import { cleanAuthor, cleanTitle } from '@/lib/covers';

// GET /api/highlights/:id/card?theme=paper|sepia|night&format=square|story|wide&cover=0
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return new Response('Not found', { status: 404 });

  const url = new URL(req.url);
  const themeParam = url.searchParams.get('theme') || 'paper';
  const formatParam = url.searchParams.get('format') || 'square';
  const theme: CardTheme = themeParam in CARD_THEMES ? (themeParam as CardTheme) : 'paper';
  const format: CardFormat = formatParam in CARD_FORMATS ? (formatParam as CardFormat) : 'square';
  const showCover = url.searchParams.get('cover') !== '0';

  try {
    await dbConnect();
    const highlight = await Highlight.findOne({ _id: id, userId: session.user.id, deletedAt: null }).lean();
    if (!highlight) return new Response('Not found', { status: 404 });
    const book = await Book.findOne({ _id: highlight.bookId, userId: session.user.id }).lean();

    // Kindle titles carry subtitles and "(Penguin Classics)"-style noise; authors are often "Last, First"
    const title = (book && cleanTitle(book.title)) || book?.title || 'Unknown book';
    const author = cleanAuthor(book?.author) || null;
    const { quote, fontSize } = fitQuote(highlight.text, format);

    const [fonts, cover] = await Promise.all([
      loadCardFonts(quote, `${title}${author || ''}KINDLE CLIPPER…`),
      showCover ? loadCoverDataUrl(book?.coverUrl) : Promise.resolve(null)
    ]);

    return new ImageResponse(
      <QuoteCard quote={quote} fontSize={fontSize} title={title} author={author} cover={cover} theme={theme} format={format} />,
      {
        ...CARD_FORMATS[format],
        fonts,
        headers: {
          // Private highlight text: never cache in shared caches
          'Cache-Control': 'private, max-age=3600'
        }
      }
    );
  } catch (err) {
    console.error('Quote card render failed', err);
    return new Response('Failed to generate image', { status: 500 });
  }
}
