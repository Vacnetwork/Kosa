# Design system

## Where the look comes from

The brief fixes the brand: navy `#102B60`, heritage gold `#C99A20`, white, and a
`#F3F5F9` ground, with Manrope/Montserrat headings and Inter body text, and asks
for a premium, trustworthy alumni aesthetic.

The composition is **colour chapters**: every section is a flat field of one
brand colour, floor to ceiling, butted directly against its neighbours with no
gap and no divider, all on one 12-column grid and one pair of outer margins. The
palette is not decoration — it is the association's own structure. KOSA is
organised by graduation year, so the page is organised as a sequence of years:
a paper opener, a navy second, gold for the figure that matters, white for lists,
an ink close.

**The idea, in one sentence:** on this page, the association's own habit of
grouping members by graduation year becomes the page's colour chapters — the
register read as a sequence of years.

**The live thing:** in the gallery chapter, choosing a graduation year changes the
wall — that cohort's member count and its pictures. It uses the association's real
structure, works with a thumb, degrades to the full wall without JavaScript, and
never blocks reading.

## Tokens

All in `src/app/globals.css`. Nothing downstream hard-codes a colour or a size.

| Token | Value | Role |
| --- | --- | --- |
| `--color-navy` | `#102B60` | ink and dark fields |
| `--color-navy-deep` | `#0B1F47` | pressed state on ink surfaces |
| `--color-gold` | `#C99A20` | one accent field, the primary action, the focus ring |
| `--color-white` | `#FFFFFF` | light fields and cards |
| `--color-paper` | `#F3F5F9` | the page ground |
| `--color-paper-dim` | `#E4E8F0` | one tone step, form borders, app-screen rules |
| `--color-slate` | `#4A5A78` | secondary text only — never body copy |
| `--margin` | 20px / 28px | the page's one pair of outer margins |
| `--seam` | 46% / 50% | where the hero's two fields meet |

Type steps: `.t-display` (hero, 52→132px), `.t-h1` (38→64px), `.t-h2` (26→34px),
`.t-h3` (22px), body 17→18px, `.t-small` 14px, and a 13px floor for metadata. Two
families only: Manrope (display, 700/800) and Inter (text, 400–600).

## Components

- **Button** — one shape (square), six variants; gold is reserved for the single
  primary action on a screen.
- **Field / Input / Textarea / Select / Checkbox** — label, hint and error wired
  with `aria-describedby`; the error carries `role="alert"`.
- **Notice** — four tones for inline status; never a floating toast for something
  the user must act on.
- **DemoTag** — marks sample content wherever it appears.
- **Reveal** — staggered section entrance via IntersectionObserver; the CSS
  honours `prefers-reduced-motion` and content is never hidden without JS.
- **The hero** — the page's one loud move: two copies of the same headline, the
  lower one clipped to the navy field, so the letterforms split at the waterline.
  The lower copy is `aria-hidden` so the title is announced once.

## Adding a section

1. Pick its field colour so it differs in **lightness** from its neighbours.
2. Give it a heading that names it (two lines maximum at every width).
3. Use `px-[var(--margin)]`, the full width, and close any void — a picture, a
   second column, a list or a figure on the far side.
4. Wrap the parts in `<Reveal delay={...}>` in 60–90 ms steps.
5. No cards on the public chapters; cards and 1px rules belong to the portal and
   admin surfaces (`.app-surface`, `.quiet-border`).

## Photography

`public/photos/*.webp` are real photographs of Gulu and Acholi life from Wikimedia
Commons (CC BY-SA 4.0 / CC0), downloaded and credited. They show the world around
KOSA — never claim they show KOSA itself, and keep the credit lines. Replace them
with the association's own photographs when they exist, updating the `PHOTOS` map
in `src/content/demo.ts` and the credit line in the footer.

## The crest

The official crest was not supplied. `src/components/brand/crest.tsx` draws a
placeholder shield in the brand colours with the same function (mark + initials +
motto band), documented as such. Drop the real crest at
`public/brand/kosa-crest.png` and set `NEXT_PUBLIC_CREST_SRC=/brand/kosa-crest.png`
— every appearance of the mark updates at once.
