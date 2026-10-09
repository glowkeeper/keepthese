# Personal archive

## Decision

On 9 October 2026 the maintainer decided how the optional on-device archive
works (issue 16, under parent issue 4):

- a poem is saved only when the maker chooses **Save to my archive**; nothing is
  ever archived automatically;
- saved poems live in the browser's local storage, one record per poem;
- reopening opens a **working copy**; a saved poem is an immutable snapshot and
  is never edited in place;
- the archive is the **My poems** page (`/my-poems/`), linked from the footer
  beside Privacy rather than added to the primary navigation.

There is no account, upload, server, or synchronisation. This is the Version 2
personal archive described in `PRODUCT.md`, not a durable collection: anything
beyond one browser on one device belongs to a later stage.

## What a saved poem contains

Each record (`src/lib/poem-archive.ts`, key `keep-these:archive:<id>`) holds:

| Field | Purpose |
| --- | --- |
| `schemaVersion` | Currently `1`; records of any other version are left alone and counted as unreadable. |
| `id` | A random identifier created on the device. |
| `savedAt` | When the maker saved it. |
| `passageId`, `textVersion` | The source page and the exact text version the poem was made from. |
| `selectedIds`, `material`, `blackout` | The creative state needed to reopen the poem. |
| `poem` | The kept words, so the poem survives even if its page later changes. |
| `source` | A snapshot of the work title, author, chapter, required credit, source label, and source-edition link, so provenance and attribution are kept with the poem. |

It contains no account, maker name, device or browser identifier, analytics
value, or popularity measure. The archive shows no counts of views, likes,
streaks, or activity; the only figures are how many poems are saved and roughly
how much storage they use, so storage limits can be explained honestly.

## What the maker can do

- **Save** from the studio's poem actions, once at least one word is kept. The
  button then reads "Saved to my archive" until the poem changes, so the same
  poem is not saved twice by accident. Each save is its own entry.
- **Open a copy.** The My poems link goes to the poem's page with
  `#archive=<id>`. The studio opens the saved choices as a copy that is open only
  in that tab, says so, and writes neither to the saved poem nor to the page's
  unfinished-work autosave. Saving again creates a new entry.
- **Export.** Download the poem as plain text with its source and credit, copy
  a poem link (the existing stateless link, which contains choices and no poem
  upload), or open a copy and use the studio's existing PNG download or share.
  No new project-file format was introduced.
- **Delete** a single poem after an explicit confirmation. Deletion removes only
  that record, is checked by reading the record back, and reports honestly if the
  browser refuses.

## Reopening and page versions

A poem can be reopened only while its page and text version still exist and every
selected word is still valid. If a page is later revised, the poem is kept with
its words and credit, is labelled as made from an earlier version, and is not
offered for reopening or linking. Its text can still be downloaded. Corrupt or
newer-format records are never deleted by Keep These; the page says how many
could not be read.

## Storage limits and loss risks

Saved poems are small, about one kilobyte each, and browsers usually allow a site
about 5 MB in total, shared with unfinished work. They can still be lost:

- clearing site data, or a browser's own clean-up when storage is scarce or the
  site has not been visited for a long time (Safari is the strictest);
- private or incognito windows, which discard storage when closed;
- switching browser, profile, or device, because nothing is synchronised;
- the browser refusing to write, which the studio reports without losing the
  poem you are working on.

The My poems page and the privacy page say so in plain words and recommend
downloading anything that matters. When storage is full the studio says so and
suggests deleting saved poems or downloading a PNG.

## Migration

`schemaVersion` is the migration key. A future change adds a new version and a
reader that upgrades older records on read; until then unknown versions are
ignored, preserved, and counted. The reopen check depends on `textVersion`, so
passage revisions do not corrupt saved poems.

## Accessibility and privacy

The page uses headings, a list of articles, labelled buttons and links with
unambiguous names, a polite status region for results, focus returned to a
sensible place after cancelling or deleting, and the site's existing focus
styles. Nothing is sent to a server, nothing is saved without a choice, and
the page works offline once visited (it is part of the offline cache, though
saved poems themselves are only in local storage).

## Verification

- Unit tests: `src/lib/poem-archive.test.ts` and `src/components/MyPoems.test.tsx`.
- Browser tests: `browser-tests/archive.spec.ts` covers explicit saving, creative
  state and credit, listing, text export, reopening a copy without changing
  unfinished work, cancelling and confirming deletion, a full store, a missing
  poem, a poem from an earlier page version, and layout.
- Screen-reader testing, other browsers, and real storage-eviction behaviour are
  manual checks recorded on the pull request.
