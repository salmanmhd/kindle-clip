# Kindle Clipper — Comprehensive Project & Architecture Context

> **Handoff Document for AI Agents & Developers**  
> **Last Updated:** October 6, 2026  
> **Repository:** `salmanmhd/kindle-clip`  
> **Current Working Branch:** `offline-support` (ahead of origin by 4 commits)  
> **Production URL:** [https://kindle-clip.vercel.app](https://kindle-clip.vercel.app)

---

## 1. Executive Summary & Product Overview

**Kindle Clipper** is an offline-first Progressive Web App (PWA) designed for Kindle readers. It allows users to import their Kindle highlights from `My Clippings.txt`, organize books and highlights, read them in an immersive editorial reader interface, search, toggle favorites, and receive automated daily highlight digest emails via Resend.

### Key Value Propositions
- **Zero Friction Import:** Drag-and-drop or upload `My Clippings.txt` directly.
- **Offline-First Reading:** Fully functional offline (in airplane mode on mobile/desktop) after first sync.
- **Editorial Design Aesthetics:** Calm typography (serif headers, soft tones, dark mode support via `next-themes`).
- **Spaced Repetition / Re-discovery:** Daily email digests featuring random past highlights.
- **Privacy Conscious:** Client-side data persistence with IndexedDB; private pages are blocked from search crawlers (`robots: noindex, nofollow`).

---

## 2. Technical Stack & Dependencies

| Area | Technology / Library | Version | Role / Notes |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `16.3.6` | React 19 server/client components |
| **Runtime / UI** | React / React DOM | `19.2.8` | Modern hooks, Suspense, client actions |
| **Bundler** | Webpack (`--webpack`) | Integrated | Required because `@serwist/next` needs webpack |
| **PWA & Service Worker** | `@serwist/next` & `serwist` | `^9.5.13` | Custom worker (`app/sw.ts` -> `public/sw.js`) |
| **Local Storage** | `idb` (IndexedDB wrapper) | `^8.0.3` | Client offline store `KindleClipperDB` (v2) |
| **Database** | MongoDB Atlas / Mongoose | `^9.10.4` | Server persistence (`Book`, `Highlight`, `User`) |
| **Authentication** | NextAuth.js v5 beta | `^5.0.0-beta.32` | Credentials provider, JWT session tokens |
| **Styling** | Tailwind CSS v4 | `^4.0.0` | Theme tokens, dark/light modes, animations |
| **Email Delivery** | Resend | `^6.32.0` | Transactional daily digests via Vercel Cron |
| **Icons** | Lucide React | `^1.52.0` | Editorial UI icons |
| **Unit Testing** | Vitest | `^5.0.3` | Logic & utility unit tests |
| **E2E Testing** | Playwright (`@playwright/test`) | `^1.63.0` | Offline PWA flow verification |

---

## 3. Architecture & Offline-First Implementation

### A. The Next.js 16 + Serwist Service Worker Setup
- **Config:** `next.config.ts` wraps NextConfig in `withSerwist({ swSrc: "app/sw.ts", swDest: "public/sw.js", register: false, disable: process.env.NODE_ENV === "development" })`.
- **Build Command:** `npm run build` runs `next build --webpack` because `@serwist/next` requires webpack on Next.js 16. *(Note: `@serwist/turbopack` exists in Serwist docs, but requires custom route handlers and `SerwistProvider`, so webpack was chosen for stability).*
- **Worker Registration:** Service worker registration is handled conditionally in `components/OfflineSync.tsx` **only when logged in**, preventing unauthenticated users or landing page visitors from inadvertently caching private shells.

### B. App Shell & Static Route Refactor (Crucial Offline Fix)
- **Problem Solved:** Dynamic routes like `/books/[id]` and `/books/[id]/read` require Next.js RSC payload requests on navigation. When the phone/browser is offline, RSC requests to dynamic route patterns fail with a network error.
- **Solution Implemented:**
  - Migrated dynamic paths to query-param static routes:
    - `/book?id=<bookId>` (implemented in `app/(app)/book/page.tsx`)
    - `/read?book=<bookId>&highlight=<highlightId>` (implemented in `app/(app)/read/page.tsx`)
  - Redirects configured in `next.config.ts`:
    - `/books/:id` -> `/book?id=:id`
    - `/books/:id/read` -> `/read?book=:id`
  - All query-param consumers are wrapped inside React `<Suspense>` boundaries.

### C. IndexedDB Storage Architecture (`lib/indexeddb.ts`)
Database name: **`KindleClipperDB`** (Version 2)
1. **`books` store:**
   - Key: `_id` (string)
   - Indexes: `by-userId`, `by-syncedAt`
2. **`highlights` store:**
   - Key: `_id` (string)
   - Indexes: `by-userId`, `by-bookId`, `by-favorite`
3. **`syncQueue` store:**
   - Key: `_id` (UUID generated on client)
   - Value: `{ _id, action: 'favorite' | 'delete' | 'edit_note', payload, timestamp }`

### D. Sync Engine & Storage Persistence (`components/OfflineSync.tsx`)
- **Two-way Sync:**
  1. Reads pending actions from `syncQueue`, compresses redundant actions (e.g., toggling a favorite star back and forth), and sends requests to the server (`/api/highlights/[id]/star`). Successfully synced actions are deleted from `syncQueue`.
  2. Calls `/api/sync?since=<lastSyncDate>` to fetch newly updated or deleted records.
  3. Writes delta updates into `books` and `highlights` object stores.
  4. Triggers `window.dispatchEvent(new Event('sync-completed'))` to refresh reactive hooks.
- **Eviction Prevention (PWA-003):** Calls `navigator.storage.persist()` after successful sync.
- **First-Sync Skeleton (Empty State Protection):** Tracks `lastSyncDate` in `localStorage`. If the user has never synced yet, pages display skeleton loaders rather than misleading "No highlights found" empty states.
- **Offline Fallback Route:** Dedicated `app/~offline/page.tsx` registered as fallback in Serwist for un-cached endpoints.
- **Offline Data Export:** `components/ExportAllOfflineButton.tsx` in `/settings` generates a markdown export directly from IndexedDB without requiring server connectivity.
- **Logout Cleansing:** `components/LogoutButton.tsx` drops `KindleClipperDB`, flushes Service Worker caches (`caches.delete()`), removes `localStorage` items, and signs out.

---

## 4. Public Pages, SEO & Robots Configuration

- **Landing Page (`app/page.tsx`):** High-converting, calm editorial landing page for logged-out visitors with clear H1, value proposition, 3-step workflow, and signup CTA.
- **Guide Pages (`app/guides/[slug]/page.tsx`):**
  - `/guides/how-to-find-my-clippings-on-kindle`
  - `/guides/how-to-read-kindle-highlights-on-phone`
  - `/guides/how-to-export-kindle-highlights`
- **Privacy Policy (`app/privacy/page.tsx`):** Public privacy page detailing local-first data principles.
- **SEO & Structured Data:**
  - `app/sitemap.ts`: Generates dynamic sitemap for public routes.
  - `app/robots.ts`: Allows `/`, `/guides`, `/privacy`; explicitly disallows `/library`, `/book`, `/read`, `/favourites`, `/search`, `/settings`, `/upload`, `/api`.
  - `app/opengraph-image.tsx`: Dynamic branded OG preview card.
  - JSON-LD WebApplication schema embedded in public pages.
  - Authenticated layout (`app/(app)/layout.tsx`) sets `robots: { index: false, follow: false }`.

---

## 5. File System & Directory Map

```text
kindle-clipper/
├── app/
│   ├── (app)/                  # Authenticated application shell routes
│   │   ├── book/               # Static route: /book?id=...
│   │   ├── favourites/         # Starred highlights screen
│   │   ├── layout.tsx          # App shell (desktop sidebar + mobile bottom nav + theme toggle)
│   │   ├── library/            # Main dashboard / book catalog
│   │   ├── read/               # Immersive Kindle-style highlight reader
│   │   ├── search/             # Client-side IndexedDB highlight search
│   │   ├── settings/           # User preferences, email digest config, export, logout
│   │   └── upload/             # File upload for My Clippings.txt
│   ├── (auth)/                 # Auth routes (login, register)
│   ├── api/                    # Server API routes
│   │   ├── auth/               # NextAuth API
│   │   ├── cron/daily-digest/  # Vercel Cron trigger for daily email
│   │   ├── export/             # Server-side export
│   │   ├── highlights/         # Star / note update APIs
│   │   ├── sync/               # Delta sync endpoint (?since=...)
│   │   ├── unsubscribe/        # One-click email unsubscribe
│   │   └── upload/             # Server parsing of My Clippings.txt
│   ├── guides/                 # Public MDX/content guides
│   ├── privacy/                # Public privacy policy
│   ├── ~offline/               # Serwist offline fallback page
│   ├── globals.css             # Tailwind v4 theme styling & animations
│   ├── layout.tsx              # Root HTML layout with providers (Theme, NextAuth)
│   ├── page.tsx                # Public landing page
│   ├── robots.ts               # Robots.txt handler
│   ├── sitemap.ts              # XML Sitemap generator
│   └── sw.ts                   # Serwist service worker definition
├── components/                 # Reusable UI & client components
│   ├── DashboardRandomHighlight.tsx
│   ├── ExportAllOfflineButton.tsx
│   ├── HighlightList.tsx
│   ├── LogoutButton.tsx
│   ├── OfflineSync.tsx         # SW registration & two-way sync loop
│   ├── Reader.tsx              # Touch/swipe enabled highlight reader
│   ├── TestEmailButton.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── db.ts                   # MongoDB Mongoose connection handler
│   ├── email.ts                # Resend client & daily digest email templates
│   ├── indexeddb.ts            # IndexedDB openDB, stores, schemas, useIDBQuery hook
│   └── models/                 # Mongoose schemas: User, Book, Highlight
├── tests/
│   └── offline.spec.ts         # Playwright offline verification tests
├── next.config.ts              # Next.js config + Serwist wrapper + redirects
├── AUDIT.md                    # Detailed offline PWA findings (PWA-001 to PWA-005)
├── playwright.config.ts        # Playwright test config
├── package.json
└── tsconfig.json
```

---

## 6. Environment Variables Reference

Create a `.env.local` (or configure in Vercel) based on `.env.example`:

```bash
# MongoDB Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# NextAuth v5 Secret
AUTH_SECRET=your_32_byte_base64_secret_key

# Public App URL (used for canonical URLs, sitemaps, emails)
NEXT_PUBLIC_APP_URL=https://kindle-clip.vercel.app

# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
# Free tier note: use onboarding@resend.dev until custom domain is DNS-verified
MAIL_FROM=onboarding@resend.dev

# Vercel Cron Secret (protects /api/cron/daily-digest)
CRON_SECRET=your_cron_authorization_token
```

---

## 7. Current Progress & Git History

### Branch: `offline-support`
All offline PWA tickets (PWA-001 through PWA-005) were developed and committed sequentially on branch `offline-support`:

1. `a1e1aca`: `audit, seo` — initial audit documentation and public SEO setup.
2. `a195e74`: `static logic` — initial migration towards static queries.
3. `d77e76f`: `refactor: use static routes for books and read` — converted dynamic `[id]` paths to `/book?id=...` and `/read?book=...` with `<Suspense>`, updated navigation links, and added redirects in `next.config.ts`.
4. `921b34d`: `feat: first-sync skeleton loading state` — introduced `lastSyncDate` check in `useIDBQuery` to prevent false empty states prior to initial sync.
5. `8030b27`: `fix: register SW only when logged in and handle 401 on sync` — Service Worker registration scoped to authenticated sessions.
6. `8c6a883`: `feat: export fallback in settings` — Added client-side offline markdown export button.

### Pending Git Changes
- Modified: `package.json`, `package-lock.json` (added `@playwright/test`).
- Untracked: `playwright.config.ts`, `tests/offline.spec.ts`.

---

## 8. Current Issues, Parked Work & Next Actions

1. **Playwright Offline E2E Tests (`tests/offline.spec.ts`):**
   - The test structure is scaffolded to verify login, initial sync, offline reload, book reading, favoriting, and reconnect.
   - *Current status:* Playwright test needs seeded mock auth credentials / mock session cookie because NextAuth with MongoDB requires an active test database in automated CI.
2. **Resend Email Domain:**
   - Production is deployed on Vercel (`https://kindle-clip.vercel.app`).
   - On the Resend free tier, sending emails to arbitrary recipient addresses requires verifying the custom domain in Resend's DNS dashboard. Currently default sender falls back to `onboarding@resend.dev` (which only delivers to the account owner's email).
3. **Merging `offline-support` to `main`:**
   - Once offline behavior is visually validated on physical devices or local production builds, merge `offline-support` into `main` and trigger the Vercel production deployment.

---

## 9. Useful Developer Commands

```bash
# Run local development server
npm run dev

# Run production build (must use webpack for Serwist)
npm run build

# Start production server locally (test sw.js & offline behavior)
npm start

# Run unit tests
npm test

# Check TypeScript types
npm run typecheck

# Format code with Prettier
npm run format

# Run Playwright offline tests (against production build)
npx playwright test
```

### Verified Production Route Table (`npm run build`)
```text
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /~offline
├ ƒ /api/auth/[...nextauth]
├ ƒ /api/cron/daily
├ ƒ /api/export/[bookId]
├ ƒ /api/health
├ ƒ /api/highlights/[id]
├ ƒ /api/highlights/[id]/note
├ ƒ /api/highlights/[id]/star
├ ƒ /api/highlights/[id]/undelete
├ ƒ /api/sync
├ ƒ /api/unsubscribe
├ ƒ /api/upload
├ ○ /book
├ ○ /favourites
├ ○ /guides
├   /guides/[slug]
│ ├ ● /guides/how-to-find-my-clippings-txt
│ ├ ● /guides/how-to-read-kindle-highlights-on-phone
│ └ ● /guides/how-to-export-kindle-highlights
├ ○ /icon.jpg
├ ○ /library
├ ○ /login
├ ○ /opengraph-image
├ ○ /privacy
├ ○ /read
├ ○ /robots.txt
├ ○ /search
├ ƒ /settings
├ ○ /signup
├ ○ /sitemap.xml
└ ○ /upload

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

