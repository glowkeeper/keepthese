# Sharing

Keep These offers two separate kinds of sharing: sharing finished PNG artwork,
described first, and sharing the site itself from the page chrome.

## Sharing finished PNG artwork

### Product contract

Sharing is a deliberate route for a maker to circulate the attributed artwork
they have already created. It does not publish the poem to Keep These, create a
public page, recommend a recipient, or measure whether sharing occurred.

Download remains the universal ownership path. On devices whose browser
explicitly supports sharing PNG files, Keep These additionally offers the
device's native share controls for an individual worked page and for a complete
literary-path sequence.

### Privacy and fidelity

Both actions first create the PNG in the browser using the same renderer as
Download. The exact generated file is handed to the operating system. It keeps
the agreed resolution, material treatment, selected words, source attribution,
and source route. Keep These makes no upload or remote request and receives no
recipient, destination, completion, cancellation, or failure information.
The native payload contains one PNG file only. It does not add a second preview,
text item, or URL, and the interface prevents overlapping share requests while
the system chooser is open.

The operating system and any destination selected by the maker have their own
privacy and data-handling terms outside Keep These' control.

### Platform behaviour

Native file sharing depends on the browser, operating system, context, and
installed share targets. Keep These offers Share only when the browser exposes
the Web Share API and confirms it can share a PNG `File`.

- Unsupported devices retain the Download action without a non-working Share
  control.
- Cancelling the operating-system chooser leaves the poem untouched.
- If opening or completing native sharing fails, the poem remains intact and
  both Share and Download can be tried again.
- A successful API response means the file was passed to native share controls;
  Keep These cannot and does not verify what the maker did afterward.

This capability requires a secure production context in supporting browsers.
Browser and operating-system support varies, so native sharing is an enhancement
rather than a replacement for download.

## Sharing the site

Every page built on the site layout carries a share icon in the primary
navigation and a "Share Keep These" control in the footer, matching the
maintainer's other projects. The 404 page has no site chrome and so has no
share control.

Both controls share the site's home address, a short description, and the
title "Keep These". They never include a poem, passage, or the current page's
address. The link is written onto each control from Astro's configured `site`,
so it always matches the canonical home URL.

- Where the browser offers a native share sheet, it is used.
- Otherwise the title, description, and link are copied to the clipboard.
- Dismissing the share sheet is respected: nothing is copied or announced.
- If the share sheet fails for another reason, the clipboard is tried instead.
- Both controls are disabled while a share or copy is in progress, and the
  outcome is announced through one visually hidden live region.

Like artwork sharing, this uses only local browser capabilities. Keep These
makes no request and learns nothing about whether or where the site was
shared.
