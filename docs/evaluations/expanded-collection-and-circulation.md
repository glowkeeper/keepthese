# Expanded collection and circulation evaluation

## Decision

**Complete the agreed collection-and-circulation programme.**

The maintainer confirmed this decision on 12 September 2026.

The delivered work coheres as a meaningful expansion of Keep These: a larger
but still bounded shelf, clearer encounters with authors and original works,
finite literary journeys, and two restrained ways to circulate attributed
responses. The evidence supports accepting that programme on its own terms. It
does not demonstrate broad appeal, audience growth, or demand for a larger
product stage.

No larger capability has been demonstrated as the necessary next step. After
completion, the appropriate course is to leave the instrument available for
use and let any broader response emerge without adding analytics, accounts,
publication infrastructure, engagement mechanics, or speculative community
features.

## Evaluation question and evidence boundary

Issue #53 was a maintainer-led attempt to broaden the conditions for the appeal
of Keep These by widening its classic-text collection and improving how
attributed responses can travel. It did not begin with evidence of an existing
broad audience, and this evaluation must not manufacture such evidence
afterward.

The maintainer remains the only known creative evaluator. Their sustained use,
completed poems, design judgements, and direct sharing trials are valid evidence
of product-owner conviction and internal coherence. They are not a proxy for
other readers, cultures, access needs, devices, or reasons for making. The
purpose of the programme is to broaden possible appeal; whether it succeeds
with a wider community remains unknown.

The evidence considered here has three distinct forms:

- **Maintainer experience:** repeated making, visual review, journey completion,
  PNG sharing, and stateless-link creation and receipt during delivery.
- **Implementation evidence:** repository validation and automated desktop and
  mobile browser checks for the agreed behavior and boundaries.
- **Code-review evidence:** defects and omissions identified during pull-request
  review and resolved before merge. This is engineering scrutiny, not evidence
  of creative or audience value.

There were no independent participant sessions, audience interviews,
assistive-technology sessions, circulation study, or external observations of
someone encountering a shared poem.

## Expanded collection

The shelf grew from ten to twenty individually verified extracts. The second
bounded tranche added later nineteenth- and early twentieth-century writing,
more women authors, Dakota autobiography, Irish short fiction, industrial and
prairie writing, and further social, psychological, and speculative textures.
The source register records the exact transcription, rights assessment,
provenance, credit, and editorial reason for every addition.

The collection record says both ten-passage tranches were tried in the creative
surface, and the maintainer judged that the new passages added greatly to the
site. Follow-up refinements reduced selection friction and moved recurring
instructions behind help, allowing the additional breadth to remain present
without making the creative surface feel like an endless catalogue.

This supports a conclusion of greater **editorial breadth** across authors,
periods, forms, voices, moods, and linguistic textures, together with a positive
overall maintainer judgement. The evaluation record does not contain
representative passage-by-passage making observations or comparative poems
sufficient to claim that the shelf delivers meaningfully greater creative
fertility in use. It also does not show which passages other people will find
fertile, whether the collection addresses a wide enough range of readers, or
whether twenty is the right long-term number.

## Literary context and source routes

Each encounter now introduces the work, author, first-publication year, passage
location, concise editorial context, and a direct route to the sourced original
before the making surface. The public provenance credit and source route remain
attached below the page and within exported artwork; internal rights
assessments, transcription administration, and selection rationales remain in
the repository and are excluded from the hydrated client payload.

The maintainer accepted the resulting presentation as part of a site they
described as looking great. No obstruction to making was reported after the
context treatment was introduced. This is positive maintainer evidence that
the source relationship became more visible without overwhelming the task. It
is not evidence that unfamiliar readers understand the context, follow the
source links, or go on to read the original works.

## Themed journeys

Three five-page paths give fifteen passages finite editorial sequences around
thresholds and departures, light and hidden worlds, and divided or emerging
selves. Each path provides place and progress without streaks, urgency,
recommendations, or popularity signals.

The first implementation exposed an important conceptual weakness: five
separate poems did not initially resolve into a finished work. The maintainer
identified this directly. The experience was refined to conclude with an
ordered sequence, routes back to revise each poem, and a single portrait PNG
containing all five fully attributed blackout compositions. The maintainer then
accepted the complete-sequence treatment.

That progression is useful evidence that the journeys now have a comprehensible
creative resolution for this evaluator. It does not establish that the themes
are legible, inviting, or editorially meaningful to other people.

## Circulation

### PNG artwork

Individual poems and completed sequences can be downloaded or passed to
supported native share controls as the same locally rendered, fully attributed
PNG. No poem, image, destination, recipient, or outcome is sent to Keep These.
Download remains available when native file sharing is unsupported, cancelled,
or fails.

The maintainer exercised the real Chrome and macOS share flow by copying an
image into Gmail. An initial duplicate-image result exposed overlapping share
behavior; after synchronous guarding and a one-file-only payload, the same
trial produced one copy. This is direct evidence that the repaired path worked
in that particular environment, alongside simulated browser coverage for
support, fallback, cancellation, failure, fidelity, and retryability.

It does not establish behavior across other operating systems, browsers, share
targets, or assistive technologies.

### Stateless poem links

A maker can copy a compact, versioned URL fragment containing passage and text
versions, selected word positions, material, blackout state, and an integrity
checksum. The recipient's browser reconstructs the attributed encounter locally
without a poem record, account, or server request containing the fragment.
Received work remains separate from the recipient's existing autosave.

The maintainer created and opened a real link, responded strongly positively to
the experience, and examined how its base64url payload works. Automated checks
cover fixed vectors, round trips, UTF-8 identifiers, damage and unsupported
versions, source attribution, focus, and private-work isolation.

This establishes that creation and receipt work for the maintainer and that the
format meets its technical contract. It does not show how recipients understand
the invitation, whether messaging services preserve the fragment, or whether
links meaningfully lead people into classic texts.

## Defects, preferences, observations, and larger requests

These categories should not be collapsed:

- **Resolved defects:** selection-flow and focus behavior; journey completion
  and session reset; PNG-share cancellation, retry, duplicate invocation, and
  narrow-layout handling; stale stateless links; asymmetric encoding limits;
  and non-ASCII payload handling.
- **Maintainer preferences incorporated:** scroll to a chosen passage; move
  recurring instructions behind help; retain earlier passage work visibly;
  finish journeys as ordered works; export the complete sequence as faithful
  blackout pages rather than extracted poem text; and make both PNGs and links
  easier to circulate.
- **External observations:** none about creative value or use. Automated review
  comments found engineering issues only.
- **Requests for larger capabilities:** none demonstrated. The work did not
  produce a need for accounts, hosted publication, permanent storage, feeds,
  metrics, cross-device state, or community infrastructure.

## Charter and policy review

- **Discovery, not generation:** every selected word remains the maker's choice;
  no feature composes or recommends poem text.
- **Material, not frictionless:** ink and graphite treatments, worked-page PNGs,
  and sequence artwork preserve the page as material rather than reducing the
  result to generated text.
- **Attention, not engagement:** the collection and paths are finite and contain
  no streak, feed, ranking, notification, or completion reward.
- **Conversation with the source:** author, work, context, provenance, and a
  route to the original remain visible in making, PNGs, and received links.
- **Social restraint:** circulation is deliberate and person-to-person; private
  making remains complete and no public profile or publication layer exists.
- **Tone:** interface copy such as “Keep the words that speak,” “A poem shared
  with you,” and the plain cancellation and failure messages is warm and
  invitational without prescribing meaning, promising transformation, or
  presenting the practice as therapy. Inspection found no claim that the
  application makes someone a poet, and the maintainer raised no tone concern.
  No independent reader has assessed whether the language avoids tweeness or
  feels welcoming to people who do not identify as poets.
- **Accessibility:** semantic poem text, keyboard interaction, focus movement,
  reduced-motion behavior, status announcements, responsive layouts, and
  failure recovery are covered by implementation checks. This is not a
  substitute for evaluation with disabled people or assistive technologies.
  Strong contrast is an explicit design requirement, but this programme did not
  record a contrast-ratio audit across the added contexts, journeys, and sharing
  states; contrast therefore remains an evidence limitation rather than a
  verified conclusion of this evaluation.
- **Source policy:** all twenty passages retain structured rights, provenance,
  transcription, and attribution records. Journeys and links reference those
  verified versions rather than copying untracked source text.
- **Privacy:** unfinished work remains browser-local; image rendering is local;
  link payloads use URL fragments; and the application has no account,
  analytics, poem upload, recipient record, or share-result collection.
- **Cultural aim:** the work makes twenty classic extracts and their originals
  more approachable through creative response. Actual widening of their
  circulation has not been measured and must not be claimed.

## Verification record

All five implementation children of #53 were merged before this evaluation:

1. #54 expanded and verified the bounded passage collection.
2. #55 brought authors, works, context, and source routes forward.
3. #30 introduced finite journeys and finished five-poem sequences.
4. #56 added native sharing for faithful attributed PNG artwork.
5. #17 added stateless attributed poem links with recipient-state isolation.

At the close of #17, `npm run check` passed formatting, lint, Markdown lint, 46
unit and component tests, type checking, and the static build. The complete
Playwright suite passed 42 tests across desktop and narrow mobile Chromium.
Those checks substantiate implementation behavior; they do not substantiate
creative value or audience appeal.

## Limitations and future evidence

- One evaluator, who is also the maintainer and product owner.
- No claim about demographic, cultural, literary, or accessibility
  representativeness.
- No independent observation of discovery, making, journey completion, PNG
  receipt, or stateless-link receipt.
- No evidence about repeat use, comprehension over time, source-link follow
  through, or whether shared work brings another person into the original text.
- Browser automation is concentrated on Chromium; native sharing was manually
  exercised only with Chrome and macOS into Gmail.
- No analytics were introduced to fill these gaps, in keeping with the product's
  privacy boundary.

If broader evidence becomes available naturally, useful observations would be
whether a recipient understands the shared poem and its source, chooses to make
their own response, visits the original work, or finds a passage or journey
compelling. Such evidence may justify small refinements. It should not be turned
into a prerequisite for accepting this early maintainer-led programme, nor into
permission for surveillance or premature infrastructure.
