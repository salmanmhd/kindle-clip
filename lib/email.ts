import { Resend } from 'resend';
import { IHighlight } from './models/Highlight';

// We'll use a placeholder key or allow it to be undefined for dev
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendDailyDigest(email: string, highlights: IHighlight[], unsubscribeToken: string) {
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

  const htmlContent = `
    <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #1C1B19; line-height: 1.6;">
      <div style="text-align: center; margin-bottom: 40px; border-bottom: 1px solid #E6E1D6; padding-bottom: 20px;">
        <h1 style="font-size: 24px; font-weight: normal; letter-spacing: -0.02em;">Kindle Clipper</h1>
        <p style="color: #8A857B; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em;">Your Daily Digest</p>
      </div>

      <div style="margin-bottom: 40px;">
        ${highlights.map(h => `
          <div style="margin-bottom: 30px; padding-bottom: 30px; border-bottom: 1px dashed #E6E1D6;">
            <p style="font-size: 18px; line-height: 1.7; margin-bottom: 15px;">"${escapeHtml(h.text)}"</p>
            ${h.note ? `<p style="font-size: 16px; font-style: italic; color: #8A857B; border-left: 2px solid #E6E1D6; padding-left: 15px;">Note: ${escapeHtml(h.note)}</p>` : ''}
            <div style="margin-top: 15px;">
              <a href="${appUrl}/books/${h.bookId}" style="color: #B8872E; text-decoration: none; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">
                Read in context &rarr;
              </a>
            </div>
          </div>
        `).join('')}
      </div>

      <div style="text-align: center; margin-top: 60px; padding-top: 20px; border-top: 1px solid #E6E1D6;">
        <p style="font-family: sans-serif; font-size: 12px; color: #8A857B;">
          You are receiving this because you enabled Daily Digests in Kindle Clipper.
        </p>
        <p style="font-family: sans-serif; font-size: 12px;">
          <a href="${unsubscribeUrl}" style="color: #8A857B; text-decoration: underline;">Unsubscribe instantly</a>
        </p>
      </div>
    </div>
  `;

  const fromAddress = process.env.MAIL_FROM
    ? (process.env.MAIL_FROM.includes('<') ? process.env.MAIL_FROM : `Kindle Clipper <${process.env.MAIL_FROM}>`)
    : 'Kindle Clipper <onboarding@resend.dev>';

  try {
    const result = await resend.emails.send({
      from: fromAddress,
      to: email,
      subject: 'Your Kindle Highlights - Daily Digest',
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
