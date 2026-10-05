import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://kindle-clip.vercel.app').replace(/\/$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/privacy', '/guides', '/guides/'],
        disallow: [
          '/api/',
          '/library',
          '/library/',
          '/books/',
          '/favourites',
          '/favourites/',
          '/search',
          '/search/',
          '/upload',
          '/upload/',
          '/settings',
          '/settings/',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
