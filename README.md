# Keep These

Keep These began with Andrew Lavers' Psyche film
[Reignite your creative fire with blackout poetry](https://psyche.co/videos/reignite-your-creative-fire-with-blackout-poetry-the-art-of-framing-whats-already-there).
The film presents blackout poetry as the art of finding a new work by framing
what is already on the page, and as a way through creative block. Lavers in
turn credits the work of blackout poet Austin Kleon.

That encounter suggested a calm, beautiful, human-made web instrument: meet a
page, keep the words that speak, and let the rest fall away. Keep These is an
independent project and is not affiliated with or endorsed by Psyche, Andrew
Lavers, or Austin Kleon.

The product will develop in stages. Each stage should be useful in its own
right, with later capabilities introduced only through explicit product and
architecture decisions.

## Development

Keep These currently uses Astro for its static, content-led site and React for
the interactive studio boundary. It requires the Node.js release pinned in
`.node-version` and npm.

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

Run the complete local quality suite with:

```sh
npm run check
```

Individual commands are available for formatting verification (`format:check`),
ESLint (`lint`), Markdown linting (`lint:markdown`), strict Astro and TypeScript
checking (`typecheck`), unit tests (`test`), and the production build (`build`).
The aggregate check treats lint warnings as failures and is run by GitHub
Actions for every pull request and push to `main`.

The playable sketch also has a separate browser suite. Install its Chromium
runtime once, then run it against desktop and narrow mobile viewports:

```sh
npx playwright install chromium
npm run test:browser
```

Browser failures retain screenshots and traces in ignored local artefact
directories. GitHub Actions installs Chromium and runs this suite as an
independent job on pull requests and pushes to `main`.

## Project records

- [Product direction](PRODUCT.md)
- [Creative charter](CREATIVE_CHARTER.md)
- [Architecture](docs/architecture.md)
- [Playable sketch](docs/playable-sketch.md)
- [Version 0 evaluation](docs/evaluations/version-0.md)
- [Source material and rights](docs/source-material.md)
- [Licensing](LICENSING.md)
- [Third-party notices](THIRD_PARTY_NOTICES.md)
- [Project workflow](docs/project-workflow.md)
- [First public release](docs/release.md)
- [AI collaboration guide](AGENTS.md)

The current product target is the Version 1 small beautiful object described
in the product direction.
