# Third-party notices

Keep These is currently a private project. It contains application and
development dependencies managed through npm and one public-domain literary
passage. It contains no bundled fonts, images, textures, or other third-party
creative material.

## Literary source material

| Work | Material and location | Source and status |
| --- | --- | --- |
| *Frankenstein; Or, The Modern Prometheus* by Mary Wollstonecraft Shelley | One paragraph from Chapter IV of the 1831 revised edition, stored as `frankenstein-1831-chapter-4-life-and-death`, text version 1 | Project Gutenberg eBook #42324, checked 6 September 2026. Underlying English text assessed as public domain for the intended initial GB and US markets. Transcription produced by Greg Weeks, Mary Meehan, and the Online Distributed Proofreading Team. |

The complete provenance, source links, edition considerations, rights evidence,
limitations, and textual-verification record are in
`docs/sources/first-passage.md`. Project Gutenberg's name and terms remain its
own; this acknowledgement does not imply endorsement.

## Application dependencies

The static application currently uses:

| Component | Purpose | Licence |
| --- | --- | --- |
| Astro | Static site and build framework | MIT |
| Astro React integration | React rendering and hydration | MIT |
| React | Interactive studio component model | MIT |
| React DOM | Browser rendering for React | MIT |

Exact package names, versions, resolved dependencies, and integrity records are
stored in `package.json` and `package-lock.json`. These records do not replace
the upstream licence texts or notices that must accompany a public source or
application distribution.

Development-only quality tools are also declared and locked there. Their
licences must be audited with the production bundle before public distribution.

This file is the required index for third-party material as it is introduced.
Each entry must identify:

- the material, component, or work and its version where applicable;
- its creator or copyright holder;
- its source and retrieval date;
- its licence or independently verified public-domain status;
- required copyright, attribution, and licence notices;
- any jurisdiction, use, trademark, or redistribution limitations;
- where the material appears in Keep These.

Public-domain literary passages also require the structured provenance record
defined in `docs/source-material.md`. Listing a passage here does not place it
under the Keep These software or documentation licence.

When automated dependency metadata exists, it may support this record but does
not replace review of bundled assets, source texts, fonts, build output, or
licence exceptions.
