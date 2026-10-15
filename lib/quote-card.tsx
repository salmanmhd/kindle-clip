// Shared pieces for the quote image card rendered with next/og.

export const CARD_THEMES = {
  paper: { bg: '#FBF9F4', ink: '#1C1B19', muted: '#6B665D', rule: '#E6E1D6', accent: '#B8872E' },
  sepia: { bg: '#F5F0E1', ink: '#4A3E35', muted: '#8A7F70', rule: '#DFD7C2', accent: '#B8872E' },
  night: { bg: '#121212', ink: '#D8D4CB', muted: '#8C877D', rule: '#34312A', accent: '#C9973A' }
} as const;

export const CARD_FORMATS = {
  square: { width: 1080, height: 1080 },
  story: { width: 1080, height: 1920 },
  wide: { width: 1200, height: 630 }
} as const;

export type CardTheme = keyof typeof CARD_THEMES;
export type CardFormat = keyof typeof CARD_FORMATS;

const MAX_CHARS = 900;

export function fitQuote(text: string, format: CardFormat) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const quote = clean.length > MAX_CHARS ? `${clean.slice(0, MAX_CHARS).replace(/\s+\S*$/, '')}…` : clean;
  const len = quote.length;
  // Font size steps tuned so the longest quote still fits with the footer
  const steps: Record<CardFormat, [number, number][]> = {
    square: [[100, 60], [200, 50], [350, 42], [550, 35], [750, 30], [Infinity, 27]],
    story: [[100, 72], [200, 62], [350, 54], [550, 46], [750, 40], [Infinity, 36]],
    wide: [[80, 52], [160, 42], [280, 34], [420, 28], [600, 24], [Infinity, 21]]
  };
  const fontSize = steps[format].find(([max]) => len <= max)![1];
  return { quote, fontSize };
}

const fontCache = new Map<string, ArrayBuffer>();

// Google Fonts returns a TTF subset containing only the requested glyphs when no
// browser user agent is sent, which keeps each card's font payload tiny.
async function loadGoogleFont(family: string, weight: number, text: string, italic = false) {
  const key = `${family}:${weight}:${italic}:${text}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const axis = italic ? `ital,wght@1,${weight}` : `wght@${weight}`;
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${axis}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url, { signal: AbortSignal.timeout(5000) })).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!src) throw new Error(`No font file for ${family}`);
  const data = await (await fetch(src, { signal: AbortSignal.timeout(5000) })).arrayBuffer();

  if (fontCache.size > 100) fontCache.delete(fontCache.keys().next().value!);
  fontCache.set(key, data);
  return data;
}

export async function loadCardFonts(quoteText: string, footerText: string) {
  const serifText = `“”…${quoteText}`;
  const requests: Promise<{ name: string; data: ArrayBuffer; weight: 400 | 600; style: 'normal' | 'italic' }>[] = [
    loadGoogleFont('Literata', 400, serifText).then(data => ({ name: 'Literata', data, weight: 400 as const, style: 'normal' as const })),
    loadGoogleFont('Instrument Sans', 600, footerText).then(data => ({ name: 'Instrument Sans', data, weight: 600 as const, style: 'normal' as const })),
    loadGoogleFont('Instrument Sans', 400, footerText).then(data => ({ name: 'Instrument Sans', data, weight: 400 as const, style: 'normal' as const }))
  ];
  const all = quoteText + footerText;
  if (/[ऀ-ॿ]/.test(all)) {
    requests.push(loadGoogleFont('Noto Serif Devanagari', 400, all).then(data => ({ name: 'Noto Serif Devanagari', data, weight: 400 as const, style: 'normal' as const })));
  }
  if (/[؀-ۿ]/.test(all)) {
    requests.push(loadGoogleFont('Noto Naskh Arabic', 400, all).then(data => ({ name: 'Noto Naskh Arabic', data, weight: 400 as const, style: 'normal' as const })));
  }
  // A missing font only degrades the card to the built-in sans, so don't fail the render
  const settled = await Promise.allSettled(requests);
  return settled.flatMap(r => (r.status === 'fulfilled' ? [r.value] : []));
}

// Embeds the cover as a data URL so a slow or missing cover can't fail the whole render
export async function loadCoverDataUrl(coverUrl: string | null | undefined) {
  if (!coverUrl) return null;
  try {
    const res = await fetch(coverUrl, { signal: AbortSignal.timeout(4000) });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.startsWith('image/')) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // Open Library serves a 1x1 placeholder for some ids
    if (buf.length < 1000) return null;
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

interface CardProps {
  quote: string;
  fontSize: number;
  title: string;
  author: string | null;
  cover: string | null;
  theme: CardTheme;
  format: CardFormat;
}

export function QuoteCard({ quote, fontSize, title, author, cover, theme, format }: CardProps) {
  const c = CARD_THEMES[theme];
  const { width, height } = CARD_FORMATS[format];
  const pad = format === 'wide' ? 64 : format === 'story' ? 110 : 96;
  const coverW = format === 'wide' ? 56 : format === 'story' ? 110 : 84;
  // Footer text sizes: [title, author, wordmark]
  const [titleSize, authorSize, markSize] = format === 'wide' ? [22, 18, 14] : format === 'story' ? [36, 30, 20] : [28, 23, 17];

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: c.bg,
        color: c.ink,
        padding: pad,
        fontFamily: 'Literata, "Noto Serif Devanagari", "Noto Naskh Arabic", serif'
      }}
    >
      <div style={{ display: 'flex', fontSize: fontSize * 2.6, lineHeight: 1, color: c.accent, height: fontSize * 1.4 }}>“</div>

      <div style={{ display: 'flex', flex: 1, alignItems: 'center' }}>
        <div style={{ display: 'flex', fontSize, lineHeight: 1.45, letterSpacing: '-0.01em' }}>{quote}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', borderTop: `2px solid ${c.rule}`, paddingTop: format === 'wide' ? 24 : 40 }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            width={coverW}
            height={Math.round(coverW * 1.5)}
            style={{ objectFit: 'cover', borderRadius: 4, marginRight: 28 }}
            alt=""
          />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, fontFamily: '"Instrument Sans", sans-serif' }}>
          <div style={{ display: 'flex', fontSize: titleSize, fontWeight: 600, color: c.ink }}>
            {title.length > 80 ? `${title.slice(0, 80)}…` : title}
          </div>
          {author && (
            <div style={{ display: 'flex', fontSize: authorSize, color: c.muted, marginTop: 6 }}>{author}</div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: '"Instrument Sans", sans-serif',
            fontSize: markSize,
            letterSpacing: '0.2em',
            color: c.muted,
            marginLeft: 24
          }}
        >
          KINDLE CLIPPER
        </div>
      </div>
    </div>
  );
}
