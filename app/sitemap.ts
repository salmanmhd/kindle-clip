import { MetadataRoute } from 'next';
import { getAllGuides } from '@/lib/guides';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://kindle-clip.vercel.app').replace(/\/$/, '');

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date('2026-10-04'),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: new Date('2026-10-04'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-10-04'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  const guideRoutes: MetadataRoute.Sitemap = getAllGuides().map((guide) => ({
    url: `${baseUrl}/guides/${guide.slug}`,
    lastModified: new Date(guide.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...guideRoutes];
}
