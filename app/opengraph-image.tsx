import { ImageResponse } from 'next/og';

export const alt = 'Kindle Clipper - Read & Rediscover Your Kindle Highlights';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          backgroundColor: '#FBF9F4',
          padding: '80px',
          fontFamily: 'serif',
          border: '14px solid #EBE4D5',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: '#1C1B19',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FBF9F4',
              fontSize: '22px',
              marginRight: '16px',
            }}
          >
            📖
          </div>
          <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1C1B19', letterSpacing: '-0.02em' }}>
            Kindle Clipper
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: '56px',
              fontWeight: 600,
              color: '#1C1B19',
              lineHeight: 1.15,
              marginBottom: '20px',
              letterSpacing: '-0.03em',
            }}
          >
            Your Kindle highlights, organized and readable anywhere.
          </div>
          <div style={{ fontSize: '24px', color: '#6E6A60', fontFamily: 'sans-serif' }}>
            Offline-first &bull; Markdown export &bull; Complete privacy
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            borderTop: '1px solid #E2D9C8',
            paddingTop: '24px',
            fontFamily: 'sans-serif',
            fontSize: '18px',
            color: '#8A857B',
          }}
        >
          <span>kindle-clip.vercel.app</span>
          <span>Turn My Clippings.txt into your personal library</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
