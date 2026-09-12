# Stateless poem links

## Product contract

A maker can create a link to one finished reading of a verified source page.
Opening it reconstructs the selected words, material, and blackout state with
the source work, author, attribution, and route to the recorded edition still
attached. No account, upload, hosted poem record, or analytics event is created.

The received poem is clearly distinguished from the recipient's own work. It
opens in session-only state and cannot read, replace, or delete the unfinished
work already saved for that passage. Choosing **Make your own from this page**
leaves the received version and restores the recipient's private local state.

## Format

The URL fragment begins `#poem=v1.` and contains a base64url-encoded compact
payload followed by a checksum. Version 1 records:

- the stable passage identifier and its text version;
- selected word positions, corresponding to the passage's stable `word-N`
  identifiers;
- the supported visual material;
- whether the rest of the page has fallen away.

Fragments are used deliberately: browsers do not include them in HTTP page
requests. Keep These reconstructs the poem locally after the static page loads.
The format contains no maker name, recipient, timestamp, source text, or
tracking identifier.

The checksum detects accidental alteration and ordinary link damage; it is not
a signature and cannot prove who made a link. Anyone who receives a link can
read its encoded choices and can forward or modify it. A link may also be
recorded by browsers, clipboard managers, messaging services, or recipients.
Makers should treat it as shareable rather than private storage.

## Validation and longevity

Keep These rejects malformed payloads, changed checksums, unknown format
versions, unavailable passages or text versions, invalid visual materials, and
unknown or unordered word identifiers. Invalid links do not alter local saved
work and fall back to the ordinary studio with a plain explanation.

A link remains reproducible while Keep These retains support for its format
version and the exact verified passage text version. Text changes require a new
text version rather than silently changing an existing poem. Format migrations
may add decoders for earlier versions, but must not reinterpret them.

The compact representation reduces practical link length but does not promise
support in every destination. Some services may remove URL fragments, wrap
links, inspect copied text, or impose their own length limits. The complete PNG
remains the durable, visually faithful sharing option.
