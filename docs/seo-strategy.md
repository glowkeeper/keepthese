# Search discovery strategy

## Status

This document records the baseline and editorial search decisions agreed through
issue #66. It guides the crawlable entry-point work in issue #67 and the
technical search work in issue #68. It does not commit a continuing publishing
programme or change the product stage.

Baseline date: **13 September 2026**.

## Desired outcome

Someone looking for a human-made blackout-poetry practice, or for a creative
encounter with one of the works on the verified shelf, should be able to find a
useful Keep These page and move naturally into making.

Search discovery is a route into the product, not a reason to turn the product
into a catalogue or content publication. The useful unit is an editorially
chosen encounter: a particular source page, a finite literary journey, or a
short explanation of the practice.

## Evidence and limits

### Production and built-output audit

The following checks were run against `https://keepthese.com` and a clean local
production build on 13 September 2026.

| Area | Evidence | Finding |
| --- | --- | --- |
| Public routes | Astro build output and production requests | The build emits `/` and `/404.html`; only `/` is indexable. |
| Crawl access | Production `robots.txt` | All crawlers are allowed and the production sitemap is declared. |
| Sitemap | Production and repository `sitemap.xml` | The sitemap is valid XML but contains only `https://keepthese.com/`. |
| Homepage metadata | Production response and built HTML | One description, absolute self-canonical, Open Graph fields, Twitter card fields, and a 1200 × 630 social image are present. The title is only `Keep These`. |
| Error handling | Built `404.html` | The error page has `noindex` and a route back to the studio. |
| Structured data | Production and built HTML | No JSON-LD, microdata, or RDFa is present. |
| Server-rendered content | Built HTML and JavaScript-disabled inspection | The initial Frankenstein context, passage, controls, source credit, privacy copy, and attribution are present before hydration. The other passages and journeys are serialized for the island but do not have their own documents. |
| Canonical variants | Source and production inspection | The homepage has one HTML canonical. Stateless poem state lives in a fragment, which is not sent in the HTTP request and does not create another document. |
| Response health | Production requests | The homepage, robots file, and sitemap returned HTTP 200 from the canonical host. All nine resources observed during the audited page load returned 200. |
| Static architecture | Build log | Astro emitted static output with no server route, backend, or remote content dependency. |

The local homepage output was 73.1 kB uncompressed and approximately 17.1 kB
with gzip. Its extracted JavaScript was approximately 221.6 kB uncompressed and
69.5 kB with gzip; CSS was 14.5 kB uncompressed and 3.6 kB with gzip. These are
build artefact sizes, not field transfer measurements.

### Search and performance baseline

Sampled web searches for `site:keepthese.com`, `keepthese blackout poetry`, and
`online blackout poetry maker classic literature` did not surface Keep These in
the returned results. Generic results were led by established blackout-poetry
makers, generators, educational resources, and explanatory pages. This is a
small, location- and provider-dependent observation. It is not evidence that no
Keep These URL is indexed and it is not a substitute for Search Console.

A cold production trace in desktop Chrome, without CPU or network throttling,
recorded:

| Signal | Observed value | Interpretation |
| --- | ---: | --- |
| Largest Contentful Paint | 364 ms | Healthy laboratory result |
| Time to First Byte | 94 ms | Healthy laboratory result |
| Cumulative Layout Shift | 0.00 | No observed layout shift |
| Render-blocking estimated saving | 0 ms | Not an optimisation target |
| CrUX field data | Not available | No real-user conclusion can be drawn |

A separate mobile Lighthouse navigation audit scored 100 for SEO,
accessibility, best practices, and agentic browsing. Lighthouse's performance
category was not part of that run. These laboratory results are a dated
diagnostic, not a promise of ranking or real-user performance.

No Search Console property or report was available to this audit. Impressions,
clicks, indexed-page counts, query positions, and manual URL-inspection results
therefore remain unknown. Issue #68 should establish maintainer-owned Search
Console verification if the maintainer wishes to use it; no visitor analytics
is required.

## Search intent map

Priority follows fit with the present product, not estimated search volume.

| Priority | Search need | Keep These answer | Intended entry point |
| --- | --- | --- | --- |
| Primary | Make a blackout poem online by choosing the words myself | A private, tactile studio with undo, local autosave, attributed PNG export, and no automatic composition | Homepage and short practice guide |
| Primary | Make blackout or erasure poetry from a particular classic work | One verified passage with original context, visible attribution, and a direct path into making | Passage page |
| Primary | Understand what blackout poetry is and how to begin without a blank page | A concise explanation centred on noticing and choosing, followed by a real page | Practice guide |
| Secondary | Explore classic literature through a theme or creative prompt | A finite, editorially ordered five-page journey | Journey page |
| Secondary | Find a calm or private poetry-making tool | The existing privacy and authorship boundaries, stated plainly | Homepage and practice guide |
| Supporting | Read the source and provenance behind a selected passage | Work, author, publication context, passage location, acknowledgement, and source route | Passage page |

“Generator” may occur only when plainly contrasting Keep These with automatic
composition; it is not a target description. The product helps the maker find
a poem but never chooses words for them.

## Indexable route decision

### Include now

| Route type | Pattern | Distinct visitor purpose | Required visible material |
| --- | --- | --- | --- |
| Product home | `/` | Understand the whole instrument and begin immediately | Product promise, shelf and journey orientation, initial studio, privacy, attribution |
| Practice guide | `/blackout-poetry/` | Learn what the form is, how this human-made practice works, and then try it | Concise original explanation, steps that match the interface, authorship and source relationship, route into a real passage |
| Passage | `/passages/{passageId}/` | Meet and make from one specific verified literary page | Original curation context, work, author, first-publication year, passage location, motifs used sparingly, source acknowledgement and route, relevant studio entry |
| Journey | `/journeys/{journeyId}/` | Understand and begin one finite thematic sequence | Original title and invitation, ordered member pages with work and author, clear five-page boundary, route to begin |

The passage is the canonical literary entity for this stage. There are twenty
passage pages and three journey pages. All must be emitted as static Astro pages
from validated repository data.

The route may mount the relevant interactive experience or link into it. The
implementation of issue #67 should preserve a clear canonical URL,
passage-specific autosave, received-poem isolation, and the existing studio
experience. URL fragments remain maker state, not indexable variants.

### Exclude for now

| Route type | Decision and reason |
| --- | --- |
| Author pages | Do not create them while each author has only one passage. They would mostly repeat the passage page and imply a catalogue depth the product does not have. Reconsider when an author has multiple independently contextualised encounters. |
| Work or book pages | Do not create a separate page while each work has only one passage. The passage page can carry the complete work context without a second near-duplicate URL. Reconsider when a work has multiple passages or distinct work-level editorial material. |
| Motif or tag pages | Do not index programmatic motif combinations. Current motifs support editorial understanding, not a public taxonomy. |
| General passage index | Keep the restrained shelf on the homepage rather than adding a catalogue route. Reconsider only if twenty visible choices cannot remain understandable there. |
| Individual poem links | Never index maker-state fragments. Keep These does not host a separate poem document, and fragment content is not sent to the server. |
| Search-result or filtered pages | No site search or filter routes are justified by a finite twenty-page shelf. |
| Automatically generated guides | Do not create templated “how to make blackout poetry from X” pages. A single honest guide and specific passage encounters cover the present need. |

## Page rules

### Purpose and distinctness

- Each indexable page must answer one visitor need in server-rendered HTML before
  hydration.
- A route needs original page-specific context, not only substituted names in a
  shared template. If the content cannot meet that test, consolidate it into its
  parent page or keep it non-indexed.
- Source text alone does not make a page editorially distinct. Context,
  provenance, and the invitation to make must remain connected.
- Search phrasing must read naturally and retain the charter's warm, restrained
  tone. Do not put an explanatory block ahead of the homepage's creative
  opening.

### Titles and descriptions

- Use one unique, descriptive `<title>` and one unique meta description per
  canonical page, present in the initial HTML.
- Title patterns are implementation constraints, not fixed copy:
  - home: `Keep These — a quiet blackout poetry studio`;
  - guide: `How to make blackout poetry — Keep These`;
  - passage: `Make blackout poetry from {short work title} — Keep These`;
  - journey: `{journey title}: a blackout poetry journey — Keep These`.
- Keep the distinctive subject near the beginning. Shorten bibliographic titles
  only through an explicit public display title; never silently alter the
  authoritative work title.
- Descriptions should state the page-specific invitation and material, usually
  in one or two sentences. Do not copy the same generic description across the
  collection or promise generated poems.
- The visible heading may be more literary than the title, but must describe the
  same page purpose.

### Canonical and indexing

- Emit one absolute, self-referential HTML canonical for every indexable route
  on `https://keepthese.com`.
- Use the same canonical URLs in internal links and the sitemap.
- Keep `404` responses non-indexable. Invalid passage and journey paths must
  resolve as real not-found responses rather than soft 404 pages.
- Do not vary canonical or robots metadata in client code.
- Query parameters and URL fragments must not create additional indexable
  documents. A stateless poem fragment inherits the underlying document's
  canonical but is never placed in metadata, internal discovery links, or the
  sitemap.

### Internal links

- The homepage links to the guide, every passage, and each journey through
  restrained shelf and journey controls that remain discoverable without
  JavaScript.
- The guide links to the homepage and a small, editorially chosen starting
  passage rather than duplicating the whole shelf.
- Each passage links to home, its source edition, and any journey containing it.
  Related passages should only be linked through an explicit editorial
  relationship, not an automatic motif cloud.
- Each journey links to home and its five member passages in editorial order.
- Link text names the destination; avoid repeated “learn more” or “click here”
  labels.

### Structured data

Issue #68 should first add restrained `WebSite` data to the homepage and
`BreadcrumbList` where the visible hierarchy supports it. Any `WebPage` or
`CreativeWork` representation must describe Keep These's visible editorial
page, not claim authorship or publication of the underlying literary work.

Do not add `Article`, `Book`, `HowTo`, ratings, or other rich-result types merely
because a schema exists. A schema type requires visible supporting content and
must pass both automated shape checks and current external validation.
Structured data is descriptive evidence, not a ranking promise.

## Measurement after implementation

Issue #68 should repeat the dated build, response, metadata, crawler-visible
HTML, Lighthouse, accessibility, and performance checks from this baseline for
representative home, guide, passage, and journey routes. It should verify that
the generated sitemap exactly matches the intended canonical route set.

If the maintainer connects Search Console, use it without Google Analytics to:

1. submit the canonical sitemap;
2. inspect one representative URL of each route type;
3. record indexing coverage and exclusions after the search engine has had time
   to crawl;
4. capture impressions, clicks, click-through rate, and queries as the ongoing
   discovery baseline; and
5. review changes by page and query rather than treating average position as the
   product goal.

The product should not add behavioural analytics or infer creative success from
search traffic. Search evidence can show whether people find the doorway; it
cannot show whether the making experience is worthwhile.

## Reference basis

The implementation rules follow current Google Search Central guidance on
[Search Essentials](https://developers.google.com/search/docs/essentials),
[JavaScript search basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics),
[canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls),
and
[structured-data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
Google recommends descriptive titles and prominent language people use,
consistent HTML canonicals, crawlable links, sitemaps, and structured data that
represents visible content. These references guide technical clarity; they do
not override Keep These's product or editorial authorities.
