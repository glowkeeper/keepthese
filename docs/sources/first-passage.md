# First passage record

## Selection

Version 0 uses one paragraph from Chapter IV of Mary Wollstonecraft Shelley's
*Frankenstein; Or, The Modern Prometheus*. It begins “No one can conceive the
variety of feelings” and ends “devoted the body to corruption.”

This is a creative choice as well as a rights-conscious one. The paragraph
contains concrete and opposing language around life and death, light and
darkness, creation and kinship, ambition and corruption. Those motifs give a
maker many possible paths through the page without the application choosing a
poem for them.

## Source and textual verification

The passage was transcribed from [Project Gutenberg eBook #42324](https://www.gutenberg.org/ebooks/42324),
whose source is a photo-reprint of the 1831 revised edition published in London
by Henry Colburn and Richard Bentley. Project Gutenberg credits Greg Weeks,
Mary Meehan, and the Online Distributed Proofreading Team.

On 6 September 2026, the repository text was compared word-for-word and
punctuation-for-punctuation with the paragraph in Project Gutenberg's
[plain-text transcription](https://www.gutenberg.org/cache/epub/42324/pg42324.txt),
last updated there on 23 October 2024. Line wrapping was removed; wording and
punctuation were not modernised. Gutenberg headers, licence text, typography,
layout, illustrations, introduction, and surrounding prose were not copied.

The stable record is
`frankenstein-1831-chapter-4-life-and-death`, text version 1. A textual change
requires incrementing `textVersion` and repeating the source comparison.

## Rights assessment

The intended initial markets checked on 6 September 2026 are Great Britain and
the United States.

- **Great Britain:** Shelley died in 1851. GOV.UK states that copyright in a
  written work usually lasts for 70 years after the author's death. The
  underlying English text is therefore outside that usual term. The application
  uses clean text and does not reproduce a published edition's typographical
  layout, for which GOV.UK identifies a separate 25-year term.
- **United States:** Project Gutenberg identifies eBook #42324 as public domain
  in the USA.

There is no translation. The passage excludes the edition's introduction,
annotations, illustrations, and page design. The transcription is acknowledged
and linked, without implying endorsement or treating Gutenberg catalogue
inclusion as worldwide clearance.

This assessment is project documentation, not legal advice. Recheck it before
supporting another market, sourcing another edition, or publishing after a
material change in the evidence.

## Implementation record

The structured record lives in
`src/content/passages/frankenstein-1831-chapter-4.json`. Astro validates it
against `src/content.config.ts`, and source attribution is generated from that
record by `src/lib/passages.ts`.
