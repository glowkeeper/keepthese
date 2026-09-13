# Contributing to Keep These

Thank you for taking the time to improve Keep These.

The repository is intended to be public primarily for transparency, learning,
and reuse under its stated licences. Once publication is complete, thoughtful
bug reports, accessibility findings, and focused corrections are welcome. The
maintainer is not currently committing to accept unsolicited features, expand
the literary shelf, or provide individual support.

## Before opening an issue

- Check existing issues first.
- Use the bug-report form for a reproducible defect.
- Describe the observed behaviour, expected behaviour, environment, and the
  smallest safe reproduction. Do not include private poem content or another
  person's personal information without permission.
- Report vulnerabilities through the private route in `SECURITY.md`, never in
  a public issue.
- For a proposed product or architectural change, begin with an issue and wait
  for the maintainer to decide whether it belongs in the current stage.

An issue in Backlog is captured but not committed. Only an issue the maintainer
has moved to Ready is agreed for implementation. The project normally keeps one
child issue in active development at a time.

## Before opening a pull request

Except for a very small correction, please wait until the relevant issue is
Ready and the maintainer has invited implementation. This avoids asking someone
to invest effort in a direction that may conflict with the product stage,
creative charter, rights policy, or existing work.

Read the project authorities named in `AGENTS.md`, including the implemented
issue and its comments. If they disagree, stop and surface the conflict.

Use a focused branch named for its issue:

```text
feature/<issue-number>-<short-description>
fix/<issue-number>-<short-description>
docs/<issue-number>-<short-description>
chore/<issue-number>-<short-description>
```

Keep unrelated changes out of the pull request. Explain its purpose and
important trade-offs in plain language, link the issue, and report what was
actually verified.

## Development and checks

Follow the local setup in `README.md`. Before requesting review, run the
smallest checks that substantiate the change; for most repository changes this
is:

```sh
npm run check
```

Run `npm run test:browser` when the creative interaction, routing, responsive
behaviour, or browser integration changes. Automated interaction is not a
substitute for maintainer-led aesthetic or acceptance review.

## Product and material boundaries

- Keep private, account-free making complete.
- Do not add generation, engagement pressure, tracking, or speculative
  infrastructure.
- Do not add literary text, images, fonts, dependencies, or other third-party
  material without verifying rights, provenance, required notices, and the
  relevant project decision.
- Do not treat public-domain status, a catalogue listing, repository access, or
  one file's licence as permission covering adjacent material.
- Keep source attribution and the route back to the original work intact.

## Contribution terms

You must have the right to submit your contribution. By submitting it, you
agree that original code you contribute may be distributed under the MIT
License and original documentation or eligible editorial metadata you
contribute may be distributed under CC BY 4.0, following the material map in
`LICENSING.md`.

Do not submit reserved brand assets, literary passages, third-party material,
or another person's work unless the issue explicitly records the applicable
rights and the maintainer has agreed to receive it.

The maintainer retains product and editorial authority and may decline, close,
or request changes to contributions that do not fit the current stage.
