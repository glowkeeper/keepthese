# Initial passage collection

## Scope

Version 1 contains ten deliberately selected passages: the original
*Frankenstein* passage and nine additions. The maintainer approved the ten-work
shelf on 7 September 2026. Each passage is a bounded clean-text extract rather
than an attempt to expose a whole catalogue.

The collection ranges across interior reflection, social observation,
autobiography, adventure, aesthetic argument, childhood strangeness, and early
feminist horror. Selection favoured passages with strong but non-prescriptive
images, tensions, and varied vocabulary.

## Verification method

On 7 September 2026, each added extract was compared word-for-word and
punctuation-for-punctuation with the Project Gutenberg plain-text transcription
listed in its structured record. Source line wrapping was removed. Wording and
punctuation were not modernised. Gutenberg headers, footers, licence matter,
formatting markers, surrounding prose, typography, layout, annotations, and
illustrations were not copied.

Every record contains:

- a stable passage and text version;
- work, author, publication, and passage-location metadata;
- the Project Gutenberg record and exact transcription URL;
- the transcription update and project check dates;
- named production contributors where supplied by the transcription header;
- separate GB and US rights assessments;
- attribution text, a curation rationale, and motifs.

The GB assessment uses the author's death date and the usual life-plus-70 term
described by GOV.UK as a conservative initial screen. The US assessment uses
the relevant Project Gutenberg catalogue record. These are project records,
not legal advice, and must be revisited if the intended markets or sourced
texts change.

## Passage register

| Work and passage | Source | Why it belongs |
| --- | --- | --- |
| Mary Wollstonecraft Shelley, *Frankenstein*, 1831 revised edition, Chapter IV, “No one can conceive…” | [eBook #42324](https://www.gutenberg.org/ebooks/42324), updated 23 October 2024 | Life and death, light and darkness, creation and consequence |
| Jane Austen, *Persuasion*, Chapter IV, “How eloquent could Anne Elliot…” | [eBook #105](https://www.gutenberg.org/ebooks/105), updated 29 October 2024 | Prudence and romance, attachment, confidence, youth and age |
| Charlotte Brontë, *Jane Eyre*, Chapter X, “My world had for some years…” | [eBook #1260](https://www.gutenberg.org/ebooks/1260), updated 27 September 2025 | Rules and freedom, hope and fear, courage and the wider world |
| George Eliot, *Middlemarch*, Book II Chapter XX, “That element of tragedy…” | [eBook #145](https://www.gutenberg.org/ebooks/145), updated 12 April 2026 | Ordinary life, attention, heartbeat, roar and silence |
| Frederick Douglass, *Narrative of the Life of Frederick Douglass*, Chapter VI, “From that moment…” | [eBook #23](https://www.gutenberg.org/ebooks/23), updated 18 July 2026 | Reading and freedom, difficulty, instruction, hope and purpose |
| Herman Melville, *Moby-Dick*, Chapter 1, “Call me Ishmael…” | [eBook #2701](https://www.gutenberg.org/ebooks/2701), updated 10 February 2026 | Identity, melancholy, streets, circulation, land and sea |
| Oscar Wilde, *The Picture of Dorian Gray*, 1891 preface, “The artist is…” | [eBook #174](https://www.gutenberg.org/ebooks/174), updated 17 September 2025 | Art and artist, revelation, concealment, beauty and criticism |
| Lewis Carroll, *Alice's Adventures in Wonderland*, Chapter I, “Alice was beginning…” | [eBook #11](https://www.gutenberg.org/ebooks/11), updated 26 June 2025 | Boredom and curiosity, books, sleep, pleasure and surprise |
| Charles Dickens, *Great Expectations*, Chapter IX, “That was a memorable day…” | [eBook #1400](https://www.gutenberg.org/ebooks/1400), updated 17 December 2024 | Memory and change, iron and gold, thorns and flowers |
| Charlotte Perkins Gilman, *The Yellow Wallpaper*, “There is one marked peculiarity…” | [eBook #1952](https://www.gutenberg.org/ebooks/1952), updated 31 August 2024 | Light and change, pattern and confinement, watching and a hidden woman |

## Editorial limitations

Selection and initial making judgement are maintainer-led. The collection is
intentionally small and is not claimed to represent the full range of classic
literature or broad user preference. The passages should be tried in the
creative surface before issue #13 is accepted; weak extracts can be replaced
without expanding the approved ten-work boundary.

The Douglass and Gilman passages retain important historical contexts involving
enslavement, coercion, and mental distress. Their work titles, authorship,
source routes, and contextual relationship must remain intact. They are not
anonymous raw material.

## Implementation

Structured records live in `src/content/passages/` and are validated by the
shared Astro content schema. The collection test enforces the initial count,
validates every record, requires unique identifiers, and checks that no
Gutenberg header text enters the creative passages.

The original *Frankenstein* selection has its detailed record in
`first-passage.md`; *Persuasion* has a detailed worked record in
`persuasion.md`. This register records the same verification procedure and
collection-level editorial reasoning for the remaining additions, while their
complete machine-readable evidence remains with each structured record.
