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

## Decisions still to record

- Deployment choices when the sketch is ready to be shared.

The deployment choice should be recorded before the sketch is shared publicly.

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
