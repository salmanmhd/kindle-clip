import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, CacheableResponsePlugin, ExpirationPlugin, Serwist } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Book covers are immutable per URL: cache-first so the library has covers offline.
    // Listed before defaultCache, whose generic cross-origin rule would otherwise match first.
    {
      matcher: ({ url }) =>
        url.hostname === "covers.openlibrary.org" || url.hostname === "books.google.com" || url.hostname.endsWith(".googleusercontent.com"),
      handler: new CacheFirst({
        cacheName: "book-covers",
        plugins: [
          // Status 0 = opaque response from a no-cors <img> request
          new CacheableResponsePlugin({ statuses: [0, 200] }),
          new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 365, purgeOnQuotaError: true }),
        ],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
