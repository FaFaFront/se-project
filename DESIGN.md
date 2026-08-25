---
version: alpha
name: "Tutorist"
description: >-
  Tutorist is a tutor-marketplace platform (students book paid sessions with
  tutors by subject) built with Next.js App Router + Tailwind. The brand
  voltage is a saturated purple (#852ef2, the primary CTA fill and focus
  color across every form control) layered against a deeper plum
  (#954293, used sparingly as a structural accent — e.g. the wordmark in
  the top nav). Typography runs Inter for every UI surface and Outfit for
  the wordmark only. Components are pill-shaped buttons (rounded-full) but
  quieter 8–10px rounded corners on form controls (input, select, textarea,
  password field, multi-select) — the same radius split shows up
  consistently across every base component in `apps/web/src/components/ui/`.

colors:
  primary: "#852ef2"
  brand-plum: "#954293"
  brand-plum-dark: "#7d2279"
  brand-plum-deepest: "#300942"
  brand-ultra-dark: "#16052b"
  ink: "#2a2a2a"
  ink-link: "#0000ee"
  ink-black: "#000000"
  placeholder: "#acacac"
  canvas: "#ffffff"
  surface-lavender: "#e7eaf7"
  surface-disabled: "rgba(221, 221, 221, 0.5)"
  hairline: "#dddddd"
  error: "#ff2a16"
  success: "#22e3c2"

typography:
  wordmark:
    fontFamily: "Outfit, Inter, sans-serif"
    fontSize: "20px / 28px (mobile / desktop)"
    fontWeight: 700
  body:
    fontFamily: "Inter, arial, helvetica, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
  body-sm:
    fontFamily: "Inter, arial, helvetica, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 23px
  label:
    fontFamily: "Inter, arial, helvetica, sans-serif"
    fontSize: "14px / 16px (mobile / desktop)"
    fontWeight: 600
    lineHeight: "23px / 26px"
  button:
    fontFamily: "Inter, arial, helvetica, sans-serif"
    fontSize: "14px / 16px (mobile / desktop)"
    fontWeight: 600
  error-text:
    fontFamily: "Inter, arial, helvetica, sans-serif"
    fontSize: "12px / 14px (mobile / desktop)"
    fontWeight: 400

type-scale:
  # apps/web/tailwind.config.ts theme.extend.fontSize — text-{name} utilities.
  # Not yet consumed by any component; this is the scale future headings,
  # marketing copy, and page-level type should draw from instead of ad hoc
  # arbitrary values.
  display-xl: "80px / 700 / 87px"
  display-lg: "40px / 700 / 50px"
  display-md: "30px / 700 / 37px"
  heading-md: "24px / 700 / 30px"
  heading-sm: "24px / 400 / 32px"
  body-md: "16px / 400 / 24px"
  body-sm: "14px / 400 / 28px"
  body-emphasis: "16px / 600 / 24px"
  label-md: "14px / 600 / 20px"
  caption: "14px / 400 / 21px"
  button-md: "16px / 600 / 24px"
  nav-link: "14px / 400 / 20px"

rounded:
  sm: "8px" # input, textarea corners
  md: "10px" # select, multi-select, password-form corners
  full: "9999px" # every button — the brand's one pill shape

spacing:
  gap-xs: "4px" # label-to-control gap
  gap-sm: "8px"
  control-px: "12px" # input/select horizontal padding
  control-height: "40px" # h-10 — shared height across input/select/button

spacing-scale:
  # apps/web/tailwind.config.ts theme.extend.spacing — p-{name}/gap-{name}/etc.
  # A general-purpose scale for page and layout spacing, separate from the
  # component-specific values above.
  xs: "4px"
  sm: "8px"
  md: "10px"
  base: "16px"
  lg: "22px"
  xl: "24px"
  2xl: "32px"
  3xl: "40px"
  4xl: "80px"

components:
  button:
    file: "apps/web/src/components/ui/button.tsx"
    variants: [primary, outline]
    height: "40px"
    rounded: "{rounded.full}"
    padding: "8px 24px"
    typography: "{typography.button}"
    states: [default, hover, loading, disabled]
    notes: >-
      The only pill-shaped surface in the system. primary = solid
      {colors.primary} fill, white text, hover dims to 80% opacity.
      outline = transparent fill, {colors.ink} border and text, hover
      washes in ink-black at 7% opacity. Loading swaps children for a
      spinning Loader2 icon and keeps the label for screen readers only.
  input:
    file: "apps/web/src/components/ui/input.tsx"
    rounded: "{rounded.sm}"
    height: "40px"
    borderColor: "{colors.hairline}"
    states: [default, hover, focus, disabled, error]
    notes: >-
      hover/focus swap the border to {colors.primary}; error swaps it to
      {colors.error} and overrides hover/focus. disabled uses
      {colors.surface-disabled} as both border and fill.
  textarea:
    file: "apps/web/src/components/ui/textarea.tsx"
    rounded: "{rounded.md}"
    minHeight: "96px"
    borderColor: "{colors.hairline}"
    states: [default, hover, focus, disabled, error]
    notes: "Same color/state contract as input; resizes vertically only, disabled removes resize."
  select:
    file: "apps/web/src/components/ui/select.tsx"
    rounded: "{rounded.md}"
    height: "40px"
    defaultWidth: "200px"
    states: [default, hover, open, disabled, error]
    notes: >-
      Custom combobox (role="combobox" + listbox), not a native <select>.
      Highlighted option gets a primary/10 wash; the selected option gets
      a solid primary fill with white text.
  multi-select:
    file: "apps/web/src/components/ui/multi-select.tsx"
    rounded: "{rounded.sm}"
    height: "40px"
    states: [default, hover, open, disabled, error]
    notes: >-
      Built on Radix DropdownMenu with checkbox items. The trigger shows
      an English count label ("N selected") rather than chips — there is no
      per-item removable chip in the trigger itself.
  password-form:
    file: "apps/web/src/components/ui/password-form.tsx"
    rounded: "{rounded.md}"
    height: "40px"
    maxWidth: "400px"
    sizes: [desktop, mobile]
    states: [default, hover, focus, disabled, error]
    notes: "Adds a show/hide toggle (Eye / EyeOff) inside the field; labels/placeholders default to English copy."
---

## Overview

Tutorist is a two-sided marketplace connecting students and tutors — students
browse tutors by subject, book classrooms, and pay per session; tutors list
subjects and an hourly rate. The design system lives entirely in
`apps/web/src/components/ui/` as small, unstyled-by-default React primitives
built with `class-variance-authority` + `cn()` (a `clsx`/`tailwind-merge`
wrapper), each documented with a Storybook `*.stories.tsx` file next to it.

**Key characteristics:**

- One brand purple, `{colors.primary}` (#852ef2), used consistently as the
  hover/focus/active signal across every interactive control — buttons,
  inputs, selects, the multi-select, the password field.
- `{colors.brand-plum}` (#954293) and its darker steps exist as CSS custom
  properties but are barely used on interactive UI today — the only current
  usage is the wordmark color in `Navbar.tsx` (`text-brand-plum-deepest`).
  Treat them as a reserved secondary-accent range, not a second CTA color.
- A deliberate radius split: buttons are the one fully-rounded (`pill`,
  `{rounded.full}`) surface in the system; every form control (input,
  textarea, select, multi-select, password field) sits at a quieter 8–10px
  radius. Don't round a button down to match a form control, and don't
  round a form control up to a pill.
- Inter carries every UI surface (labels, body copy, buttons, inputs).
  Outfit is reserved for the wordmark only (`font-outfit`, weight 600/700)
  — it never appears in body copy or component labels.
- Every form control shares the same 40px (`h-10`) height and the same
  three-state color contract: hairline border at rest, primary border on
  hover/focus, error-red border when `error` is true. This makes controls
  align on a form row regardless of type.
- Labels, error text, and placeholders across `Input`, `Textarea`, `Select`,
  and `PasswordForm` default to English copy — the product's UI language
  is English throughout, matching code identifiers and this doc.

## Colors

### Brand

- **Primary** (`{colors.primary}` — #852ef2): the only action color in the
  system. Fill for `button.primary`, border/ring color on every form
  control's hover/focus/open state, background wash (`primary/10`) for
  highlighted options in `Select` and `MultiSelect`.
- **Brand Plum** (`{colors.brand-plum}` — #954293) and its darker steps
  (`brand-plum-dark` #7d2279, `brand-plum-deepest` #300942, `brand-ultra-dark`
  #16052b): defined as tokens in `globals.css` but not wired into any base
  component's variant logic today. `brand-plum-deepest` is used once, as
  the wordmark text color in `Navbar.tsx`.

### Text

- **Ink** (`{colors.ink}` — #2a2a2a): default body/label text color.
- **Ink Black** (`{colors.ink-black}` — #000000): used for the button
  `outline` variant's border/text and its hover wash — a harder-contrast
  tone than `ink`.
- **Ink Link** (`{colors.ink-link}` — #0000ee): reserved token, not
  currently wired into any base component.
- **Placeholder** (`{colors.placeholder}` — #acacac): placeholder text and
  disabled-state text across every form control.

### Surfaces

- **Canvas** (`{colors.canvas}` — #ffffff): the default background for
  every form control and the button `primary` text color.
- **Surface Lavender** (`{colors.surface-lavender}` — #e7eaf7): reserved
  token, not currently wired into a base component.
- **Surface Disabled** (`{colors.surface-disabled}` — rgba(221,221,221,0.5)):
  fill and border for every disabled form control.
- **Hairline** (`{colors.hairline}` — #dddddd): resting-state border for
  every form control.

### Status

- **Error** (`{colors.error}` — #ff2a16): border color and error-message
  text color when a form control's `error` prop is true.
- **Success** (`{colors.success}` — #22e3c2): reserved token, not currently
  wired into a base component (no success/valid state exists yet on any
  form control — see Known Gaps).

## Typography

**Inter** (weights 400/500/600/700) carries every spoken UI surface — body
copy, labels, button text, error messages. **Outfit** (weights 600/700) is
reserved for the wordmark ("tutorists." in `Navbar.tsx`) and nowhere else.

| Surface            | Size        | Weight | Line height |
| ------------------ | ----------- | ------ | ----------- |
| Wordmark           | 20px / 28px | 700    | —           |
| Label              | 14px / 16px | 600    | 23px / 26px |
| Body (input value) | 14px / 16px | 400    | 23px / 26px |
| Button label       | 14px / 16px | 600    | —           |
| Error message      | 12px / 14px | 400    | —           |

(Sizes are given as mobile / desktop — every base component scales up one
step at the `md:` breakpoint.)

### Type scale

Beyond the component-level sizes above, `apps/web/tailwind.config.ts` also
defines a full `{type-scale}` as `fontSize` utilities — `text-display-xl`
down to `text-nav-link` — each bundling size, line-height, and weight in
one class (e.g. `text-display-lg` → 40px/700/50px). No page or component
consumes these yet; they exist so that headings, marketing copy, and future
page-level type pull from one shared scale instead of arbitrary one-off
sizes. Reach for the nearest scale step before adding a new `text-[Npx]`.

## Layout

- **Control height:** `40px` (`h-10`) — shared by `Button`, `Input`,
  `Select`, `MultiSelect`, and `PasswordForm`, so a form row of mixed
  control types stays vertically aligned.
- **Control horizontal padding:** `12px` (`px-3`) on form controls; buttons
  use `24px` (`px-6`).
- **Label-to-control gap:** `4px` (`gap-1`), consistent on every labeled
  component.
- **Select default width:** `200px`; other controls default to `w-full`
  and are sized by their container.
- **General spacing scale:** `apps/web/tailwind.config.ts` also defines
  `{spacing-scale}` as named `spacing` values (`p-xs`/`gap-md`/`m-4xl`/etc,
  4px → 80px). This is separate from the component-specific values above —
  use it for page and section-level layout spacing (stacking sections,
  padding a card, gaps between grid items) rather than one-off pixel
  values.

## Shape

Two radii, used with strict role separation:

- **`{rounded.full}` (pill):** buttons only. Both `primary` and `outline`
  variants are fully rounded — the system's one pill shape.
- **`{rounded.sm}` (8px):** `Input`, `Textarea`, `MultiSelect` trigger/panel.
- **`{rounded.md}` (10px):** `Select` trigger/listbox, `PasswordForm`.

There's no functional difference intended between 8px and 10px beyond
matching each component's existing implementation — treat both as "quiet
form-control radius" versus the button's pill.

## Components

**`button`** (`apps/web/src/components/ui/button.tsx`) — `primary` (solid
`{colors.primary}` fill, white text, hover → 80% opacity) and `outline`
(transparent fill, `{colors.ink}` border/text, hover → `ink-black/7%` wash).
40px height, pill radius, `isLoading` replaces the label with a spinning
`Loader2` icon while keeping the label for screen readers via `sr-only`.

**`input`** (`input.tsx`) — labeled text field. Hairline border at rest,
primary border on hover/focus, error-red border + inline error message when
`error` is true, `surface-disabled` fill/border/text when disabled.

**`textarea`** (`textarea.tsx`) — same color/state contract as `input`, at
`{rounded.md}` with a 96px minimum height and vertical-only resize
(disabled when the field is disabled).

**`select`** (`select.tsx`) — a custom combobox (not a native `<select>`),
built from a `role="combobox"` trigger button and a `role="listbox"` popup,
with roving keyboard support (arrow keys, Enter/Space, Escape). Selected
option renders with a solid `{colors.primary}` fill; the keyboard-highlighted
option gets a `primary/10` wash.

**`multi-select`** (`multi-select.tsx`) — built on Radix `DropdownMenu` with
`CheckboxItem`s. The trigger shows an English count label (`"N selected"`)
instead of removable chips; each checked option renders a filled
`{colors.primary}` checkbox glyph.

**`password-form`** (`password-form.tsx`) — a text field with a built-in
show/hide toggle (`Eye` / `EyeOff` from `lucide-react`). Ships two size
presets (`desktop` / `mobile`) and English default label/placeholder/error
copy. Max width 400px — it's meant for auth forms, not general layout.

## Do's and Don'ts

**Do** keep `{colors.primary}` as the single hover/focus/active signal
across every form control — that consistency, not the color choice itself,
is what makes a mixed form (input + select + multi-select + button) read as
one system.

**Do** keep buttons as the one pill-shaped surface. Every other interactive
control (input, select, textarea, multi-select, password field) stays at
8–10px radius — don't blur that split by rounding a button down or a form
control up.

**Do** treat `{colors.brand-plum}` and its darker steps as a reserved
accent range, not a second action color — today it's used exactly once
(the wordmark). Introducing it as a second CTA fill would fight `primary`
for the action signal.

**Don't** hardcode copy for labels/placeholders/errors as literal
strings scattered across pages — the base components already default to
English (see `select.tsx`'s `placeholder = "Select an option"`,
`password-form.tsx`'s English labels); override via props at the call site
instead of duplicating copy.

**Don't** introduce a new radius value for a new form control. Match the
existing 8px (`Input`/`Textarea`/`MultiSelect`) or 10px (`Select`/
`PasswordForm`) convention rather than adding a third value.

**Don't** style `{colors.success}` or `{colors.ink-link}` into a component
without checking Known Gaps first — both tokens exist in `globals.css` but
have no defined usage pattern yet; inventing one ad hoc will fragment the
system before it's decided deliberately.

## Known Gaps

- **Success / valid state:** `{colors.success}` is defined as a token but no
  base component has a success/valid visual state (only `error` exists).
- **Focus-visible ring:** form controls change border color on focus but
  don't declare a separate focus ring — keyboard-focus visibility relies on
  the border-color change alone.
- **Brand-plum usage:** the plum range (`brand-plum` → `brand-ultra-dark`)
  has tokens and Tailwind color classes wired up but only one real usage
  (the nav wordmark) — there's no documented rule yet for when to reach for
  it.
- **Dark mode:** `tailwind.config.ts` sets `darkMode: "class"` but no base
  component branches on it; the system is light-only in practice today.
- **Icon set:** icons come ad hoc from `lucide-react` (`Loader2`, `Eye`/
  `EyeOff`, `ChevronDown`, `Check`, `Menu`/`X`) — there's no curated subset
  or naming convention documented.
- **Layout components:** this file covers `apps/web/src/components/ui/`
  only. `Navbar.tsx` and `Footer.tsx` consume these primitives but aren't
  themselves reusable base components, so they're out of scope here.
