import type { NextConfig } from "next"

// @ts-ignore - next-pwa doesn't have accurate types for Next.js 14+
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // don't cache in dev
});

const nextConfig: NextConfig = {}

export default withPWA(nextConfig);
