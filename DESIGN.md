---
version: alpha
name: "Ally"
website: "https://www.ally.com"
description: >-
  A US online bank whose marketing system departs from traditional-banking blue and commits instead to a saturated purple (#852ef2, the primary CTA fill) layered against a deeper plum (#954293, the text-color voltage that carries 87 captured occurrences) — the two-tier purple voltage is the brand. The hero is a full-bleed lifestyle photograph of a woman eating tacos with a 80px TruthSans h1 in white floating over it ("Spend on Tacos. Save for Tulum."), a 24px-rounded purple CTA pill below, and no other chromatic moves above the fold. Below the fold the page returns to a white canvas, runs a 3-tab "spending / saving / investing" segmented strip in 999px pill capsules, lays out a deep-purple feature panel in plum #954293 with white headings and a 6-up category grid, and ends with a magazine-style photographic editorial grid plus a deep-purple CTA panel showing the Ally x Tonal partnership. TruthSans carries every spoken surface from the 80px hero through 14px caption, all in either 400 or 600/700 weights; the system has no third typeface.

seo:
  title: "Ally Design System for React — purple #852ef2, TruthSans, 16 components"
  metaDescription: "Ally Bank's marketing system as a DESIGN.md file. Saturated purple primary voltage with deeper plum text-color secondary, TruthSans across every tier, photography-led editorial bands. Tokens for React, Next.js, and AI coding tools."
  highlights:
    - "Two-tier purple voltage — #852ef2 for primary CTAs, #954293 as a deeper plum that carries 87 occurrences as text and border across feature panels"
    - "Departs from banking blue — Ally rejects the trust-blue convention every traditional bank runs and commits to a saturated purple as the brand voltage"
    - "Photography-led hero with 80px display — TruthSans at weight 700 on a full-bleed lifestyle photograph (a woman eating tacos), white type, purple pill CTA"
    - "Tonal-partnership CTA panel — a deep-purple band at the bottom pairs the Ally logo with a third-party (Tonal) wordmark inline as a co-brand statement"
    - "24px rounded geometry — every CTA and segmented control sits at 24px rounding, sub-pill on a scale that runs 8 / 16 / 20 / 24 / 40px with no fully-rounded pill"
  tags:
    - "Banking & Payments"
    - "Fintech & Crypto"
  lastUpdated: "2026-05-18"
  author:
    name: "Dov Azencot"
    url: "https://x.com/dovazencot"
  opening: |
    Ally's marketing site refuses the trust-blue convention every traditional US bank runs (Chase navy, Bank of America blue, Wells Fargo red-on-cream) and commits instead to a two-tier purple voltage. The primary CTA fill is saturated purple #852ef2 — a high-chroma violet that reads more like a tech-brand accent than a banking color. The text-color voltage is a deeper plum #954293, which carries 87 captured occurrences as text and border across feature panels and the deep-purple co-brand band at the bottom of the page. The two purples sit at different roles: the saturated one fills CTAs and feature accents, the deeper plum carries longer-form structural type and the dark band. Together they replace what most banks would do with one or two shades of blue.

    The DESIGN.md file packages the system into a machine-readable spec for React tooling. Inside: 11 color tokens drawn from the two-tier purple voltage, the structural ink-on-canvas tier, and the dark-plum feature-panel surface; 14 typography tokens running TruthSans at 80, 40, 30, 24, 16, and 14px in weights 400, 600, and 700 (the system has no third typeface beyond an occasional Poppins fallback in legal copy); 5 radius tokens centered on a 24px CTA radius with no fully-rounded pill at the top; an 8px base spacing scale; and 16 component definitions covering the purple CTA pill, the dark-plum feature panel, the photographic hero, the segmented account-type control, the editorial photo-tile grid, and the bottom co-brand CTA panel.

    Feed this file to Claude or Cursor and it reproduces Ally's specific moves: two-tier purple voltage instead of banking blue, photography-led hero with 80px TruthSans display in weight 700, deep-plum feature panels that flip contrast to white-on-purple, 24px-rounded CTA geometry without escalating to a pill, and the editorial photo-tile grid below the fold. The one move worth borrowing only if you have an actual co-brand partnership: the dark-plum CTA panel that pairs your wordmark with a partner's wordmark inline. Ally's "Tonal x Ally" treatment is the page's most distinctive structural device.
  related:
    - href: "/design"
      title: "Browse all design systems"
      description: "The full directory of DESIGN.md files on shadcn.io, with live mockups for each."
    - href: "https://www.ally.com"
      title: "Ally — official site"
      description: "Ally Bank's public marketing site — the source of truth for the live tokens captured in this file."
    - href: "https://github.com/google-labs-code/design.md"
      title: "The DESIGN.md specification"
      description: "Google Labs' open spec for machine-readable design system files — the format this page is built on."
  questions:
    - id: "primary-color"
      title: "What is Ally's primary brand color?"
      answer: "Ally runs a two-tier purple voltage. The primary CTA fill is saturated purple #852ef2 — a high-chroma violet (oklch lightness 54, chroma 0.26) that appears as the Open Account button fill and as a structural accent. The deeper text-color plum #954293 (lightness 52, chroma 0.15) carries 87 occurrences across the captured page — 42 as text, 43 as border, 2 as background — and sits behind the dark-purple feature panel that runs near the bottom of the page. The two purples are functionally different: the saturated one is the action signal, the deeper plum is the structural-type signal. Together they replace what traditional US banks would render in two shades of blue."
    - id: "typography"
      title: "What typeface does Ally use, and what should I use as a substitute?"
      answer: "Ally runs TruthSans for every spoken surface — wired in CSS as --truth-sans = TruthSans, arial, helvetica, sans-serif. The system tops out at 80px / 700 on the hero h1 (Spend on Tacos. Save for Tulum.), drops to 40px / 700 on the deep-plum panel headline (You've got an Ally in every corner), 30px / 700 on section h2, 24px / 700 on h3, and runs body at 16px / 400. Weights 400 and 700 are dominant; weight 600 appears on emphasis spans and primary CTA labels. A small amount of Poppins shows up in legal-copy fallback. The closest open-source substitute for TruthSans is Inter at the same weights; the proportions transfer cleanly and Inter's slightly looser counters read close to TruthSans at the body sizes."
    - id: "purple-not-blue"
      title: "Why does Ally use purple instead of the traditional banking blue?"
      answer: "The purple choice is positional. Chase, Bank of America, Citi, Capital One, and US Bank all run variations of blue as their primary brand color — the convention is so universal it has become invisible. Ally's purple #852ef2 reads instantly as not-a-traditional-bank, which aligns with the brand's online-only, no-physical-branch positioning. The deeper plum #954293 carries the editorial type and the feature-panel surface, so the system has chromatic depth even though it stays inside a single hue family. The result is a banking site that reads more like a contemporary fintech (Robinhood, SoFi) than like a heritage commercial bank."
    - id: "radii-and-pills"
      title: "What corner-radius scale does Ally use?"
      answer: "The scale steps cleanly through 8 / 16 / 20 / 24 / 40px with no fully-rounded pill at the top. The dominant value is 24px (10 captured occurrences) — every CTA, every segmented-control tab, and every photo-tile container uses 24px corners. Larger cards step up to 40px on the bottom CTA panel; smaller chips drop to 8px on the secondary surfaces. There is no 9999px pill anywhere on the marketing surface, which differentiates Ally from neobanks (Monzo, Nubank, Revolut) whose primary CTAs are fully rounded. The 24px-on-CTA choice reads as deliberately sub-pill — softer than a typical 8px banking radius but stopping short of the neobank pill convention."
    - id: "use-in-project"
      title: "Can I use this DESIGN.md to build my own online-bank marketing site?"
      answer: "Yes — the file is designed to be fed into Claude, Cursor, or any AI tool that reads structured design tokens. The agent will reproduce Ally's specific moves: two-tier purple voltage instead of banking blue, photography-led hero with 80px TruthSans display in weight 700, deep-plum feature panels with white headings, 24px-rounded CTA geometry, and the editorial photo-tile grid. The tokens resolve cleanly — every hex and font name in the file matches the live CSS Ally ships. One caveat: the 80px hero display only works on full-bleed photography; without a lifestyle photograph behind it, the type weight reads as shouting and the system loses its editorial tone."

mockups:
  - "marketing-hero"
  - "dashboard-card-grid"

colors:
  primary: "#852ef2"
  brand-plum: "#954293"
  brand-plum-dark: "#7d2279"
  brand-plum-deepest: "#300942"
  brand-ultra-dark: "#16052b"
  ink: "#2a2a2a"
  ink-link: "#0000ee"
  ink-black: "#000000"
  canvas: "#ffffff"
  surface-lavender: "#e7eaf7"
  hairline: "#dddddd"

typography:
  display-xl:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 80px
    fontWeight: 700
    lineHeight: 87px
    letterSpacing: 0
  display-lg:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 40px
    fontWeight: 700
    lineHeight: 50px
    letterSpacing: 0
  display-md:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 37px
    letterSpacing: 0
  heading-md:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 30px
    letterSpacing: 0
  heading-sm:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 24px
    fontWeight: 400
    lineHeight: 32px
    letterSpacing: 0
  body-md:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0
  body-sm:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0
  body-emphasis:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0
  label-md:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0
  caption:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 21px
    letterSpacing: 0
  button-md:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0
  nav-link:
    fontFamily: "TruthSans, arial, helvetica, sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0

rounded:
  none: "0px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  cta: "24px"
  xl: "40px"

spacing:
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
  hero-section:
    backgroundColor: "transparent"
    textColor: "{colors.canvas}"
    typography: "{typography.display-xl}"
    rounded: "{rounded.none}"
    padding: "80px 32px"
  hero-heading:
    backgroundColor: "transparent"
    textColor: "{colors.canvas}"
    typography: "{typography.display-xl}"
  section-heading:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.display-md}"
  panel-heading:
    backgroundColor: "transparent"
    textColor: "{colors.canvas}"
    typography: "{typography.display-lg}"
  body-paragraph:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
  body-paragraph-large:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.heading-sm}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.canvas}"
    typography: "{typography.button-md}"
    rounded: "{rounded.cta}"
    padding: "8px 22px"
    height: "48px"
    borderColor: "{colors.primary}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.cta}"
    padding: "8px 22px"
    height: "48px"
    borderColor: "{colors.ink}"
  top-nav:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.nav-link}"
    rounded: "{rounded.none}"
    padding: "12px 24px"
    height: "60px"
    borderColor: "{colors.hairline}"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.ink-link}"
    typography: "{typography.nav-link}"
    padding: "8px 12px"
  segmented-tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-md}"
    rounded: "{rounded.cta}"
    padding: "12px 24px"
    height: "48px"
    borderColor: "{colors.ink}"
  feature-panel:
    backgroundColor: "{colors.brand-plum}"
    textColor: "{colors.canvas}"
    typography: "{typography.body-md}"
    rounded: "{rounded.cta}"
    padding: "32px 16px"
  cta-panel-dark:
    backgroundColor: "{colors.brand-plum-deepest}"
    textColor: "{colors.canvas}"
    typography: "{typography.display-lg}"
    rounded: "{rounded.xl}"
    padding: "80px"
  card-photo:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.cta}"
    padding: "0"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
    height: "48px"
    borderColor: "{colors.hairline}"
---

## Overview

Ally's marketing site refuses the trust-blue convention every traditional US commercial bank runs. **Two-tier purple voltage.** Where Chase commits to navy, Bank of America to blue, and Wells Fargo to red-on-cream, Ally picks saturated purple `{colors.primary}` (#852ef2) as the primary CTA fill and a deeper plum `{colors.brand-plum}` (#954293) as the structural type-and-panel color. The two purples sit at different functional roles: the saturated one is the action signal (CTA pills, feature accents), the deeper plum is the structural-type signal (the deep-purple feature panel that runs near the bottom, plus 87 captured occurrences as text and border across the page). The system has chromatic depth without leaving the purple family.

The hero is photographic and large. A full-bleed lifestyle photograph of a woman eating tacos at an outdoor restaurant fills the above-fold band; the headline "Spend on Tacos. Save for Tulum." sits at 80px TruthSans weight 700 in white over the photograph, with a 24px-rounded saturated-purple pill CTA tucked beneath. The 80px display is the loudest typographic moment in the directory's banking-section — Monzo tops out at 61px, Nubank at 56px, Starling at 48px. Ally takes the display ladder one tier higher and lets the photograph carry the size. The wordmark "ally" sits in lower-case in the top-nav, rendered at a small 14px size — the brand identity uses voice-down lettering even as the display goes very large.

Below the fold the page returns to a white canvas. A 3-tab segmented control in 24px-rounded outline pills lets the visitor pick "Checking, Money, and Savings" / "Stocks, Bonds, and Funds" / "Different kind of bank" as their navigation. Then a deep-plum feature panel (`{component.feature-panel}` — `{colors.brand-plum}` fill, white text, 24px-rounded) lays out a 6-up category grid (Mortgage / Auto / Credit Card / Invest / Robo Portfolios / Money Market) — the panel is the chromatic centerpiece of the page. Below it sits an editorial 3-tile photographic strip ("Inspiring stories and helpful information to build your best possible future") and a bottom CTA panel in even deeper plum `{colors.brand-plum-deepest}` (#300942) pairing the Ally wordmark inline with the Tonal partnership wordmark — the only co-brand statement on the page.

**Key Characteristics:**

- Two-tier purple voltage: `{colors.primary}` (#852ef2) fills CTAs, `{colors.brand-plum}` (#954293) carries structural type and the feature-panel fill — 87 captured occurrences.
- Departs from the blue-banking convention every legacy US bank runs — purple is the brand-positioning move.
- 80px hero h1 in TruthSans weight 700 — the tallest display in the banking section of the design directory.
- TruthSans across every tier, no second sans family beyond a small Poppins fallback in legal copy.
- 24px-rounded geometry on every CTA, every segmented control, and every photo-tile container — sub-pill but distinctly soft.
- Photography-led hero and editorial 3-tile band — lifestyle photography (eating tacos, family beach, working from home) carries the marketing surface; no decorative illustration.
- Two depths of dark-purple panel: `{colors.brand-plum}` (#954293) for the mid-page feature panel, `{colors.brand-plum-deepest}` (#300942) for the bottom co-brand CTA — the second-darkest is the structural climax.
- Lowercase wordmark "ally" rendered small in the top-nav — voice-down lettering balances the very large hero display.

## Colors

### Brand voltage (two-tier purple)

- **Saturated Purple** (`{colors.primary}` — #852ef2): the primary CTA fill. Captured twice on the page — once as background fill (the Open Account button), once as border. High-chroma violet (oklch lightness 54, chroma 0.26). The action signal — used only on buttons and structural accents, never as a body color.
- **Brand Plum** (`{colors.brand-plum}` — #954293): frequency 87 — used as text (42), border (43), background (2). The text-color voltage that carries the deep-purple feature panel surface, plus structural type emphasis across the page. Wired across feature-cell headings and the panel fill. The two-tier purple's structural anchor.
- **Brand Plum Dark** (`{colors.brand-plum-dark}` — #7d2279): captured twice inside gradient stops on the deep-purple panel. Sits between the mid plum and the deepest plum as a transition tone.
- **Brand Plum Deepest** (`{colors.brand-plum-deepest}` — #300942): captured twice inside gradient stops and as the dark-CTA panel surface. The structural climax of the system — used only on the bottom co-brand CTA panel where the Ally + Tonal partnership lives.
- **Ultra Dark** (`{colors.brand-ultra-dark}` — #16052b): captured once as a background fill on a very dark accent surface. The darkest purple in the system, almost-but-not-quite black, used only on a single deep-emphasis surface.

### Text

- **Ink** (`{colors.ink}` — #2a2a2a): frequency 166 — the dominant body-text color. Used as text (83), border (83). A warm dark gray, lighter than off-black, used for every body paragraph and section heading on the white canvas.
- **Ink Link** (`{colors.ink-link}` — #0000ee): frequency 2 — the system's default browser-blue link color, captured on a small set of inline links. The page deliberately keeps this as the user-agent default rather than restyling it.
- **Ink Black** (`{colors.ink-black}` — #000000): frequency 43 — used as text (21) and border (21). The maximum-contrast text tone, used sparingly for the secondary outline-CTA borders and for high-emphasis body text.

### Surfaces

- **Canvas** (`{colors.canvas}` — #ffffff): frequency 265 — the body floor below the photographic hero, the top-nav surface, and the inside of every white card. Wired as the structural default.
- **Surface Lavender** (`{colors.surface-lavender}` — #e7eaf7): captured once as a background — used on the segmented-tab area as a faint lavender wash that connects visually to the purple voltage without competing with it.

### Hairline

- **Hairline** (`{colors.hairline}` — #dddddd): captured 3 times, all as shadow ink. The system's lightest gray — used for subtle borders on card surfaces and for the soft shadow under elevated CTAs.

## Typography

### Font Family

The system runs **TruthSans** for every spoken surface — wired in CSS as the single custom property `--truth-sans = TruthSans, arial, helvetica, sans-serif`. There is no separate display family, no serif tier, no second sans. A small amount of **Poppins** appears as a fallback in legal-copy spans (likely a CMS-injected legacy style), but it never carries primary content. TruthSans does every job.

### Hierarchy

| Token                        | Size | Weight | Line Height | Use                                                                     |
| ---------------------------- | ---- | ------ | ----------- | ----------------------------------------------------------------------- |
| `{typography.display-xl}`    | 80px | 700    | 87px        | Hero h1 ("Spend on Tacos. Save for Tulum.")                             |
| `{typography.display-lg}`    | 40px | 700    | 50px        | Deep-plum feature panel headline ("You've got an Ally in every corner") |
| `{typography.display-md}`    | 30px | 700    | 37px        | Section h2 ("Inspiring stories and helpful information")                |
| `{typography.heading-md}`    | 24px | 700    | 30px        | Category card titles inside the feature panel                           |
| `{typography.heading-sm}`    | 24px | 400    | 32px        | Editorial sub-headlines and lighter h3 treatments                       |
| `{typography.body-md}`       | 16px | 400    | 24px        | Default running paragraph text                                          |
| `{typography.body-sm}`       | 14px | 400    | 28px        | Caption rows and secondary copy with extended leading                   |
| `{typography.body-emphasis}` | 16px | 600    | 24px        | Inline emphasis and primary CTA labels                                  |
| `{typography.label-md}`      | 14px | 600    | 20px        | Small-caps category labels                                              |
| `{typography.caption}`       | 14px | 400    | 21px        | Footer regulatory text and metadata                                     |
| `{typography.button-md}`     | 16px | 600    | 24px        | Primary and secondary button labels                                     |
| `{typography.nav-link}`      | 14px | 400    | 20px        | Top-nav link labels                                                     |

### Principles

Display weight tops out at 700 — Ally is the only bank in the directory that lets weight escalate that high. The 80px hero h1 at weight 700 is unambiguously the loudest typographic moment, and the deep-plum panel headline at 40px / 700 is the second. Body sits at weight 400; primary-button labels and inline emphasis use 600. There is no 300 or 500 weight on the captured page — the system is binary in weight terms: light body or heavy display.

The 14px / 28px line-height combination on body-sm (line-height 200%) is unusually generous — it gives the secondary text rows the same air a 16px body line would carry, which keeps the smaller copy readable inside the editorial 3-tile grid.

### Note on Font Substitutes

TruthSans is licensed. **Inter** at weight 400 and 700 is the closest open-source substitute; the proportions transfer cleanly and Inter's slightly looser counters read close to TruthSans at the body sizes. For the 80px hero display, **Geist** (Vercel's sans) has a similar cap-height density. The Poppins fallback in legal copy can be left as-is if you're matching Ally directly, or normalized to Inter to keep the system unified.

## Layout

### Spacing System

- **Base unit:** 8px, with a distinctive **10px** sub-unit (39 captured occurrences in the 0px 0px 10px margin pattern that pads the page's stacked text blocks).
- **Tokens:** `{spacing.xs}` 4px · `{spacing.sm}` 8px · `{spacing.md}` 10px · `{spacing.base}` 16px · `{spacing.lg}` 22px · `{spacing.xl}` 24px · `{spacing.2xl}` 32px · `{spacing.3xl}` 40px · `{spacing.4xl}` 80px.
- **Section padding (vertical):** `{spacing.4xl}` (80px) between major bands (4 captured occurrences).
- **CTA padding:** 8×22 (`{spacing.sm} {spacing.lg}`) — the dominant button-padding measurement (8 captured occurrences on `{component.button-primary}`).
- **Card internal padding:** `{spacing.2xl}` (32px) on the deep-plum feature panel with 16px column gaps.

### Grid & Container

- **Max content width:** ~1200px on most bands; ~1080px on the editorial photo-tile grid.
- **Hero block:** full-bleed photographic canvas, content (headline + CTA) centered with 32×80 padding.
- **Segmented control:** 3-up horizontally-aligned tab row in 24px-rounded outline pills; the active tab shifts to a purple-bordered treatment.
- **Deep-plum feature panel:** 24px-rounded surface in `{colors.brand-plum}` containing a 6-column category grid (Mortgage, Auto, Credit Card, Invest, Robo Portfolios, Money Market) at desktop, collapsing to 3-up on tablet.
- **Editorial 3-tile grid:** 3-column photo-tile band ("Inspiring stories and helpful information") with each tile carrying a lifestyle photograph at the top and a heading+excerpt beneath.
- **Bottom co-brand CTA panel:** 40px-rounded dark-plum panel pairing the lowercase Ally wordmark with the Tonal partnership wordmark on a single line.

### Rhythm

The page alternates between **photographic bands and chromatic panels**. The hero is photographic; the segmented control sits on white; the deep-plum feature panel is the chromatic climax of the middle of the page; the editorial 3-tile grid returns to photographic-tile-on-white; the bottom CTA panel goes even deeper plum. Two depths of dark-purple panel mark the structural climax of the page — the mid plum is the "what we offer" moment, the deepest plum is the "what we partner with" moment.

## Elevation

The system uses **flat-with-shadow-accent** elevation. The captured page has 3 occurrences of `{colors.hairline}` (#dddddd) used as shadow ink and 1 occurrence of black-as-shadow — confined to subtle lift treatments on CTAs and on the segmented-control active tab.

- **Flat (no shadow):** hero, feature panel, editorial grid, footer — 95% of surfaces.
- **CTA elevation:** the saturated-purple `{component.button-primary}` sits with a very subtle hairline-gray drop shadow at ~3% alpha — readable as a tactile signal more than a true lift.
- **Segmented-tab active state:** uses the same hairline shadow to mark the active tab without a fill.
- **Card lift:** the editorial photo-tile cards have no shadow; depth comes from the 24px corner rounding and the photographic content alone.

## Shapes

The radius scale is **stepped without a pill**:

- `{rounded.none}` 0px — section dividers and the hero photograph.
- `{rounded.sm}` 8px — small chips and the form-input corners (4 captured occurrences).
- `{rounded.md}` 16px — mid-size cards (1 captured occurrence).
- `{rounded.lg}` 20px — secondary cards (3 captured occurrences).
- `{rounded.cta}` 24px — the dominant CTA, segmented-tab, feature-panel, and photo-tile radius (10 captured occurrences). The system's signature corner.
- `{rounded.xl}` 40px — the bottom co-brand CTA panel (1 captured occurrence) — the largest radius on the page, used once for the structural climax.

There is no `9999px` fully-rounded pill anywhere on the marketing surface. The 24px-on-CTA choice is deliberately sub-pill — softer than the 8px traditional-banking radius but stopping short of the neobank pill convention that Monzo, Nubank, and Revolut use.

## Components

**`hero-section`** — Full-bleed photographic canvas, 80×32 padding. No surface fill of its own — the lifestyle photograph carries the band. Holds the hero h1 in white at `{typography.display-xl}` and a saturated-purple CTA pill beneath.

**`hero-heading`** — White `{colors.canvas}` text on the photographic hero, TruthSans 80px / 700. The display tier — confidence by sheer size on photography.

**`section-heading`** — Dark gray `{colors.ink}` text at `{typography.display-md}` (30px / 700) — the section h2s below the fold ("Inspiring stories and helpful information to build your best possible future").

**`panel-heading`** — White `{colors.canvas}` text at `{typography.display-lg}` (40px / 700) — the deep-plum panel headline ("You've got an Ally in every corner") and the bottom co-brand panel headline ("Bank on Buckets.").

**`body-paragraph`** — Default `{colors.ink}` text at `{typography.body-md}` (16px / 400) — the workhorse paragraph style.

**`body-paragraph-large`** — `{colors.ink}` text at `{typography.heading-sm}` (24px / 400) — used for the editorial dek beneath section headings where the page wants the type to lift without going to weight 700.

**`button-primary`** — The signature CTA. Saturated-purple `{colors.primary}` fill, white text, `{rounded.cta}` 24px radius, 8×22 padding, 48px height, weight 600. "Open Account" is the canonical instance. No pill — the 24px corner is the brand's deliberately-sub-pill action shape.

**`button-secondary`** — Transparent fill with dark text and a 1px ink-black `{colors.ink-black}` border. `{rounded.cta}` 24px radius, same 48px height. Used inside the segmented control and for "Learn more" tertiary actions.

**`top-nav`** — White `{colors.canvas}` surface, 60px height, 12×24 padding, 1px `{colors.hairline}` bottom rule. The lowercase "ally" wordmark sits flush left at 14px, product links (Bank / Invest / Auto / Mortgage / Insurance) center, "Open Account" CTA flush right.

**`nav-link`** — Browser-blue `{colors.ink-link}` text in `{typography.nav-link}` (14px / 400), 8×12 padding. The default `#0000ee` is kept rather than restyled — the system trusts the user-agent semantic.

**`segmented-tab`** — Transparent fill, dark text, 1px ink-black border, `{rounded.cta}` 24px radius, 12×24 padding, 48px height. The 3-tab segmented control above the deep-plum panel ("Checking, Money, and Savings" / "Stocks, Bonds, and Funds" / "Different kind of bank").

**`feature-panel`** — Deep plum `{colors.brand-plum}` (#954293) surface, white text, `{rounded.cta}` 24px radius, 32×16 padding. The mid-page chromatic centerpiece — holds the 6-up category grid (Mortgage / Auto / Credit Card / Invest / Robo Portfolios / Money Market) with white card-titles in `{typography.heading-md}` (24px / 700).

**`cta-panel-dark`** — The deepest plum `{colors.brand-plum-deepest}` (#300942) surface, white text, `{rounded.xl}` 40px radius, 80px internal padding. The bottom co-brand CTA panel pairing the Ally wordmark with the Tonal partnership wordmark. The structural climax of the page — used once.

**`card-photo`** — White `{colors.canvas}` surface, `{rounded.cta}` 24px radius, 0 padding (the lifestyle photograph fills the tile edge-to-edge). Used in the 3-up editorial photo-tile grid.

**`text-input`** — White `{colors.canvas}` fill, dark text, 1px `{colors.hairline}` border, `{rounded.sm}` 8px radius, 12×16 padding, 48px height.

## Do's and Don'ts

**Do** treat the two-tier purple voltage as functionally distinct. `{colors.primary}` (#852ef2) is for CTAs and structural accents; `{colors.brand-plum}` (#954293) is for structural type and the feature-panel surface. Collapsing them into a single purple loses the chromatic depth that the deeper plum carries in 87 captured occurrences.

**Do** keep the 24px-rounded geometry on every CTA. The `{rounded.cta}` (24px) corner is the brand's signature action shape — deliberately sub-pill, distinctly softer than traditional-banking 8px corners. Escalating to a 999px pill makes Ally read as a neobank (Monzo, Nubank) instead of an online-but-traditional bank.

**Do** use the lifestyle photography as the hero canvas. The 80px TruthSans weight 700 display only reads as editorial confidence when it's floating over a photograph. Without the photograph, the same display becomes a SaaS shout and undercuts the brand's editorial voice.

**Do** reserve the deepest plum (`{colors.brand-plum-deepest}` — #300942) for the bottom co-brand CTA panel only. The `{component.cta-panel-dark}` is the structural climax of the page; using the deepest plum on a mid-page panel would dilute the single-climax discipline.

**Don't** use the traditional-banking blue (the Chase navy or Citi cobalt) anywhere in the system. Ally's purple is a deliberate positional move against the legacy-bank convention; introducing a blue accent would erase the brand-positioning signal that the entire color system is built to carry.

**Don't** add a 999px fully-rounded pill to the radius scale. The captured page has no pill element — every corner stops at 40px or below. Adding a pill button collapses Ally into the neobank-pill convention and loses the deliberately-sub-pill geometry that separates it from Monzo and Revolut.

**Don't** render the lowercase "ally" wordmark in uppercase or at display size. The brand identity is voice-down — the wordmark sits at 14px in the top-nav even when the hero display is at 80px. Bumping the wordmark up to display size would invert the brand's typographic voice.

**Don't** use the default browser-blue `{colors.ink-link}` (#0000ee) as a body-text color or for non-link emphasis. The system deliberately keeps it as a semantic user-agent link color only; rendering body text in #0000ee creates an accessibility-and-semantic mismatch.

## Known Gaps

- **Form input states:** `{component.text-input}` carries the resting state; error / validation styling is not exposed on the captured marketing surface. The product surfaces likely render error tones in a red that's not captured.
- **Dark mode:** the captured marketing surface is light-only. The deep-purple feature and CTA panels function as inversion bands but there is no full dark variant.
- **Hover and focus states:** the hover treatment on `{component.button-primary}` is not exposed in the captured surface; the focus-ring color is not declared.
- **Motion:** the segmented-tab transitions and the photo-tile hovers have subtle motion but the spec captures end-state values only.
- **Product surfaces:** this DESIGN.md captures the marketing site only. The Ally Banking app, the Ally Invest dashboard, and the Ally Auto financing flow all carry richer token systems that are not represented here.
- **Co-brand pattern:** the bottom CTA panel pairs Ally with Tonal inline; the spec does not document the typographic and lockup rules for other co-brand pairings (Ally has partnerships across auto, mortgage, and home-improvement).
- **Legal-copy typeface:** the Poppins fallback in some legal spans is likely a CMS legacy; the spec keeps TruthSans as the canonical family but doesn't formally retire Poppins.
- **Iconography:** the system uses thin single-stroke line icons inside category cells (a house for Mortgage, a car for Auto, etc.); the icon set is not exposed as named SVGs in the captured marketing surface.
