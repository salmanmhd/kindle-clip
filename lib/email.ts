import { Resend } from 'resend';
import { IHighlight } from './models/Highlight';

// We'll use a placeholder key or allow it to be undefined for dev
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface DigestBookInfo {
  title: string;
  author?: string | null;
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

  const escapeHtml = (unsafe: string) => {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  };

  const percent = bookInfo?.progress?.total 
    ? Math.min(100, Math.round((bookInfo.progress.revised / bookInfo.progress.total) * 100))
    : 0;

  const htmlContent = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #1C1B19; line-height: 1.6; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 1px solid #E6E1D6; padding-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: normal; letter-spacing: -0.02em; margin: 0 0 6px 0;">Kindle Clipper</h1>
        <p style="color: #8A857B; font-family: sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">Daily Revision Digest</p>
      </div>

      ${bookInfo ? `
        <div style="background-color: #F8F6F1; border: 1px solid #E6E1D6; border-radius: 8px; padding: 18px 22px; margin-bottom: 35px; font-family: sans-serif;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8A857B; margin-bottom: 4px;">Currently Revising</div>
          <div style="font-size: 19px; font-family: 'Georgia', serif; font-weight: bold; color: #1C1B19; line-height: 1.3;">${escapeHtml(bookInfo.title)}</div>
          ${bookInfo.author ? `<div style="font-size: 13px; color: #6E685F; margin-top: 3px;">by ${escapeHtml(bookInfo.author)}</div>` : ''}
          ${bookInfo.progress ? `
            <div style="margin-top: 14px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #8A857B; margin-bottom: 6px;">
                <span>Revision Progress</span>
                <strong>${bookInfo.progress.revised} / ${bookInfo.progress.total} highlights (${percent}%)</strong>
              </div>
              <div style="width: 100%; height: 6px; background-color: #E6E1D6; border-radius: 3px; overflow: hidden;">
                <div style="width: ${percent}%; height: 100%; background-color: #B8872E; border-radius: 3px;"></div>
              </div>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div style="margin-bottom: 40px;">
        ${highlights.map(h => `
          <div style="margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px dashed #E6E1D6;">
            <p style="font-size: 17px; line-height: 1.7; margin-bottom: 15px; color: #2C2A26;">"${escapeHtml(h.text)}"</p>
            ${h.note ? `<p style="font-size: 15px; font-style: italic; color: #8A857B; border-left: 2px solid #B8872E; padding-left: 15px; margin-bottom: 12px;">Note: ${escapeHtml(h.note)}</p>` : ''}
            <div style="margin-top: 15px;">
              <a href="${appUrl}/book?id=${h.bookId}" style="color: #B8872E; text-decoration: none; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">
                Read in context &rarr;
              </a>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #E6E1D6;">
        <p style="font-family: sans-serif; font-size: 12px; color: #8A857B; margin: 0 0 8px 0;">
          You are receiving this because you enabled Daily Digest in Kindle Clipper.
        </p>
        <p style="font-family: sans-serif; font-size: 12px; margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #8A857B; text-decoration: underline;">Unsubscribe instantly</a>
        </p>
      </div>
    </div>
  `;

  const fromAddress = process.env.MAIL_FROM
    ? (process.env.MAIL_FROM.includes('<') ? process.env.MAIL_FROM : `Kindle Clipper <${process.env.MAIL_FROM}>`)
    : 'Kindle Clipper <onboarding@resend.dev>';

  const subject = bookInfo?.title 
    ? `Daily Revision: ${bookInfo.title}` 
    : 'Your Kindle Highlights - Daily Digest';

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
