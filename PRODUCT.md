# Product direction

## Status

This document records the initial product direction agreed for Keep These. The
product should progress in stages: each stage is useful and coherent in its own
right, while creating an evidence-based path to later capabilities.

## Origin

The idea for Keep These arose from Andrew Lavers' Psyche film
[Reignite your creative fire with blackout poetry](https://psyche.co/videos/reignite-your-creative-fire-with-blackout-poetry-the-art-of-framing-whats-already-there).
It introduces blackout poetry, or erasure, as a practice of hiding words in
found material so that what remains becomes a new work. It also presents the
form as a way to move through creative block. Lavers credits the influence of
US writer and blackout poet Austin Kleon.

Keep These takes inspiration from that invitation to frame what is already
there. It is an independent project, not an adaptation of the film and not
affiliated with or endorsed by Psyche, Andrew Lavers, or Austin Kleon.

## Governing principle

Build the smallest agreed stage well. A later stage is direction, not committed
scope, until its outcome, boundaries, and promotion criteria have been agreed.

Each stage should record:

- the user outcome it delivers;
- why it is valuable on its own;
- what is explicitly inside and outside its scope;
- the evidence or decision that permits progression;
- any product, privacy, licensing, or operational constraints it introduces.

## Product character

Keep These is a quiet instrument for finding poems, not an underbuilt social
platform. It gives people material they can meet, touch, and answer. Its central
gesture is to choose the words that speak and let the rest fall away.

The constraints are part of its character:

- one page at a time;
- a small, considered shelf of texts;
- work kept privately on the person's device;
- a finished image or project file that belongs to its maker;
- a route back to the original book;
- no feed, metrics, notifications, generative button, account prompt, endless
  library, cloud dependency, or pressure to publish.

The creative principles behind these constraints are recorded in
`CREATIVE_CHARTER.md`. Rules for choosing, verifying, presenting, and crediting
source texts are recorded in `docs/source-material.md`.

## A sensible progression

### Version 0: the playable sketch

Use one passage, with no library, onboarding, or saving beyond the current
session. Test whether selecting words and watching a poem emerge actually feels
good.

This can be a single static page. Its purpose is to test the creative
interaction, not establish a production architecture.

### Version 1: the small beautiful object

Create a real, publishable product that remains entirely static and private:

- ten to twenty carefully curated passages;
- a few restrained visual materials;
- undo and restart;
- local autosave;
- PNG export;
- source attribution;
- a one-action random alternative to the current page.

The central standard is one excellent creative surface. Word selection should
be reliable, marks tactile, typography lovely, and exported work faithful to
what the maker saw.

### Version 2: a literary practice

Only after there is evidence that people enjoy making poems, consider:

- a daily passage;
- themed collections;
- shareable links encoding the source, selected word identifiers, and visual
  treatment;
- installable and offline behaviour;
- an optional personal archive stored on the device.

This stage should still avoid a backend where possible. A shared URL can
reconstruct an artwork in the recipient's browser without storing the poem on
a server.

### Version 3: selective persistence

A small backend becomes appropriate only when people explicitly need one or
more of:

- synchronisation between devices;
- permanent public links;
- a durable personal collection;
- classroom groups;
- collaborative exhibitions.

Authentication should use a managed service rather than a custom identity
system. Continue without an account should remain the default.

Persistence should be offered in increasing levels of commitment:

- **Keep here** stores work privately in the browser.
- **Download** produces an image or editable project file.
- **Publish** creates a permanent public work and may require sign-in.

Identity must remain outside the initial creative moment.

### Version 4: community, perhaps

Community is an option, not the inevitable destination. Public galleries,
comments, moderation, feeds, profiles, follower counts, and engagement
mechanics may damage the product's calmness.

A deliberately ephemeral alternative may be stronger: everyone privately
answers one shared page, may optionally visit a temporary exhibition, and then
the day passes. This stage should proceed only if a specific community outcome
is worth its moderation, privacy, safety, and operational costs.

## Stage gates

Progression is not automatic:

- Version 0 advances when the core interaction feels absorbing enough to merit
  a polished product.
- Version 1 advances when real use shows appetite for a recurring practice,
  broader organisation, or sharing.
- Version 2 advances when local and stateless approaches cannot satisfy
  demonstrated needs for durability or coordination.
- Version 3 advances only if a defined community experience is worth the
  additional social and operational consequences.

The project board should express independently deliverable work for the current
agreed stage only. Later stages are context for decisions, not a backlog that
must eventually be completed.

## Version 0 stage decision

On 6 September 2026, the maintainer completed a poem with the playable sketch
and gave an unequivocal decision to **progress to Version 1**. The evidence,
creative charter review, limitations, and constraints for refinement are
recorded in [`docs/evaluations/version-0.md`](docs/evaluations/version-0.md).

This decision makes the Version 1 parent eligible for refinement and explicit
commitment through the project board. It does not commit all Version 1 work
automatically, and it provides no evidence for progressing to Version 2.
