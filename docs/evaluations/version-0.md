# Version 0 evaluation

## Decision

**Progress to Version 1.**

On 6 September 2026, the maintainer used the completed playable sketch to make
a poem and judged the central idea to be “an absolute goer.” This is a positive
answer to Version 0's intended question: selecting words and watching a poem
emerge felt worthwhile enough to develop into a small, polished product.

The poem itself is not recorded. Its words belong to the maker, and the stage
decision needs evidence that a work was completed rather than a copy of that
work.

## Evaluation scope

The maintainer was the only participant. No other people were available during
this evaluation, so the decision represents strong product-owner conviction,
not evidence of broad usability or appeal. Version 1 should seek additional
human use early enough that findings can shape refinement rather than merely
validate a finished design.

Automated evidence from issue #8 established that the interaction operates
with pointer and keyboard input across desktop and narrow mobile viewports,
retains semantic poem text and source attribution, supports correction and
restart, and does not persist state after reload. That evidence supports
reliability; it does not establish creative value. The maintainer's completed
poem and judgement supply the distinct creative evidence for this decision.

## Observations

- The maintainer successfully completed a poem rather than merely inspecting
  the controls.
- The act of selecting words and seeing the poem emerge was compelling enough
  to merit continued investment.
- The maintainer described the resulting sketch as looking great and gave an
  unequivocal green light to continue.
- No interaction defect, confusing moment, or accessibility barrier was
  reported during this trial.

The last observation means none was encountered or reported by this evaluator;
it is not evidence that no barrier exists. Detailed assistive-technology and
broader usability evaluation remain necessary.

## Creative charter review

The evaluated interaction remains aligned with the charter:

- **Discovery, not generation:** the maker chose every word; the application
  offered no suggested or generated poem.
- **Material, not frictionless:** the passage remained a page-like surface and
  the blackout action made the act of keeping words visible without completing
  the work for the maker.
- **Attention, not engagement:** one finite passage was presented without a
  feed, metric, notification, account prompt, or pressure to publish.
- **Conversation with the source:** the original work, author, edition,
  transcription credit, and source route remained available.
- **Social restraint:** the complete experience was private and solitary.
- **Tone:** the interface invited making without claiming that it could make
  anyone a poet or presenting itself as therapy.

## Version 1 constraints

The positive decision makes the Version 1 parent eligible for refinement and
an explicit board commitment; it does not silently commit every proposed
feature. Refinement should preserve these constraints:

1. Keep one excellent creative surface as the centre of the product.
2. Preserve human authorship: no word suggestions or poem generation.
3. Retain the semantic, keyboard-operable interaction and source-order model.
4. Treat source rights, provenance, attribution, and routes to the original as
   required passage data.
5. Remain static, private, account-free, and local-first. Autosave and export
   must operate on the maker's device.
6. Expand only to a small, deliberately curated collection of individually
   verified passages.
7. Add visual materials as expressive tools, not one-click artwork.
8. Test export fidelity against what the maker sees.
9. Seek broader human and assistive-technology evaluation during refinement,
   recording defects separately from subjective preferences.

Version 2 and later stages remain uncommitted. This decision supports building
the small beautiful object; it is not evidence for accounts, sharing, a
backend, or community features.

## Limitations

- One participant, who is also the maintainer and product owner.
- One source passage and one completed poem.
- No formal observation session, interview protocol, or comparative design.
- No additional assistive-technology evaluation beyond issue #8's implemented
  semantics, inspection, and browser evidence.
- No evidence yet about repeated use, a larger passage collection, autosave,
  export, or willingness to return.

These limitations lower confidence in generalisation, but they do not weaken
the maintainer's authority to make the product-stage decision requested by
Version 0.
