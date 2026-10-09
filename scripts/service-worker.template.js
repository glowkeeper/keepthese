/*
 * Keep These service worker.
 *
 * scripts/build-service-worker.mjs copies this file to dist/sw.js after the
 * Astro build, replacing the two marked values below with the files the build
 * produced and a version derived from their contents. See
 * docs/offline-and-install.md for the caching boundaries.
 *
 * The worker only ever stores the site's own static files. It never handles
 * another origin (so the analytics beacon and source-edition links are never
 * cached), never touches browser storage where unfinished poems live, and
 * never reloads a page or takes over a running one by itself.
 */

const CACHE_VERSION = /* CACHE_VERSION */ 'development';
const PRECACHE_URLS = /* PRECACHE_URLS */ [];

const CACHE_PREFIX = 'keepthese-';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const NOT_FOUND_URL = '/404.html';

self.addEventListener('install', (event) => {
  // The new version installs beside the running one and then waits. It only
  // takes over once every Keep These tab is closed, or when the maker chooses
  // "Update now", so an update can never interrupt a poem in progress.
  //
  // If any file cannot be fetched the install fails as a whole, the half-built
  // cache is removed, and the version already running carries on untouched.
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(
          PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })),
        ),
      )
      .catch(async (error) => {
        await caches.delete(CACHE_NAME);
        throw error;
      }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
            )
            .map((name) => caches.delete(name)),
        ),
      ),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === '/sw.js' || url.pathname.startsWith('/cdn-cgi/')) return;

  event.respondWith(respond(request, url));
});

async function respond(request, url) {
  const cache = await caches.open(CACHE_NAME);
  // Poem links carry their poem after the "#", which is never sent, and any
  // query string does not change a static file.
  const cached =
    (await cache.match(url.pathname)) ||
    (await cache.match(withTrailingSlash(url.pathname)));
  if (cached) return cached;

  try {
    return await fetch(request);
  } catch (error) {
    if (request.mode === 'navigate') {
      const notFound = await cache.match(NOT_FOUND_URL);
      if (notFound) {
        return new Response(notFound.body, {
          headers: notFound.headers,
          status: 404,
        });
      }
    }
    throw error;
  }
}

// Cloudflare Pages redirects "/explore" to "/explore/"; offline there is no
// server to do that, so a page address without a file extension gets its slash.
function withTrailingSlash(pathname) {
  return pathname.endsWith('/') || /\.[a-z0-9]+$/iu.test(pathname)
    ? pathname
    : pathname + '/';
}
