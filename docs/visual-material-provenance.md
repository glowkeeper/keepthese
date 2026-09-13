# Visual material provenance

## Scope

These four local WebP textures were generated as build-time material candidates
for issue #12, then selected and optimised for the Keep These playable surface.
They contain no writing, signatures, logos, watermarks, recognisable protected
characters, or copied third-party artwork. Rejected candidates are not stored
in the repository.

OpenArt is the generation service. The model and generation mode for every
asset were GPT Image 2 and `text2image`. Generation and selection took place on
7 September 2026. No source or reference images were supplied.

## Accepted assets

| Filename | Purpose | History ID | Settings | Selection |
| --- | --- | --- | --- | --- |
| `warm-paper.webp` | Subtle seamless warm-paper ground behind the source page | `UsmvWTDs8Zxt1gzyDqaM` | 2K, medium quality, 1:1, 2 outputs, PNG source | Candidate B selected for quieter fibre and tonal variation |
| `charcoal-dense.webp` | Dense near-black blackout material | `ylBDj3E1igRp5Yxce6jU` | 2K, medium quality, 1:1, 2 outputs, PNG source | Candidate A selected for richer overlapping charcoal strokes |
| `dry-brush-feathered.webp` | Secondary dry-brush layer for restrained edge variation | `E1OyQ0EjmCTqlkAMiUfZ` | 2K, medium quality, 1:1, 2 outputs, PNG source | Candidate A selected and used as a low-opacity compositing layer |
| `graphite-soft.webp` | Quieter graphite material alternative | `LwURMP01uMVv0PJME4jn` | 2K, medium quality, 1:1, 2 outputs, PNG source | Candidate A selected for restraint; candidate B was too heavy |

The exact prompts were:

<!-- markdownlint-disable MD013 -->

### `warm-paper.webp`

```text
A seamless tileable warm paper texture for a quiet literary web instrument, soft bone and old ivory paper, extremely subtle natural fibre and paper tooth, gentle tonal variation, nearly monochrome, calm and clean, flat orthographic material study, no objects, no page edges, no stains, no ageing, no tears, no shadows, no writing, no letters, no signatures, no logos, no watermark, designed to repeat invisibly as a browser background.
```

### `charcoal-dense.webp`

```text
A seamless tileable dense compressed-charcoal and soot ink texture for a literary blackout poetry instrument, rich near-black iron charcoal, dense softly irregular centre, subtle overlapping dry strokes and restrained pressure variation, matte material, flat orthographic texture study, no objects, no rectangular redaction bar, no writing, no letters, no signatures, no logos, no watermark, no paper edges, no dramatic splatter, designed for compositing behind selected words.
```

### `dry-brush-feathered.webp`

```text
A seamless tileable lighter dry-brush and feathered-edge ink texture for a quiet blackout poetry web instrument, restrained soot and graphite black, airy dry brush fibres, softly feathered uneven edges, gentle directional accumulation, matte and tactile, flat orthographic material study, no objects, no writing, no letters, no signatures, no logos, no watermark, no harsh splatter, no complete composition, designed for subtle compositing around selected words.
```

### `graphite-soft.webp`

```text
A seamless tileable restrained graphite and soft pencil texture for an intimate literary blackout poetry instrument, layered mid-grey graphite, softly directional pencil pressure, provisional and revisable, subtle grain, quiet nearly monochrome material study, no objects, no paper edges, no writing, no letters, no signatures, no logos, no watermark, no decorative illustration, no complete composition, designed for compositing behind selected words.
```

<!-- markdownlint-enable MD013 -->

## Processing and terms

The selected PNG outputs were downloaded from the OpenArt result URLs, resized
from 1360 x 1360 to 680 x 680, and encoded as WebP with `cwebp` quality 82 for
paper, dry brush, and graphite, and quality 84 for charcoal. The browser uses
the files as repeating CSS backgrounds; the material layer is decorative and a
solid colour fallback remains in place if an image cannot load. No runtime
generation, remote asset loading, or OpenArt dependency was introduced.

Under `LICENSING.md` and `public/materials/RIGHTS.md`, these original visual
assets are reserved Keep These material and are not granted under the MIT or CC
BY 4.0 project licences. Public access to the repository does not grant reuse
permission. OpenArt's applicable account and service terms remain relevant to
the generated outputs. Final aesthetic readiness belongs to the maintainer.
