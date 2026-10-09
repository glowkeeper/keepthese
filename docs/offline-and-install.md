# Offline use and installing

## Decision

On 9 October 2026 the maintainer decided that Keep These becomes installable and
usable offline (issue 15, under parent issue 4), using a small hand-written
service worker with no new dependency. Updates wait quietly and offer an
optional "Update now". Installing is a quiet footer button, never a prompt. The
site stays a static Astro build with no server, account, or database.

## What is cached

After a visit, the service worker holds a copy of every file the build
produced that the application needs: all pages, scripts, styles, images,
textures, passage and journey pages, the not-found page, the manifest, and the
icons. The list is generated from the finished build by
`scripts/build-service-worker.mjs`, so it cannot drift from the site. It leaves
out `_headers`, `robots.txt`, the sitemap, Markdown notices, and the worker
itself. The first visit downloads roughly 2.5 MB in the background.

Previously available passages and the making surface therefore work offline,
including choosing words, undo, the daily passage (which is worked out in the
browser), journeys, and PNG export.

## What is never cached

- **Other origins.** The worker ignores every request that is not to
  keepthese.com, so the Cloudflare analytics beacon and links to source
  editions are never stored or altered.
- **Poems and settings.** Unfinished work lives in the browser's local storage,
  which the worker never reads or writes. The cache holds the public site and
  nothing made by a visitor.
- **Anything that is not a GET request**, and `/cdn-cgi/` addresses.

## How requests are answered

A cached file is served first, because every cached file is versioned together.
Anything not cached goes to the network. If a page that is not cached is opened
while offline, the visitor gets Keep These's own not-found page with a 404
status, not the browser's error page. Without a server there is no redirect, so
an address with no trailing slash, such as `/about`, is matched to `/about/`.
Poem links carry the poem after the `#`, which is never sent, so they work
offline too.

## Updates

Each build gets a cache name made from a hash of its files and of the worker's
own code (`keepthese-<hash>`). `sw.js` and the manifest are served with
`Cache-Control: no-cache`, so browsers check for a new version whenever Keep
These is opened.

1. A new version downloads beside the running one. If any file cannot be
   fetched, the install fails as a whole, the half-built cache is deleted, and
   the working version carries on.
2. A complete download **waits**. It never takes over a page by itself and never
   reloads anything.
3. The footer says an update is ready, that it applies the next time Keep These
   is opened, and that saved work is kept. "Update now" is optional: it lets the
   new version take over and reloads only the tab where it was chosen. Other open
   tabs keep their current page until they are closed or reloaded.
4. When a new version takes over, older caches are deleted.

Unfinished poems survive an update because they are in local storage, which an
update never touches. After "Update now" the existing recovery notice shows that
the saved work was restored. A browser can still clear site data on its own, as
it can without a service worker; see the limitations.

## Installing

`manifest.webmanifest` names the app, sets the colours, and points to a 192 and
a 512 pixel icon (`icon-192.png` is a reduction of
`brand/keep-these-square.png`).
There is no pop-up, banner, or automatic prompt.

- Where the browser offers installing (Chrome, Edge, and other Chromium
  browsers), an "Install Keep These" button appears quietly in the footer. It is
  hidden inside the installed app and once the app is installed.
- Elsewhere the How-to page explains the browser's own route, such as Share then
  Add to Home Screen on iPhone and iPad.

## States and accessibility

The footer shows one plain sentence at a time: ready to use offline, offline, or
an update is ready. That sentence is not a live region, so moving between pages
does not repeat it. A separate visually hidden live region announces only
changes: going offline or back online, an update becoming ready, an update being
applied, and the app being installed. Nothing is said about being offline or back
online until a worker has installed and activated, because only then is the
claim that Keep These still works true. The buttons are ordinary buttons with
text labels and the site's existing focus styles. Nothing depends on colour or
motion.

## Limitations

- A page must be visited once, online, before it can be used offline. The
  worker starts controlling pages from the next load, so a tab that was open
  during the very first visit is not offline-ready until it is reloaded.
- Browsers may clear site data, including both the cache and saved work, after a
  long period without a visit or when storage is scarce. Safari is stricter than
  most. The installed app is treated more generously than a website tab.
- The analytics beacon cannot send while offline, so offline visits are not
  counted. This changes nothing else.
- Following a source-edition link needs a connection.
- The worker exists only in the production build. `npm run dev` has none, so
  development never serves stale files.
- A browser that does not support service workers keeps working as an ordinary
  website, and the footer says nothing about offline use.

## Retiring or rolling back

A Cloudflare rollback serves an older `sw.js`, which browsers treat as an update
and install the same way. To switch the worker off completely, deploy a
`sw.js` that deletes every cache starting `keepthese-` and calls
`registration.unregister()`, and remove its registration from the layout in a
later change.

## Verification

- Unit tests cover the build helpers (`scripts/service-worker-build.test.mjs`)
  and the footer behaviour (`src/lib/offline-install.test.ts`).
- Browser tests against a production build (`browser-tests/*.offline.spec.ts`,
  run by `npm run test:browser`) exercise first and repeat visits, offline
  pages and making, update waiting and applying with saved work restored, an
  interrupted update, the install button, and the manifest.
- Real installation on Android Chrome, iPhone and iPad Safari, and desktop
  browsers, and behaviour on the production deployment, are manual checks
  recorded on the pull request.
