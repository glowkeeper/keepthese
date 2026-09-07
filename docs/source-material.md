# Source material and rights

## Purpose

Keep These creates new work in conversation with existing writing. Careful
selection, rights verification, provenance, and attribution are therefore part
of the product rather than administrative tasks.

This document records project policy, not legal advice. Requirements should be
reviewed for each jurisdiction and source before publication.

The repository-wide material boundaries and intended public-release licences
are recorded in `../LICENSING.md`. A software or documentation licence never
applies automatically to a literary source passage.

## Initial collection

Versions 0 and 1 should use a small, curated set of individually verified
public-domain passages. Do not expose an entire external catalogue merely
because it is available.

Project Gutenberg may help locate suitable works, but catalogue inclusion is
not by itself sufficient rights clearance for Keep These. Gutenberg primarily
assesses US copyright, its trademark and licence terms apply to redistributed
Gutenberg editions, and some items may have additional restrictions.

For each passage:

- verify the underlying work's status for the intended markets;
- verify translations, annotations, illustrations, and edition-specific
  material separately;
- use clean text rather than reproducing a modern page scan or typographical
  layout;
- remove catalogue headers, footers, and licence matter from the creative
  surface;
- retain an acknowledgement and link to the source catalogue where applicable;
- do not imply endorsement by an author, estate, archive, or catalogue.

For a UK release, author death more than 70 years ago is a useful conservative
starting screen, not complete clearance. Publication history and separate
rights can change the answer.

## Passage record

Every bundled passage should record at least:

- stable passage identifier and text version;
- title and author;
- original publication date;
- passage location where it can be identified reliably;
- source edition or transcription and its URL;
- the relevant copyright analysis and date checked;
- translator, editor, or illustrator where applicable;
- any required credit or reuse terms.

The application should be able to generate attribution from this record rather
than relying on handwritten interface copy.

Any third-party notice required for the passage must also be indexed in
`../THIRD_PARTY_NOTICES.md`.

The first selected and verified passage is recorded in
`sources/first-passage.md`. Its structured source of truth is the corresponding
JSON entry in `../src/content/passages/`, validated by Astro's content schema.

## Presentation and export

Every finished piece should retain a discreet information view containing the
maker's chosen name, if supplied; the source work, author, and date; passage
location; provenance; and a route to read the original.

The Version 1 PNG presents the source work, author, original publication year,
passage location, source acknowledgement, and a visible source URL within the
image. Later export formats may present attribution differently, but should not
silently sever the poem from its source. The minimum credit for Version 1 PNG
export is settled above; any shareable-link credit must be settled before that
later format is implemented.

## Later material

User-supplied text, photographed pages, contemporary licensed extracts, and
public publication each introduce additional copyright, privacy, safety, and
moderation questions. They are not part of the initial stages unless separately
agreed.

If living writers or independent presses contribute passages later, use a
clear participation licence covering display, transformation, export, sharing,
duration, withdrawal, attribution, and territory. Do not begin with broad
publisher catalogue negotiations before the core experience is proven.
