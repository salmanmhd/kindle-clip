import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development", // Don't cache in dev
  register: false,
});

const nextConfig: NextConfig = {
  turbopack: {}, // Ignored by webpack build but useful if using `next dev --turbo`
  async redirects() {
    return [
      {
        source: '/books/:id/read',
        destination: '/read?book=:id',
        permanent: true,
      },
      {
        source: '/books/:id',
        destination: '/book?id=:id',
        permanent: true,
      }
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
