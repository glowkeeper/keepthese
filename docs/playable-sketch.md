# Playable sketch

## Version 0 interaction

The playable sketch asks one question: does keeping words and watching a poem
emerge feel absorbing enough to justify a polished product?

The verified *Frankenstein* passage is rendered as semantic HTML from its Astro
content record. Every word is a native toggle button. `Tab` enters the passage
once, the arrow keys move between words, `Home` and `End` move to its bounds,
and `Enter` or `Space` toggles a word. Pointer and touch use the same controls
rather than relying on drawing gestures or a canvas.

Chosen words remain visibly distinct and collect into a separately labelled
semantic poem in source reading order. The poem's order does not depend on the
order in which words were chosen. A polite status message announces each
change. Undo reverses the last word choice, restart clears the page, and the
blackout action can be reversed without losing selections.

Creative state exists only in the mounted React component. It is deliberately
lost on a full reload and is never written to browser storage or sent anywhere.

## Accessibility baseline

- The page uses landmarks, headings, an article for the source, and an aside for
  the emerging poem.
- A roving focus model avoids placing every word in the page's `Tab` sequence.
  Native buttons expose each word's kept state with `aria-pressed` and update
  their accessible action name between “Keep” and “Remove.”
- Keyboard focus is strongly visible, including over blacked-out words.
- Selection and blackout do not depend on colour alone; state is available in
  button semantics, the poem text, and status announcements.
- Text remains live HTML at narrow and wide viewports, through browser zoom, and
  when visual styling is unavailable.
- Motion is minimal and removed when reduced motion is requested.
- Source authorship, edition, transcription credit, and a route to the original
  are available in a native disclosure.

This baseline and browser automation do not replace human accessibility review
with assistive technology or creative judgement.

## Verification responsibilities

Fast unit and component tests cover text preservation, stable word identifiers,
source-order selection, correction, undo, restart, blackout state, semantic
output, and attribution. Playwright runs separately against desktop Chromium
and a representative Pixel 5 viewport. It covers pointer and keyboard input,
focus, status announcements, selection order, deselection, undo, restart,
blackout, attribution, and reload behaviour. Failures retain traces and
screenshots.

Human review must still assess legibility, zoom, focus order, contrast,
screen-reader experience, touch comfort, tactility, typography, pacing, and
whether making a poem actually feels worthwhile. Those observations are
evidence for issue #10; automated success must not be reported as creative
validation.

## Deliberate exclusions

Version 0 has no account, onboarding, library, autosave, local archive, export,
sharing, backend, analytics, generative suggestion, or persistence beyond the
current page session.
