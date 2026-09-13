# Search verification

## Purpose

This is the maintainer-owned verification process for Keep These' static search
surface. It checks discovery without adding analytics, cookies, accounts, or
visitor-level measurement.

## Automated build verification

`npm run build` generates `sitemap.xml` from the same validated passage and
journey collections as the public routes. It then runs
`scripts/verify-search-output.mjs` against `dist` and fails when:

- an indexable route has missing, duplicate, malformed, or non-production
  metadata;
- its canonical, Open Graph URL, or social metadata disagree;
- homepage `WebSite` or discovery-page `BreadcrumbList` data is absent or does
  not match the visible route;
- sitemap entries differ from the built indexable HTML pages or contain query
  strings or fragments;
- an indexable page is `noindex`, the 404 is not `noindex`, or `robots.txt`
  stops declaring the production sitemap.

The sitemap contains only the homepage, practice guide, about and privacy
pages, twenty passage pages, and three literary journeys. Error pages and
maker-state fragments are never entries.

## Deployment verification

After a production deployment, run:

```sh
npm run verify:search:production
```

The command first creates and verifies a fresh build, then records its Git
commit and verifies:

- HTTP 200, unique production canonicals, descriptions, complete Open Graph
  and Twitter metadata, and expected JSON-LD for every sitemap route;
- `robots.txt`, exact sitemap parity with the verified build, and XML content
  type;
- a real 404 response carrying `noindex`;
- the established social image response;
- HTTP and `www` resolution to `https://keepthese.com/`;
- query URLs canonicalising to the clean homepage; and
- real 404 and `noindex` behaviour for unknown, invalid-passage, and
  invalid-journey routes.

The browser suite separately observes document requests and proves that the
browser does not send a stateless poem fragment to the server.

Validate the homepage `WebSite` record and one passage or journey
`BreadcrumbList` with the current
[Schema.org validator](https://validator.schema.org/) when deploying a change
to structured data. Record tool errors, not optional recommendations or search
ranking promises.

## Search Console

Search Console is optional maintainer tooling and requires no Google Analytics
or client-side tracking. If the maintainer connects it:

1. verify the canonical-domain property using a DNS record;
2. submit `https://keepthese.com/sitemap.xml`;
3. inspect one URL from each route type after deployment;
4. record indexing coverage and exclusions after crawling; and
5. review impressions, clicks, click-through rate, pages, and queries as
   discovery evidence rather than as measures of creative value.

Do not add a browser analytics script, consent banner, advertising identifier,
or user-level event tracking for this process.

## Issue 68 implementation record

On 13 September 2026, the pre-deployment production check passed the canonical
home, guide, passage and journey responses; metadata presence; crawler access;
real 404 and `noindex`; social image; and HTTP and `www` canonical-host
behaviour. The strengthened check correctly failed because production still
had the pre-implementation one-URL sitemap and had not yet deployed the new
JSON-LD records.

The post-deployment command passed all 25 routes at
`2026-09-13T12:08:33.165Z` for merge commit `ed86331`. After the addition of
the about and privacy routes, it passed all 27 canonical routes at
`2026-09-13T13:00:03.443Z` for production commit `599646f`, with no failures
and a clean working tree.

The pre-commit local verification on the same date covered homepage, guide,
passage, and journey routes. Mobile Lighthouse returned 100 for accessibility
and best practices on all four routes. Its SEO score was 92 because the Astro
development toolbar injects a generic “Learn more” link; this is development
tooling rather than built site output. Unthrottled local performance traces
reported LCP of 82 ms, 21 ms, 36 ms, and 37 ms respectively, with CLS 0.00 on
every route. These are repeatable local regression observations, not field
performance measurements or production guarantees.

The Schema.org Markup Validator reported zero errors and zero warnings for the
homepage `WebSite` and representative journey `BreadcrumbList` records. The
build verifier additionally checks the same breadcrumb shape and visible name
across every passage and journey route.
