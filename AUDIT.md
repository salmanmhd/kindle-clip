# Offline Support Audit (Kindle Clipper)

## 1. Serwist Configuration
- **ID:** PWA-001
- **Severity:** High
- **Location:** `next.config.ts` and missing `app/sw.ts`
- **Issue:** The project relies on the deprecated `next-pwa` plugin instead of `serwist`. Even though `@serwist/next` and `serwist` are in `package.json`, they are entirely unused. There is no custom service worker file handling precaching, route caching, or offline fallbacks.
- **Verification:** Read `next.config.ts` and searched the project for `serwist`. No active configurations found.
- **Fix:** Replace `next-pwa` with `@serwist/next` in `next.config.ts`. Create `app/sw.ts` using `serwist` to define precise caching rules and offline fallbacks, and remove `next-pwa`. *(Note: `@serwist/turbopack` exists for native Turbopack support, but we stayed with `@serwist/next` and `--webpack` to avoid introducing the custom route handler and `SerwistProvider` setup overhead for now).*

## 2. Server-Side Rendering (SSR) Dependency for Authenticated Routes
- **ID:** PWA-002
- **Severity:** Critical
- **Location:** `app/(app)/library/page.tsx`, `app/(app)/books/[id]/read/page.tsx`
- **Issue:** Authenticated routes are currently Server Components that directly query MongoDB. This violates the offline-first requirement, as these pages will fail to load when offline because they rely on server-rendered HTML for each user. They are not using the "App Shell" pattern.
- **Verification:** Read `app/(app)/library/page.tsx`. It calls `await dbConnect()` and queries `Book.find()` directly. This prevents caching the HTML shell in the service worker and reading from IndexedDB on initial load.
- **Fix:** Convert authenticated pages into Client Components that render a cached UI shell immediately, pull data from IndexedDB via `dexie-react-hooks`, and trigger background network syncs. Create an offline fallback for missing data.

## 3. Storage Persistence Not Enabled
- **ID:** PWA-003
- **Severity:** Medium
- **Location:** Sync logic / indexeddb layer
- **Issue:** `navigator.storage.persist()` is not being invoked to request persistent storage for IndexedDB after a successful sync, meaning data could be evicted by the browser under storage pressure.
- **Verification:** Searched the codebase for `persist()`. None exists.
- **Fix:** Call `navigator.storage.persist()` in the client-side sync logic upon successful sync completion.

## 4. Missing Offline Fallback Page
- **ID:** PWA-004
- **Severity:** Medium
- **Location:** App Routes
- **Issue:** There is no dedicated offline fallback route/page configured for routes that inherently require network access (like mutations, uploads, etc.) and aren't cached.
- **Verification:** Examined the directory structure in `app`. No `~offline` or offline fallback page exists.
- **Fix:** Create `app/~offline/page.tsx` and register it in the `sw.ts` `serwist` fallback configuration.

## 5. Potential "Logged Out" Errors on Network Failure
- **ID:** PWA-005
- **Severity:** High
- **Location:** Sync handlers & auth checks
- **Issue:** Fetch requests in the application may throw or return errors when offline, potentially triggering an unauthenticated state (redirect to login) rather than relying on local session data.
- **Verification:** Based on the architecture and lack of robust offline-first caching for the `session` endpoint, network failures during authentication checks can erroneously reset the user's logged-in state.
- **Fix:** Ensure API request failures fall back to local `IndexedDB` or cached session state and display "needs a connection" rather than logging the user out.
