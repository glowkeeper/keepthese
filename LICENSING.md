# Licensing

## Current status

Keep These is preparing its repository for public distribution. The licences
and reservations below are active for material in this repository from
13 September 2026; they do not depend on GitHub repository visibility.

Repository access alone grants no rights beyond an applicable licence or other
accompanying notice. In particular, public access to a file does not place it in
the public domain or bring it within the software licence.

## Licence map

| Material | Location | Treatment |
| --- | --- | --- |
| Original application and test code | `src/` except `src/content/`; `scripts/`; functional text files in `public/`; root configuration files; `.github/` | MIT License in `LICENSE` |
| Original project documentation | Root Markdown files and `docs/`, subject to identified exclusions | CC BY 4.0 notice in `LICENSE-CONTENT.md` |
| Original guide and editorial metadata | `src/content/guides/`, original editorial fields in `src/content/journeys/`, `src/content/passages/`, and `src/content/discovery.json` | CC BY 4.0 notice in `LICENSE-CONTENT.md` |
| Literary passages and source records | Literary text and third-party transcription/provenance fields in `src/content/passages/` and `docs/sources/` | Not relicensed; individual public-domain evidence and source terms apply |
| Name, brand, and distinctive visual identity | `public/brand/`, brand-bearing icons in `public/`, and their implementation as a whole | All rights reserved; see the adjacent `RIGHTS.md` notices |
| Original generated textures | `public/materials/` | All rights reserved; see the adjacent `RIGHTS.md` |
| Third-party software and material | As indexed in `THIRD_PARTY_NOTICES.md` and the package lock | Upstream licences and terms apply |
| Maker-created work | A maker's device or deliberately shared output | The maker retains whatever rights they hold |

Mixed files must be read field by field: a CC BY 4.0 editorial note beside a
public-domain passage does not change the passage's status, and bibliographic
facts do not acquire copyright through inclusion in the record.

### Original application source code

Original software code is released under the MIT License in `LICENSE`.

The software licence will not cover the Keep These name or branding, original
visual assets, project documentation, curated metadata, literary source texts,
or user-created work.

### Project documentation

Original project documentation is released under the Creative Commons
Attribution 4.0 International licence (CC BY 4.0) under the notice and material
scope in `LICENSE-CONTENT.md`. Reuse requires
appropriate credit, a link to the licence, and an indication of changes. It
must not imply endorsement by Keep These or its contributors.

### Curated metadata

Eligible original editorial metadata created for the passage collection is
released under CC BY 4.0 under the notice and material scope in
`LICENSE-CONTENT.md`. This includes original contextual notes and curation,
but not facts, public-domain material, third-party descriptions, or rights the
project does not own.

### Brand and original visual assets

The Keep These name, wordmark, logo, distinctive visual identity, original
textures, illustrations, social images, icons, and other original visual assets
remain all rights reserved unless an individual asset carries a separate
licence. Directory-level notices accompany `public/brand/` and
`public/materials/`.

Open-source availability of the application code does not grant permission to
present another product as Keep These or to reuse its identity wholesale.

## Literary source texts

Keep These does not claim copyright in public-domain literary works. Source
passages are not sublicensed under the project's software or documentation
licences. Each passage must carry its own rights and provenance record under
`docs/source-material.md`.

A public-domain identification is jurisdiction-specific evidence, not a
licence granted by Keep These. Translations, illustrations, annotations,
modern editions, typographical layouts, archives, and transcriptions may have
separate terms or rights.

Project Gutenberg or another catalogue may be acknowledged as a transcription
source where appropriate. Its name, licence, and trademarks remain subject to
its own terms, and no acknowledgement may imply affiliation or endorsement.

## Third-party software and material

Dependencies and other third-party material remain under their original
licences. Required copyright notices, licence texts, attribution, and material
exceptions belong in `THIRD_PARTY_NOTICES.md` or an accompanying notice linked
from it.

Nothing in this repository attempts to relicense third-party material or place
additional restrictions on material already in the public domain.

## User-created work

Makers retain whatever rights they hold in poems, marks, and artwork they
create with Keep These. Keep These should request only the permissions needed
to provide a feature deliberately chosen by the maker.

Keeping work locally or downloading it grants Keep These no continuing right
to store, publish, promote, or reuse it. If permanent publication or another
hosted feature is introduced later, its terms must explain the narrow licence
needed to operate that feature, its duration, withdrawal, deletion, and the
rights associated with the underlying source.

## Attribution and notices

Attribution should identify the relevant layer rather than collapse several
creators into one credit:

- the maker of the new poem or artwork, if they choose to be named;
- the original work, author, date, and passage location;
- the edition, transcription, archive, or catalogue used;
- third-party visual or software material where its licence requires credit;
- Keep These editorial material where reused under CC BY 4.0.

The application should generate source attribution from structured passage
records. Notices must not imply that an original author, estate, publisher,
archive, catalogue, or technology provider endorses Keep These.

## Before changing repository visibility

The licence activation and material notices are complete. Before changing the
GitHub repository from private to public, the project must still:

1. audit the current tree and complete reachable Git history for secrets,
   personal data, private operational records, and material that cannot be
   publicly distributed;
2. verify that every bundled passage retains its rights and provenance record;
3. confirm public repository settings, contribution expectations, security
   reporting, and deployment permissions;
4. reconcile any material introduced after this licence audit with this policy;
5. obtain professional advice where a material uncertainty remains;
6. obtain the maintainer's explicit approval for the visibility change.

This document records project policy and licensing. It is not legal advice and
does not determine rights the project does not own.
