# Visual direction

## Status

Approved by the maintainer on 7 September 2026 for Version 1 and issue #12.

## Central image

**A page that has waited quietly for someone to notice it.**

Keep These should feel like opening an old book in a still room: warm paper,
generous margins, close attention, and the faint evidence of human hands. It
draws on the physical intimacy of books without pretending to be a photographed
Victorian volume.

The maker's chosen words should feel discovered rather than displayed—as
though they were always present beneath the surface, waiting for the
surrounding language to fall silent.

## Emotional character

The experience should feel:

- quiet, intimate, and unhurried;
- literary without becoming academic;
- tactile without becoming messy;
- mysterious without becoming gothic;
- beautiful without appearing precious;
- handmade without imitating a child's craft table.

There should be a small sense of ceremony when the page is blacked out, but no
theatrical reveal. The pleasure comes from recognition: *there it is*.

## Visual metaphor

The blackout is not censorship. It is excavation.

Unselected words recede beneath material marks. Selected words remain as small
clearings—breathing spaces in ink, charcoal, or graphite. Marks should
acknowledge the maker's gesture rather than form a perfectly uniform digital
mask.

The finished page should resemble a worked literary object: something found
between manuscript, print, drawing, and private correspondence.

## Material language

### Paper

Use a warm, quiet paper ground:

- soft bone or old ivory rather than bright white;
- very subtle fibre, tooth, and tonal variation;
- no prominent stains, torn corners, fake ageing, or theatrical distress;
- enough texture to feel physical without interfering with reading.

The paper should feel handled and alive, not dirty.

### Blackout material

The principal material should be a rich, imperfect near-black ink or compressed
charcoal:

- dense at the centre;
- slightly dry or feathered at some edges;
- varied subtly in opacity and pressure;
- occasionally suggestive of overlapping strokes;
- never a glossy digital gradient or perfect rectangular redaction bar.

The mark should feel deliberate and satisfying—not frantic, violent, or
censorious.

### Secondary material

A restrained graphite or soft-pencil texture may provide a quieter alternative
to ink. It should feel layered rather than uniformly grey, softly directional,
capable of accumulating into darkness, and intimate, provisional, and
revisable.

Avoid offering many materials in the first release. Ink or charcoal and
graphite may be enough.

## Colour

The foundation is nearly monochrome:

- warm paper: bone, parchment, or faded cream;
- primary text: soft book black;
- blackout: soot, iron-black, or compressed charcoal;
- interface text: dark graphite;
- secondary detail: muted stone or old-paper brown.

One restrained accent may support focus, selection, or small interface details.
A faded oxblood, dried-ink blue, or subdued aubergine could work. It should feel
taken from bookbinding or an editor's pencil, not a modern productivity
application. Accent colour must never be the only indicator of state.

## Typography

Typography should carry most of the atmosphere. The source passage should use
a literary serif with calm proportions, generous line height, clear
punctuation, a comfortable measure, and strong letter distinction at small
sizes.

Interface language may use a quieter companion face, but the result must not
feel like book content placed inside a software dashboard.

Avoid ornamental display type, imitation typewriters, distressed fonts,
handwriting fonts, and exaggerated Victorian styling.

## Selected words

Selected words are not stickers, highlights, or glowing interface tokens. They
remain physically connected to the original page. When the surrounding text
falls away, each selected word becomes a small aperture in the material—a
preserved fragment of the source.

Possible treatment:

- a narrow halo of untouched paper;
- slightly irregular material edges around the word;
- enough breathing room to preserve punctuation and legibility;
- no pill shapes, coloured highlighting, or animated glow.

The maker should always understand exactly which words have been kept.

## Interaction and motion

Selection should respond immediately with a small shift in weight, outline, or
surrounding paper. Avoid bouncing, scaling, confetti, and reward animation.

When the rest falls away:

- allow material to settle across the page in a short, gentle progression;
- suggest strokes accumulating or ink finding the paper;
- preserve selected words throughout;
- avoid dramatic wipes, explosions, liquid simulations, and long cinematic
  sequences.

Undo and restart should feel ordinary and forgiving. Reduced-motion
preferences must produce an immediate, equally comprehensible transition.

## Composition

The page is the centre of gravity. Controls should sit around it quietly, like
tools placed beside a sheet of paper. The emerging poem may have a supporting
textual representation, but the layout must not compete with the source page or
become a multi-panel productivity workspace.

Use generous empty space, clear hierarchy, restrained borders, very little
chrome, and finite choices. Avoid a card-grid aesthetic unless a later passage
shelf genuinely needs it. On small screens, preserve the feeling of one page
rather than compressing everything into dense controls.

## Accessibility boundaries

Beauty cannot depend upon reduced readability. Preserve:

- strong text and focus contrast;
- visible keyboard focus;
- practical touch targets;
- semantic source and poem text;
- states communicated through more than colour or texture;
- readable selected words over every material;
- an equivalent reduced-motion experience;
- useful behaviour if textures fail to load;
- browser zoom and narrow-screen reflow.

Texture belongs behind meaning, never over it.

## Anti-goals

Keep These should not resemble:

- a censorship or document-redaction application;
- a generic software-as-a-service dashboard;
- a scrapbook template;
- a gothic-horror game;
- a fake antique manuscript;
- a school worksheet;
- an AI image generator;
- a polished lifestyle-brand mood board;
- a maximalist collage tool;
- a digital painting package.

Avoid fake coffee stains, wax seals, quills, ink bottles, decorative books,
torn-newspaper montages, floating literary quotations, and generated
handwriting.

## Initial asset set

The first release should need very little:

1. One subtle, seamless warm-paper texture.
2. One dense ink or compressed-charcoal texture.
3. One lighter dry-brush or feathered-edge texture.
4. One restrained graphite texture.
5. Possibly one small tactile accent for focus or tool selection.

Every asset should earn its file size and visual presence. If CSS can produce a
result with equal character, no image asset is needed.

OpenArt may generate candidate build-time assets under maintainer direction.
Accepted assets must ship locally, record their prompts, tool and model details,
dates, provenance, edits, and applicable reuse terms, and introduce no runtime
generation dependency. OpenArt helps build the instrument; it does not play the
instrument for the maker.

## Ship test

The surface is ready when:

- the page is pleasurable to sit with before anything is selected;
- choosing words feels precise and physical;
- blackout makes the discovered poem feel more present;
- materials have character without making the artwork for the maker;
- the source remains readable, attributable, and respected;
- the maintainer looks at it and wants to keep using it.

Once objective interaction and accessibility checks pass, aesthetic readiness
belongs to the maintainer: **if the maintainer likes it, it ships.**
