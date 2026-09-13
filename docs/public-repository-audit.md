# Public repository disclosure audit

## Status

This audit was performed for issue #78 on 13 September 2026 against merge
commit `013db88`. The maintainer accepted the existing commit attribution as
intentional public contributor information on 13 September 2026. No disclosure
blocker remains from this audit. Issue #79 must repeat the final checks against
the publication commit before changing repository visibility.

This is a disclosure and operational-boundary review, not legal advice or a
professional penetration test.

## Intended public surface

GitHub currently exposes one remote branch, `main`, and no tags. The audited
`main` history contains 32 commits, 541 reachable Git objects, and 135 distinct
historical paths. The largest historical files are the npm lockfile and the
reserved visual assets; no unexpectedly large archive, database, executable,
or generated release artifact was found.

Local tracking references remain for previously deleted delivery branches.
They are not present on GitHub and will not be disclosed by changing repository
visibility. They must not be republished without a fresh scan. One passage
candidate exists only in those local references and is not part of the public
`main` history.

GitHub reports no remote tags, repository webhooks, deploy keys, Actions
secrets, Actions variables, or GitHub Pages site. The only repository
environment is the system-created Copilot environment and it has no protection
rules or deployment policy. Cloudflare Pages operates through its installed
GitHub integration rather than a credential stored in this repository.

## Methods

The audit used repository-native and GitHub API checks because no dedicated
secret scanner was installed:

- enumerated every path and blob reachable from `main` with `git rev-list`,
  `git log`, `git ls-tree`, and `git cat-file`;
- inventoried remote branches, tags, workflows, environments, hooks, deploy
  keys, secret names, variable names, deployment records, and relevant
  repository and Actions settings through the GitHub API;
- scanned every text blob reachable from `main` for common private-key headers,
  GitHub, AWS, Slack, OpenAI, and generic assigned-secret signatures;
- scanned reachable content for email addresses, personal filesystem paths,
  phone-number candidates, private-network URLs, and unexplained high-entropy
  strings without printing candidate values;
- inspected all high-entropy candidates individually; they were passage IDs,
  import paths, source/provenance identifiers, URL fragments, or test fixtures;
- reviewed workflows, ignored-file rules, environment-variable references,
  file types, largest blobs, source records, visual assets, and adjacent rights
  notices;
- ran the repository quality suite, which validates all twenty passage rights
  records and ensures every public visual asset is named by its rights notice.

The scan did not inspect unreachable objects, local ignored files, GitHub or
Cloudflare account data outside this repository, or the internal behaviour of
third-party services. Unreachable local objects are not transferred by an
ordinary clone or exposed by a GitHub visibility change.

## Findings and disposition

### Commit attribution is accepted public information

All 32 commits reachable from `main` contain the maintainer's personal email
address in author metadata; one also contains it in committer metadata. The
address is not repeated here. A public Git clone exposes raw commit metadata
even when GitHub's interface visually associates commits with an account.

On 13 September 2026, the maintainer explicitly accepted the existing address
as intentional public contributor attribution. No history rewrite, commit-ID
change, credential action, or attribution remediation is required. Future
commits may continue to use that attribution unless the maintainer records a
different preference.

### No repository credential material found

The signature, assignment, and entropy scans found no credential, token,
password, private key, or unexplained secret candidate in the reachable tree or
history. GitHub contains no Actions secret or variable names, deploy keys, or
repository webhooks. The application requires no runtime environment variable,
remote API, backend, account, analytics system, or Cloudflare binding.

The `.gitignore` now excludes `.env`, `.env.*`, and `*.local`, while permitting
a value-free `.env.example`. The development guide states that no credentials
are required and explains the rule for future configuration.

### Expected development-only local addresses

The only private-network matches are loopback URLs in Playwright configuration
and browser tests. They start and test the local preview server and confer no
network or service access.

### Material and redistribution boundaries are accounted for

The current tree contains source, tests, project records, twenty verified
literary passages, four reserved textures, and seven reserved brand or icon
files. It contains no font file, user-created poem, database, content export,
private research record, or unidentified binary format.

The MIT, CC BY 4.0, literary-source, third-party, maker-work, brand, and visual
asset boundaries are mapped in `LICENSING.md`. Reserved files have adjacent
rights notices, dependency notices identify exact distributions, and every
passage carries structured rights and provenance evidence. No material was
found that requires history removal before public disclosure, subject to the
project's stated jurisdictional and professional-advice caveats.

### Deployment authority remains external

The workflows request read-only repository contents, install locked npm
dependencies, run checks, and upload browser diagnostics only on failure. They
reference no secret, environment variable containing a credential, deployment
key, or writable GitHub token. Public read or fork access therefore grants no
Cloudflare, DNS, domain, billing, analytics, or GitHub write authority.

Cloudflare Pages builds the static site through an installed GitHub integration.
Its account permissions and billing controls cannot be established from the
repository and require maintainer verification in Cloudflare before the final
visibility change. Public pull requests may also interact with preview-build
policy; issue #79 must deliberately configure that policy.

## Public-settings follow-up

These settings do not disclose an existing credential, but issue #79 must
review them before publication:

- `main` currently has no branch protection;
- GitHub Actions permits all actions and reusable workflows; action references
  use version tags rather than immutable commit SHAs;
- GitHub secret scanning, code scanning, and Dependabot alerts are disabled;
- anonymous issue and pull-request contribution expectations are not yet
  documented;
- Cloudflare preview behaviour for contributions from forks has not yet been
  verified through its account controls.

The workflows use a read-only default token and cannot approve pull requests.
These existing constraints reduce exposure while the public settings are being
prepared.

## Final verification required

Immediately before changing repository visibility, issue #79 must:

1. repeat the reachable-history signature and entropy scans against the final
   `main` commit;
2. clone `main` into a new directory with no local object sharing;
3. confirm the clone contains only the intended tracked paths and no other
   remote branch or tag;
4. run `npm ci` and `npm run check` in that clone;
5. verify repository and Cloudflare permissions in issue #79 before changing
   visibility.

The visibility change must use those final results rather than assume that this
point-in-time audit covers later commits or external settings changes.
