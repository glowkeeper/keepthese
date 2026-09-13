# Security policy

## Supported version

Keep These is a static web product under active development. Security fixes are
made on the current `main` branch and deployed to
[keepthese.com](https://keepthese.com); older revisions are not supported as
separate release lines.

## Report a vulnerability privately

Do not open a public issue, discussion, or pull request containing vulnerability
details, exploit steps, private poem content, credentials, or personal data.

Use GitHub's
[private vulnerability reporting form](https://github.com/glowkeeper/keepthese/security/advisories/new).
Until that form is enabled as part of the public-repository release, or whenever
it is unavailable, email the maintainer at
[steve@huckle.studio](mailto:steve@huckle.studio). The address is also published
on the maintainer's GitHub profile. Use the subject `Keep These security report`
and include only enough information to arrange a secure follow-up if ordinary
email is not suitable for the sensitive details.

Include, where safe:

- the affected URL, commit, or component;
- the impact and conditions required to reproduce it;
- minimal reproduction steps or a proof of concept;
- whether you believe anyone else has access to the details;
- how you would like to be credited, if at all.

Please allow a reasonable period for acknowledgement, investigation, repair,
deployment, and verification before public disclosure. Keep These does not
offer a bug bounty or guarantee a particular response time.

## Scope notes

The hosted application has no account system, backend, poem database, analytics
service, or runtime Cloudflare binding. Browser-local storage, PNG generation,
URL-fragment poem sharing, the static deployment pipeline, dependencies, and
repository configuration can still have security or privacy consequences and
are in scope for responsible reports.

Third-party archives and catalogues linked from Keep These operate under their
own security policies.
