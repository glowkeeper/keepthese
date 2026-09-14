# Keep These

[Keep These](https://keepthese.com) is a web app for making blackout poetry from a small, carefully curated shelf of
classic writing.

Meet one page, keep the words that speak, and let the rest fall away. Keep These
never chooses words or composes a poem for you. Work is saved in your browser,
PNG exports are made on your device, and every passage retains its source and a
route back to the original work.

Keep These was prompted by Andrew Lavers'
[Psyche film about blackout poetry](https://psyche.co/videos/reignite-your-creative-fire-with-blackout-poetry-the-art-of-framing-whats-already-there),
which credits the work of Austin Kleon. It is an independent project and is not
affiliated with or endorsed by Psyche, Andrew Lavers, or Austin Kleon.

## Try it

The current app is available at [keepthese.com](https://keepthese.com). It is a static site with no accounts,
analytics, advertising trackers, poem uploads, backend, or runtime cloud
dependency.

## Product principles

- discovery, not generation;
- attention, not engagement;
- material feeling without sacrificing accessibility;
- private making as a complete experience;
- visible attribution and a continuing relationship with the source text;
- staged development, with later capabilities gated by evidence and explicit
  decisions.

The fuller app and authorship boundaries are recorded in
[`PRODUCT.md`](PRODUCT.md) and [`CREATIVE_CHARTER.md`](CREATIVE_CHARTER.md).

## Technology

Keep These uses Astro for its static, content-led site and React for one
interactive studio island. Creative state and PNG generation remain on the
device. The literary passages and their rights, provenance, attribution,
and editorial records are validated at build time.

## Local development

Use the Node.js release pinned in `.node-version` and npm:

```sh
npm ci
npm run dev
```

The development server prints its local URL. Create and inspect the static
production build with:

```sh
npm run build
npm run preview
```

No environment variables or service credentials are required to build, test,
or run the application locally. Keep local credentials in ignored `.env` or
`*.local` files and never commit them. If configuration is introduced later,
commit only a value-free `.env.example` describing the required names.

## Verification

Run the complete local quality suite with:

```sh
npm run check
```

This runs formatting verification, ESLint, Markdown linting, unit and component
tests, strict Astro and TypeScript checking, the production build, and static
search-output verification. GitHub Actions runs the same contract for every
pull request and push to `main`.

The separate Playwright suite exercises the creative journey at desktop and a
representative narrow viewport:

```sh
npx playwright install chromium
npm run test:browser
```

Browser failures retain screenshots and traces in ignored local directories.

## Contributing

The source is available publicly primarily for transparency,
learning, and permitted reuse. Bug reports, accessibility findings, and focused
corrections are welcome, but public availability
does not create an obligation to accept a proposal or provide support. Please
read [`CONTRIBUTING.md`](CONTRIBUTING.md) before opening an issue or pull
request.

Report vulnerabilities privately as described in
[`SECURITY.md`](SECURITY.md), never through a public issue.

## Licensing

This is a mixed-rights repository; the entire tree is not covered by one
blanket licence:

- original application code is available under the [MIT License](LICENSE);
- identified original documentation and editorial metadata are available under
  [CC BY 4.0](LICENSE-CONTENT.md);
- the Keep These name, brand, distinctive visual identity, and original visual
  assets remain all rights reserved;
- literary passages and third-party material retain their individual
  public-domain evidence, provenance, licences, and terms;
- makers retain whatever rights they hold in the poems and artwork they create.

Read [`LICENSING.md`](LICENSING.md) for the path-by-path material map and
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for dependencies, literary
sources, and generated-material provenance.

## Project records

- [Product direction](PRODUCT.md)
- [Creative charter](CREATIVE_CHARTER.md)
- [Architecture](docs/architecture.md)
- [Source material and rights](docs/source-material.md)
- [Public repository audit](docs/public-repository-audit.md)
- [Open-source release runbook](docs/open-source-release.md)
- [Project workflow](docs/project-workflow.md)
- [Release and recovery procedure](docs/release.md)
- [AI collaboration guide](AGENTS.md)
