# First public release

## Hosting decision

Keep These Version 1 is deployed as a static Astro site on Cloudflare Pages.
The production origin is `https://keepthese.com`; `www.keepthese.com` redirects
to that canonical origin. Cloudflare Pages is proportionate because the built
site consists only of static files, can deploy from the existing GitHub
repository, supplies isolated pull-request previews, and retains successful
production deployments for rollback.

No Cloudflare adapter, Pages Function, Worker, database, account system,
analytics product, or runtime binding is used. Creative work remains in the
maker's browser and PNG generation remains on their device.

## Release identity

The identity is typographic and material-led: a literary serif wordmark crossed
by two imperfect charcoal strokes, plus a compact page mark whose small paper
apertures represent words kept from the blackout. The repository includes the
primary vector wordmark, SVG and 32-pixel favicons, a 180-pixel Apple touch icon,
a 512-pixel square thumbnail, and a 1200 by 630-pixel social image.

These are original, deterministic SVG and raster assets created for Keep These;
they introduce no font download, external image request, generative service, or
third-party asset licence. They are reserved brand materials under
`LICENSING.md`. Source SVGs remain alongside the raster derivatives so later
changes are inspectable and reproducible.

## One-time Cloudflare setup

1. In **Workers & Pages**, create a Pages project named `keepthese` from the
   `glowkeeper/keepthese` GitHub repository.
2. Set production branch to `main`, build command to `npm run build`, and build
   output directory to `dist`. Use the Node version in `.node-version`.
3. Under **Custom domains**, attach `keepthese.com`. The domain is already a
   Cloudflare zone; allowing Pages to create its DNS record is preferred over a
   manually created record.
4. Attach `www.keepthese.com`, then create a permanent Cloudflare redirect from
   `www.keepthese.com/*` to `https://keepthese.com/$1` while preserving the
   remaining path and query string.
5. Do not enable Web Analytics or add runtime bindings. Keep the generated
   `keepthese.pages.dev` hostname available for diagnosis, not as the canonical
   public address.

## Release procedure

1. Open a focused pull request. Both GitHub quality workflows must pass.
2. Inspect the Cloudflare preview at desktop and narrow-mobile widths. Complete
   a poem using pointer or touch, repeat a selection using the keyboard, reload
   to check recovery, and download and inspect a PNG.
3. Confirm the preview's metadata, icons, privacy copy, visible source credit,
   unknown-route page, and absence of unexpected external requests.
4. Record the maintainer's aesthetic and functional decision on the pull
   request. This is a maintainer-led review, not evidence of broader usability.
5. Merge to `main`. Wait for the production deployment, then repeat the smoke
   checks on `https://keepthese.com` and verify that `www` redirects there.

## Recovery

If production is unhealthy, use **Workers & Pages → keepthese → Deployments**
to roll back to the most recent known-good production deployment. A rollback
changes served files only; it does not alter the repository or browser-local
poems. Diagnose the failed commit in a new branch and restore normal delivery
through a reviewed pull request. DNS should remain attached to Pages during an
application rollback.

If Cloudflare Pages itself is unavailable, the complete static site can be
rebuilt from any known-good commit with `npm ci && npm run build`; the `dist`
directory is the deployable artifact. Do not introduce a server merely as a
fallback for this static release.

## Release verification record

The repository-level verification is completed on the release branch and
repeated in GitHub Actions. Hosted verification and the maintainer's release
decision are recorded on the pull request after a Cloudflare preview exists.
No claim of broader participant or assistive-technology evaluation is made.
