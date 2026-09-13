# Open-source repository release

This runbook records the intended public-repository posture and the evidence
needed to publish Keep These safely. It complements the completed disclosure
audit in [`public-repository-audit.md`](public-repository-audit.md).

## Release gate

Repository visibility must remain private until all of the following are true:

- the preparation pull request has merged and its checks pass;
- the maintainer has reviewed the settings below;
- the maintainer gives explicit approval for the visibility change;
- there is no unresolved licensing, privacy, security, or deployment concern.

Changing visibility is a separate release action. Merging the preparation pull
request does not itself authorise that action.

## Public repository profile

- **Description:** A calm, private-by-default instrument for making blackout
  poetry from classic writing.
- **Website:** <https://keepthese.com>
- **Topics:** `blackout-poetry`, `erasure-poetry`, `astro`, `react`,
  `typescript`
- **Issues:** enabled, using the public bug and proposal forms.
- **Wiki and discussions:** disabled until the project has a demonstrated need
  and a maintainer willing to moderate them.
- **Forking:** permitted as part of public GitHub repository access, subject to
  the repository's mixed licensing and reserved-material notices.

## Contributions and security

`CONTRIBUTING.md` sets the boundary between welcome, focused contributions and
maintainer-led product direction. `SECURITY.md` directs sensitive reports to
GitHub private vulnerability reporting rather than public issues.

When the repository becomes public, enable:

- private vulnerability reporting;
- Dependabot alerts and security updates;
- secret scanning and push protection, where GitHub makes them available.

Keep the default Actions token read-only and do not allow workflows to approve
pull requests. Workflows use only GitHub-owned actions, pinned to full commit
SHAs.

## Main-branch controls

Protect `main` with these controls after the repository becomes public:

- changes arrive through pull requests;
- `Warning-free quality suite` and `Playable sketch in browsers` must pass;
- branches must be up to date before merging;
- review conversations must be resolved;
- force pushes and branch deletion are blocked;
- zero approving reviews are required while this is a sole-maintainer project.

The zero-review setting avoids making the repository impossible for its sole
maintainer to advance. Human review remains part of the documented workflow,
and the required checks provide the enforceable merge gate. Revisit this choice
when another regular maintainer joins.

Fork-originated workflow runs should require maintainer approval for first-time
contributors. This limits unexpected Actions consumption without placing a
permanent manual gate on established contributors.

## Cloudflare Pages

The production branch is `main` and automatic deployments are enabled. The
production build is `npm run build` with `dist` as its output. Pull-request
previews may build untrusted contributions into isolated preview deployments,
so they must receive no secret or privileged runtime binding. Keep These
currently builds as a static site and the live Cloudflare configuration has no
variables, secrets, bindings, or deploy hooks.

Cloudflare build comments and the build cache are enabled. Preview deployments
are public by default and are not currently protected by Cloudflare Access.
That is acceptable for this public, client-side application only while previews
remain free of private data and privileged bindings.

Cloudflare's Git integration creates preview deployments for branches and pull
requests by default, and its branch controls can restrict or disable automatic
preview deployments. Confirm the behavior of a public-fork pull request before
treating previews as an accepted contribution path. See Cloudflare's
[Git integration documentation](https://developers.cloudflare.com/pages/configuration/git-integration/).

## Publication sequence and evidence

After the maintainer gives explicit approval:

1. apply the agreed GitHub repository profile and Actions settings;
2. change repository visibility to public;
3. enable the public-repository security settings and protect `main`;
4. clone the repository anonymously into a clean directory;
5. run `npm ci` and `npm run check` from that clone;
6. verify <https://keepthese.com> still serves the production deployment;
7. confirm the Cloudflare production branch and preview policy;
8. record the settings, commands, results, and publication time in issue #79;
9. close issue #79 only after all acceptance criteria are evidenced.

If any post-publication check fails, record the failure immediately and either
correct it or return the repository to private while the cause is assessed.
