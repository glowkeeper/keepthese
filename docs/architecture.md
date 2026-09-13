# Architecture

## Status

This is a living decision record for Keep These. It distinguishes the
architecture required now from options that may become appropriate in later
stages.

No hosting platform has yet been selected. Its absence is intentional rather
than an implicit decision. The product stages establish when different kinds of
architecture become justified.

## Version 0 application foundation

Version 0 uses Astro in its default static-output mode. Astro owns routes,
document structure, metadata, editorial content, and the static site shell.
React owns one cohesive interactive studio island. Pure TypeScript modules will
own selection rules and creative state independently of either rendering layer.

This boundary supports the likely long-term combination of discoverable author,
book, passage, collection, attribution, and guide pages around one deeply
interactive creative instrument. It avoids both a site-wide client-rendered
application and a collection of small islands that would make connected studio
state difficult to coordinate.

The foundation includes no server adapter, router library, global state
library, content management system, offline tooling, or backend client. Astro
continues to emit static files. On-demand rendering remains a later option for
an individually justified route rather than the default architecture.

Node.js and npm provide the pinned development and CI runtime. Prettier,
ESLint, markdownlint-cli2, Astro's strict checker, TypeScript, React Testing
Library, and Vitest form one warning-free quality contract exposed through
`npm run check`. GitHub Actions runs the same locked installation and aggregate
check on pull requests and pushes to `main`.

Vitest runs the fast unit and component suite in a lightweight DOM environment.
Playwright runs the meaningful creative interaction separately against desktop
Chromium and a representative narrow mobile viewport. Browser failures retain
screenshots and traces. GitHub Actions keeps this slower browser suite in its
own job rather than folding it into the fast `npm run check` contract.

Astro content collections own typed passage and provenance records. Each local
JSON entry contains versioned clean text, source and edition details,
jurisdiction-specific rights checks, credits, and the route back to the
original. The schema rejects incomplete records during checks and builds;
application attribution is generated from the same data rather than duplicated
as interface copy. The first record and its selection and rights reasoning are
documented in `sources/first-passage.md`.

## Staged architecture

Technical architecture should follow the product stages in `../PRODUCT.md`.
For every stage, record:

- the capabilities the stage requires;
- where state lives and how long it must survive;
- trust, privacy, security, and licensing boundaries;
- runtime and deployment needs;
- compatibility and accessibility requirements;
- explicit non-goals;
- the condition that would justify additional infrastructure.

Prefer the least complex architecture that fully supports the current stage.
Do not build speculative foundations solely because a later stage might use
them.

## Expected progression

```text
Version 0                 Version 1                  Version 2
one static page    ->     static published app  ->  static literary practice
session only              browser autosave          local archive + encoded URLs
                                                       |
                                                       | demonstrated need
                                                       v
Version 4                 Version 3
community, perhaps <-     selective backend persistence
optional and gated        managed identity only where needed
```

### Version 0

The playable sketch needs only a static page and in-memory session state. It
does not need persistence, accounts, a content service, or a backend.

### Version 1

The small beautiful object remains a static application. Curated and verified
texts can be versioned data files in the repository. Browser storage can own
autosave state. Export happens on the device.

An installable application is not required merely because the app is static.
The immediate technical challenge is interaction and rendering quality, not
infrastructure.

### Version 2

The literary practice may add an offline-capable installable web application,
device-local archives, and stateless sharing. Share URLs should encode enough
information to reconstruct a poem without a poem database, subject to practical
URL length, integrity, copyright, and privacy review.

### Version 3

A backend and managed authentication become candidates only for demonstrated
cross-device, permanent-publication, classroom, or exhibition requirements.
Anonymous and local creation remain the default path. Server-side storage must
have an explicit ownership, retention, deletion, privacy, and moderation model.

### Version 4

Community features require a separate product and architecture decision. A
temporary exhibition may meet the desired outcome with fewer identity,
moderation, safety, and engagement concerns than permanent profiles and feeds.
No community infrastructure should be treated as inevitable.

## State ownership

The intended default is:

| State | Earliest stage | Owner |
| --- | --- | --- |
| Current selections | Version 0 | Page session |
| Unfinished work | Version 1 | Browser storage |
| Exported artwork or project | Version 1 | Maker's device |
| Personal archive | Version 2 | Browser storage |
| Shared reconstruction | Version 2 | Encoded URL and recipient browser |
| Cross-device or permanent work | Version 3 | Deliberately chosen backend |
| Community activity | Version 4, if agreed | Deliberately chosen service |

An account is necessary only when durable identity across devices or people is
necessary. Saving a poem does not by itself justify an account.

## Decision records

Material decisions belong in this document or in a linked decision record.
Each decision should state its context, the chosen direction, important
trade-offs, and what would cause it to be reconsidered.

## Production hosting decision

Version 1 is published as the existing static Astro build on Cloudflare Pages
at `https://keepthese.com`. Git-connected preview and production deployments
provide the release path; successful production deployments provide rollback.
The release uses no Cloudflare runtime adapter, Functions, Worker, bindings,
storage, accounts, or analytics. Detailed deployment, verification, and
recovery procedures are recorded in the [release procedure](release.md).

## Playable sketch decision

The Version 0 interaction and its accessibility and verification baselines are
recorded in `playable-sketch.md`. Astro renders the verified passage into the
static document and passes its typed record to one React studio. A pure
TypeScript reducer owns selection history and blackout state. State lives only
for the mounted page session; no persistence boundary is introduced.

The maintainer's Version 0 evaluation supports progression to the static,
local-first Version 1 architecture already described here. Its evidence and
constraints are recorded in `evaluations/version-0.md`; the decision does not
justify a backend, account system, or Version 2 infrastructure.

## Version 1 PNG export

PNG export captures the worked source page at a minimum width of 1200 pixels
and includes the visible work title, author, first-publication year, passage
location, source acknowledgement, and source URL. The browser inlines the local
material textures, rasterises the composition with its canvas API, and downloads
the PNG directly to the maker's device. No poem, image, or telemetry leaves the
browser. Export failure leaves the creative state intact and permits another
attempt. This is a finished image, not a Version 2 editable project file.

## Native PNG sharing

Where a browser exposes the Web Share API and explicitly confirms support for
sharing PNG files, the existing on-device renderer may pass that exact generated
file to the operating system's native share controls. The single-page and
completed-journey actions use the same renderer, filename, resolution, visual
treatment, and attribution contract as their corresponding downloads.
The share payload contains exactly one PNG file and no duplicate text, URL, or
preview representation. A synchronous in-flight guard prevents a second native
share request while the operating-system chooser is open.

Capability detection is conservative: a generic text-sharing API is not enough.
When file sharing is unavailable, the share action is omitted and Download
remains present. Cancellation and failure leave the creative state untouched,
keep Download available, and are described without treating cancellation as an
error. Native share targets and recipients belong to the device; Keep These
receives no poem, image, destination, result, or analytics event.

## Stateless poem links

Version 1 of the stateless link format uses a URL fragment containing a compact
base64url payload and an integrity checksum. It records the stable passage and
text version, selected `word-N` identifiers as numeric positions, supported
material, and blackout state. The fragment is not sent in the HTTP request;
the existing static client reconstructs and validates it against the bundled
public passage records. There is no route handler, database, account, upload,
analytics event, or server-side poem record.

Received work is session-only and is mounted separately from the browser's
passage-specific autosave. It cannot overwrite or delete the recipient's saved
work. Leaving the received reading remounts the ordinary studio and restores
that local work. Malformed checksums, unknown format or text versions, missing
passages, and invalid word identifiers fail into the ordinary studio with an
accessible explanation.

The checksum detects damage rather than establishing authorship or resisting a
deliberate rewrite; the format and privacy limitations are recorded in
[`stateless-poem-links.md`](stateless-poem-links.md). The received surface uses
the existing source context, full attribution, and original-work route. PNG
sharing remains the faithful finished-artwork path when a destination cannot
preserve URL fragments.

## Version 1 passage discovery

Astro loads the complete verified finite collection at build time and passes it,
in the editorial order recorded in `docs/sources/initial-collection.md`, to one
React discovery-and-studio island. The interface exposes a collapsible shelf and
a one-action random alternative to the current passage. It introduces no
catalogue search, ranking, popularity data, remote request, or automatic word
selection. Shelf choices and the random alternative load the selected
passage's canonical static route, where the island starts against that
passage's separate browser-autosave key.

## Version 1 source context

Each passage record carries a concise public `curation.context` note distinct
from its internal selection rationale. The studio introduction renders that
note with the work, author, first-publication year, passage location, and a
direct route to the recorded source before making begins. The full provenance
credit and source route remain attached to the page and its PNG export.

Astro projects each validated repository record into an explicit public
passage shape before passing it to the hydrated React island. The browser
receives only the fields needed for discovery, making, attribution, and export;
internal rationale, rights assessments, transcription administration,
contributors, and other server-side verification fields are not serialized.

This stays within the existing static content collection and React studio
island. It introduces no remote metadata service, catalogue lookup, author
profile system, or additional client state. Context is editorial repository
data validated at build time and covered by the curated-metadata terms recorded
in `LICENSING.md`.

## Version 1 search discovery

The expanded literary collection gains a restrained static discovery surface:
the product homepage, one original guide to the blackout-poetry practice,
one page for each verified passage, and one page for each finite literary
journey. Passage pages, rather than separate author or work catalogues, are the
canonical literary entity while the shelf contains one passage per work and
author. Author, work, motif, filtered, and maker-poem pages are not introduced.

Astro generates every indexable route at build time. Passage and journey pages
come from validated repository data; the original practice guide is a validated
Astro content entry reviewed under the project's documentation and
non-affiliation boundaries. Each route must contain meaningful page-specific
HTML before hydration, an absolute self-canonical URL, accurate source context,
and a clear route into making.

Passage and journey pages mount the same complete discovery-and-studio island
as the homepage, with route-owned initial passage and journey properties.
Autosave remains keyed by passage and text version across routes. Copied poem
links use the active passage's canonical route plus the client-only poem
fragment; received work remains isolated from autosave. Shelf and journey
choices use crawlable canonical routes rather than query-parameter state.
Stateless poem fragments never become sitemap entries or separately indexable
documents. The route and metadata rules, baseline evidence, editorial-content
thresholds, excluded page types, and reconsideration conditions are recorded in
[`seo-strategy.md`](seo-strategy.md).

The shared Astro layout emits the route title, description, absolute canonical,
and matching Open Graph and Twitter metadata. It also emits a restrained
`WebSite` JSON-LD record on the homepage or a `BreadcrumbList` matching the
visible two-level navigation on passage and journey pages. No schema claims
authorship or publication of the underlying literary work.

The sitemap is a static Astro endpoint generated from the same validated
passage and journey collections as the pages. The build verifies its exact
parity with every indexable HTML canonical and checks metadata uniqueness,
structured-data shape, crawler directives, and the 404's `noindex`. Production
response and canonical-host checks are maintained in
[`seo-verification.md`](seo-verification.md).

This discovery surface adds no CMS, remote content, dynamic rendering,
analytics, account, or backend. Search tooling may be owned and consulted by
the maintainer without placing behavioural tracking in the product.

## Finite literary journeys

Astro loads a small, explicitly ordered collection of structured journey
records at build time and validates that every member refers to a passage on
the verified shelf. It projects each record into a public shape before
hydration, omitting the internal editorial rationale. The existing React
discovery island owns the active journey and position for the current page
session.

A journey adds a session-owned composition around the existing passage-specific
autosaves. Entering it selects its first page. The maker explicitly keeps a poem
before continuing; when every member has been kept, the interface presents the
five poems in editorial order as one sequence with routes back to revise them.
The kept sequence and journey position are not persisted, scored, synchronized,
or sent elsewhere. Re-entering a page may recover that passage's existing local
work, which is identified clearly and can be continued or discarded.
Session-kept work remains the authoritative revision source while a journey is
open, so returning from completion still restores it when browser storage is
unavailable. Leaving the journey clears its completion and session sequence
state while returning the maker to the ordinary studio.

The completed sequence has a dedicated fixed-width portrait export surface,
separate from its interactive controls. It records the journey title and five
fully attributed worked source pages in order. Each page reconstructs the
maker's selected words and material as a finished blackout composition, rather
than reducing the work to extracted poem text. The surface then uses the
existing on-device PNG renderer and download boundary. No poem or export leaves
the browser.

The maker can also move directly between members while the browser remains on
the journey's canonical route, preserving session-owned journey progress.
Leaving loads the current passage's canonical route; choosing another path
returns to the homepage. Selecting from the general shelf or using Surprise me
loads a canonical passage route and leaves the active journey.
This is a finite creative conclusion, not a Version 2 personal archive or a
completion reward. The first editorial set and its boundaries are recorded in
`sources/literary-journeys.md`.

## Version 1 browser autosave

Unfinished studio work is stored in the browser's local storage. Each passage
uses a separate `keep-these:unfinished:<passage-id>` record containing schema
version, passage and text version, selected word identifiers, blackout state,
material choice, and the save time. It contains no account, maker name, source
text, analytics, or remote identifier and is never sent to a service.

A record remains on that browser profile until the maker uses the `Discard saved
work` control, the passage text version changes, or browser data is
cleared. Records with malformed data, a different text version, or unknown word
identifiers are not restored. If storage cannot be read or written, the studio
continues in page-session memory and says so plainly. Undo history is deliberately
not persisted; recovery begins a fresh correction history from the restored
creative state. This is current-work recovery, not the Version 2 personal
archive.

## Cross-stage requirements

Accessibility is part of the creative surface from Version 0. Word selection
must not depend exclusively on touch, colour, drawing gestures, or vision. The
first implementation decision should define keyboard operation, focus
behaviour, semantic reading order, contrast, and a non-canvas representation of
the emerging poem.

Source provenance is data, not editorial decoration. Every bundled passage
must carry the information required by `source-material.md`; exports and shared
representations must preserve the agreed attribution. Rights status must be
verifiable per passage rather than inferred from the reputation of a catalogue
or author.
