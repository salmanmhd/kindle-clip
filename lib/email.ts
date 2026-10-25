import { Resend } from 'resend';
import { IHighlight } from './models/Highlight';

// We'll use a placeholder key or allow it to be undefined for dev
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface DigestBookInfo {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  progress?: {
    revised: number;
    total: number;
    percent?: number;
  };
}

export async function sendDailyDigest(
  email: string, 
  highlights: IHighlight[], 
  unsubscribeToken: string,
  bookInfo?: DigestBookInfo
) {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Skipping email send to:', email);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kindle-clip.vercel.app';
  const unsubscribeUrl = `${appUrl}/api/unsubscribe?token=${unsubscribeToken}`;

  const htmlContent = renderDigestHtml(highlights, { appUrl, unsubscribeUrl, bookInfo });

  const fromAddress = process.env.MAIL_FROM
    ? (process.env.MAIL_FROM.includes('<') ? process.env.MAIL_FROM : `Kindle Clipper <${process.env.MAIL_FROM}>`)
    : 'Kindle Clipper <onboarding@resend.dev>';

  const words = (highlights[0]?.text || '').split(/\s+/).filter(Boolean);
  const snippet = words.slice(0, 5).join(' ') + (words.length > 5 ? '…' : '');
  const bookName = bookInfo?.title ? displayTitle(bookInfo.title) : '';
  const subject = snippet && bookName ? `${snippet} | ${bookName}` : snippet || bookName || 'Your Kindle Highlights';

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject,
      html: htmlContent,
    });

    if (result.error) {
      console.error('Failed to send email via Resend:', result.error);
      throw new Error(result.error.message || 'Failed to send email via Resend');
    }

    console.log(`Successfully sent digest to ${email}`);
    return result.data;
  } catch (error: any) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

const escapeHtml = (unsafe: string) =>
  unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

// Kindle titles carry subtitles and edition noise; authors are often "Last, First"
const displayTitle = (t: string) => t.replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').split(/:|\s[-–—]\s/)[0].replace(/\s+/g, ' ').trim() || t;
const displayAuthor = (a?: string | null) => {
  if (!a) return null;
  const parts = a.split(/;|&/)[0].split(',').map(p => p.trim()).filter(Boolean);
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : a.trim();
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const C = { bg: '#F4F1EA', paper: '#FBF9F4', ink: '#1C1B19', body: '#2C2A26', muted: '#8A857B', rule: '#E6E1D6', accent: '#B8872E' };

// Pure black dark palette (crisp black & white, no yellow/warm undertones)
const D = { bg: '#000000', paper: '#000000', ink: '#FFFFFF', body: '#ECECEC', muted: '#8E8E93', rule: '#222222', accent: '#D4AF37' };

const themeCss = (scope: string, P: typeof C | typeof D) => `
    ${scope}.kc-bg, ${scope}.kc-paper { background:${P.paper} !important; background-color:${P.paper} !important; }
    ${scope}.kc-ink { color:${P.ink} !important; }
    ${scope}.kc-body { color:${P.body} !important; }
    ${scope}.kc-muted { color:${P.muted} !important; }
    ${scope}.kc-rule { border-color:${P.rule} !important; }
    ${scope}.kc-rule-bg { background:${P.rule} !important; background-color:${P.rule} !important; }`;

/**
 * Email-safe HTML for the daily digest: table layout with inline styles.
 * Mobile-first: tight gutters, 18px serif quotes. Everything that isn't a quote
 * (source, library link, unsubscribe) sits small and muted at the bottom.
 */
export function renderDigestHtml(
  highlights: Pick<IHighlight, '_id' | 'text' | 'note' | 'bookId'>[],
  { appUrl, unsubscribeUrl, bookInfo }: { appUrl: string; unsubscribeUrl: string; bookInfo?: DigestBookInfo }
) {
  const title = bookInfo ? displayTitle(bookInfo.title) : null;
  const author = displayAuthor(bookInfo?.author);
  const progress = bookInfo?.progress;
  const preheader = escapeHtml(highlights[0]?.text.slice(0, 110) || 'Your highlights for today');
  const dateLabel = new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());
  const bookId = highlights[0]?.bookId;

  const quotes = highlights
    .map(
      (h, i) => `
      ${i > 0 ? `<tr><td class="kc-pad" style="padding:0 16px;"><div class="kc-rule-bg" style="height:1px;background:${C.rule};font-size:0;line-height:0;">&nbsp;</div></td></tr>` : ''}
      <tr><td class="kc-pad" style="padding:${i === 0 ? 4 : 16}px 16px 16px;">
        <p class="kc-body" style="font-family:${SERIF};font-size:21px;line-height:1.55;color:${C.body};margin:0;">${escapeHtml(h.text)}</p>
        ${h.note ? `<p class="kc-muted kc-rule" style="font-family:${SERIF};font-style:italic;font-size:16px;line-height:1.55;color:${C.muted};margin:14px 0 0;padding-left:12px;border-left:2px solid ${C.rule};">${escapeHtml(h.note)}</p>` : ''}
        <p style="margin:12px 0 0;"><a class="kc-muted" href="${appUrl}/read?book=${h.bookId}&amp;highlight=${h._id}" style="font-family:${SANS};font-size:12px;color:${C.muted};text-decoration:underline;">Open highlight</a></p>
      </td></tr>`
    )
    .join('');

  const sourceLine = title
    ? `<a href="${appUrl}/book?id=${bookId}" class="kc-muted" style="color:${C.muted};text-decoration:none;"><span class="kc-ink" style="font-family:${SERIF};font-size:15px;color:${C.ink};">${escapeHtml(title)}</span>${author ? ` &middot; ${escapeHtml(author)}` : ''}${progress ? ` &middot; ${progress.revised}/${progress.total} revisited` : ''}</a><br>`
    : '';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>Kindle Clipper</title>
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }

  @media only screen and (max-width: 600px) {
    .kc-pad { padding-left: 14px !important; padding-right: 14px !important; }
  }

  @media (prefers-color-scheme: dark) {
    ${themeCss('', D)}
  }

  /* Header toggle: Apple Mail / iOS Mail only (they support :checked). Hidden elsewhere. */
  .kc-toggle { display:none; }
  .kc-switch { position:absolute; opacity:0; width:0; height:0; }
  @supports (-webkit-touch-callout: none) {
    .kc-toggle { display:inline-block !important; }
  }
  @media (prefers-color-scheme: dark) {
    ${themeCss('#kc-mode:checked ~ .kc-wrap ', C)}
  }
  @media (prefers-color-scheme: light) {
    ${themeCss('#kc-mode:checked ~ .kc-wrap ', D)}
  }

  [data-ogsc] .kc-bg, [data-ogsb] .kc-bg, [data-ogsb] .kc-paper { background:${D.bg} !important; background-color:${D.bg} !important; }
  [data-ogsc] .kc-ink { color:${D.ink} !important; }
  [data-ogsc] .kc-body { color:${D.body} !important; }
  [data-ogsc] .kc-muted { color:${D.muted} !important; }
  [data-ogsc] .kc-rule { border-color:${D.rule} !important; }
  [data-ogsc] .kc-rule-bg, [data-ogsb] .kc-rule-bg { background:${D.rule} !important; background-color:${D.rule} !important; }
</style></head>
<body class="kc-bg" style="margin:0;padding:0;background:transparent;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <input type="checkbox" id="kc-mode" class="kc-switch">
  <div class="kc-wrap kc-bg" style="background:transparent;">
  <table class="kc-bg" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:transparent;">
    <tr><td align="center">
      <table class="kc-paper" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:transparent;">
        <tr><td class="kc-pad" style="padding:14px 16px 2px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="kc-muted" style="font-family:${SANS};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${C.muted};">Daily highlights &middot; ${dateLabel}</td><td align="right"><label for="kc-mode" class="kc-toggle kc-muted kc-rule" style="font-family:${SANS};font-size:12px;color:${C.muted};border:1px solid ${C.rule};border-radius:12px;padding:3px 10px;">Light / Dark</label></td></tr></table></td></tr>
        ${quotes}
        <tr><td class="kc-pad kc-muted kc-rule" style="padding:12px 16px 24px;font-family:${SANS};font-size:12px;line-height:1.7;color:${C.muted};border-top:1px solid ${C.rule};">
          ${sourceLine}
          <a class="kc-muted" href="${appUrl}/library" style="color:${C.muted};text-decoration:underline;">Open library</a> &middot;
          <a class="kc-muted" href="${unsubscribeUrl}" style="color:${C.muted};text-decoration:underline;">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
  </div>
</body></html>`;
}
