import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const applyPreviewRobots = (res: NextResponse) => {
    if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
      res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
    return res;
  };

  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
  const isPublicRoute = 
    nextUrl.pathname === '/' ||
    nextUrl.pathname === '/privacy' ||
    nextUrl.pathname.startsWith('/guides') ||
    nextUrl.pathname === '/login' || 
    nextUrl.pathname === '/signup' || 
    nextUrl.pathname.startsWith('/api/cron/') ||
    nextUrl.pathname.startsWith('/api/unsubscribe') ||
    nextUrl.pathname === '/robots.txt' ||
    nextUrl.pathname === '/sitemap.xml' ||
    nextUrl.pathname === '/opengraph-image' ||
    nextUrl.pathname === '/icon.jpg' ||
    nextUrl.pathname === '/manifest.json';

  if (isApiAuthRoute) {
    return applyPreviewRobots(NextResponse.next());
  }

  if (isPublicRoute) {
    if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/signup')) {
      return applyPreviewRobots(NextResponse.redirect(new URL('/library', nextUrl)));
    }
    return applyPreviewRobots(NextResponse.next());
  }

  if (!isLoggedIn) {
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }
    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return applyPreviewRobots(NextResponse.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, nextUrl)));
  }

  return applyPreviewRobots(NextResponse.next());
});

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
