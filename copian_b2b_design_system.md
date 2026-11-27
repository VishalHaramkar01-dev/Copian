---
name: "Copian Precision B2B"
description: "A clean, technical, high-trust B2B e-commerce design system for Copian printer consumables, engineered for effortless product discovery, compatibility lookup, and bulk quotation."
---

## Overview

Copian Precision B2B pairs Apple-inspired typographic clarity and generous whitespace with the structured product discovery of modern B2B procurement platforms. Designed for IT procurement managers, print-shop owners, managed print service (MPS) providers, and regional distributors across India, the interface prioritizes scannable part codes, instant printer compatibility verification, and frictionless bulk inquiry building.

The visual language is **Corporate / Modern** with **Minimalist** discipline: crisp white and cool-slate tonal surfaces, authoritative cobalt-navy primary actions, tabular monospaced part numbers, and restrained, purposeful motion.

## Colors

The palette anchors on a deep, trustworthy Cobalt Navy (`#00366B`) for primary procurement actions and active navigation states, supported by cool neutral surfaces (`#F9F9FF` and `#FFFFFF`) that let product photography and technical specifications stand out without visual noise.

- **Primary:** Deep Cobalt Navy (`#00366B`) signals industrial reliability and drives bulk-inquiry conversion.
- **Secondary:** Cool Steel (`#505F78`) supports secondary filters, specifications, and neutral metadata.
- **Semantic Status:** Emerald (`#146C2E`) indicates in-stock / ready-to-dispatch bulk availability; Amber (`#8D4F13`) indicates made-to-order or low-stock MOQ alerts; Crimson (`#BA1A1A`) is reserved strictly for form validation errors.

```yaml
colors:
  success: "#146C2E"
  on-success: "#FFFFFF"
  success-container: "#D3F4D8"
  on-success-container: "#0B461B"
  warning: "#8D4F13"
  on-warning: "#FFFFFF"
  warning-container: "#FFDCC3"
  on-warning-container: "#4D2600"
  light:
    primary: "#00366B"
    on-primary: "#FFFFFF"
    primary-container: "#1B4D89"
    on-primary-container: "#FFFFFF"
    secondary: "#505F78"
    on-secondary: "#FFFFFF"
    secondary-container: "#D1E0FF"
    on-secondary-container: "#1A2940"
    tertiary: "#562B00"
    on-tertiary: "#FFFFFF"
    tertiary-container: "#773E00"
    on-tertiary-container: "#FFDCC3"
    error: "#BA1A1A"
    on-error: "#FFFFFF"
    error-container: "#FFDAD6"
    on-error-container: "#93000A"
    background: "#F9F9FF"
    on-background: "#1A1C20"
    surface: "#F9F9FF"
    surface-dim: "#D9D9DF"
    surface-bright: "#F9F9FF"
    surface-container-lowest: "#FFFFFF"
    surface-container-low: "#F3F3F9"
    surface-container: "#EDEDF3"
    surface-container-high: "#E8E8ED"
    surface-container-highest: "#E2E2E8"
    on-surface: "#1A1C20"
    surface-variant: "#DFE2EE"
    on-surface-variant: "#424750"
    outline: "#737781"
    outline-variant: "#C3C6D1"
    inverse-surface: "#2F3035"
    inverse-on-surface: "#F0F0F6"
    inverse-primary: "#A7C8FF"
    shadow: "#000000"
    scrim: "#000000"
  dark:
    primary: "#A7C8FF"
    on-primary: "#003061"
    primary-container: "#1B4D89"
    on-primary-container: "#FFFFFF"
    secondary: "#B8C7E5"
    on-secondary: "#223148"
    secondary-container: "#384760"
    on-secondary-container: "#EBF1FF"
    tertiary: "#FFB77E"
    on-tertiary: "#4D2600"
    tertiary-container: "#773E00"
    on-tertiary-container: "#FFDCC3"
    error: "#FFB4AB"
    on-error: "#690005"
    error-container: "#93000A"
    on-error-container: "#FFDAD6"
    background: "#111317"
    on-background: "#E2E2E8"
    surface: "#111317"
    surface-dim: "#111317"
    surface-bright: "#37393E"
    surface-container-lowest: "#0C0E12"
    surface-container-low: "#1A1C20"
    surface-container: "#1E2024"
    surface-container-high: "#282A2E"
    surface-container-highest: "#333539"
    on-surface: "#E2E2E8"
    surface-variant: "#424750"
    on-surface-variant: "#C3C6D1"
    outline: "#8D919B"
    outline-variant: "#424750"
    inverse-surface: "#E2E2E8"
    inverse-on-surface: "#2F3035"
    inverse-primary: "#325F9C"
    shadow: "#000000"
    scrim: "#000000"
```

## Typography

A three-role typographic hierarchy built for technical clarity:
- **Wix Madefor Display** (`headline`) gives hero statements and section headings crisp geometric authority.
- **Instrument Sans** (`body`) delivers clean, open-counter legibility across dense product specifications, comparison tables, and procurement forms.
- **Spline Sans Mono** (`mono`) formats SKUs, OEM part numbers, page yields, and GSTIN/MOQ figures with strict `tabular-nums` alignment.

```yaml
typography:
  display-lg:
    fontFamily: "Wix Madefor Display"
    fontSize: 48px
    fontWeight: 700
    lineHeight: 54px
    letterSpacing: -0.75px
  display-lg-mobile:
    fontFamily: "Wix Madefor Display"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 38px
    letterSpacing: -0.4px
  display-md:
    fontFamily: "Wix Madefor Display"
    fontSize: 36px
    fontWeight: 600
    lineHeight: 42px
    letterSpacing: -0.5px
  display-md-mobile:
    fontFamily: "Wix Madefor Display"
    fontSize: 28px
    fontWeight: 600
    lineHeight: 34px
    letterSpacing: -0.25px
  headline-lg:
    fontFamily: "Wix Madefor Display"
    fontSize: 32px
    fontWeight: 600
    lineHeight: 38px
    letterSpacing: -0.25px
  headline-md:
    fontFamily: "Wix Madefor Display"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 30px
    letterSpacing: -0.15px
  headline-sm:
    fontFamily: "Wix Madefor Display"
    fontSize: 20px
    fontWeight: 600
    lineHeight: 26px
    letterSpacing: 0px
  title-lg:
    fontFamily: "Instrument Sans"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0px
  title-md:
    fontFamily: "Instrument Sans"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 22px
    letterSpacing: 0px
  body-lg:
    fontFamily: "Instrument Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  body-md:
    fontFamily: "Instrument Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 21px
    letterSpacing: 0px
  body-sm:
    fontFamily: "Instrument Sans"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0.1px
  label-lg:
    fontFamily: "Instrument Sans"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: "Instrument Sans"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.25px
  label-sm:
    fontFamily: "Instrument Sans"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 14px
    letterSpacing: 0.3px
  mono-md:
    fontFamily: "Spline Sans Mono"
    fontSize: 13px
    fontWeight: 500
    lineHeight: 18px
    letterSpacing: 0px
  mono-sm:
    fontFamily: "Spline Sans Mono"
    fontSize: 11px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.2px
```

## Layout & Spacing

The desktop layout uses a **Fixed-Max-Width Grid** (`max-w-[1280px]` centered with `24px` page margins) built on a 12-column responsive CSS Grid (`gap-6` / `24px` gutters). At `768px` (tablet), 4-column product grids collapse to 2 columns and persistent filter sidebars move into a slide-over drawer. At `375px` (mobile), layouts collapse to a single column with `16px` page margins and `-mobile` display tokens.

A strict `4px` / `8px` base scale governs all internal component padding and page rhythm:

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section: 64px
  page-margin: 24px
```

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy drop shadows:
- Page canvas sits on `surface` (`#F9F9FF`).
- Product cards, specification tables, and inquiry forms sit on `surface-container-lowest` (`#FFFFFF`) framed by a crisp `1px` `outline-variant` (`#C3C6D1`) border.
- Secondary callouts, compatibility finder panels, and table headers step to `surface-container-low` (`#F3F3F9`).
- Modals, mega-menus, and sticky drawers use subtle ambient elevation (`shadow-lg`) paired with a `1px` `outline-variant` border. No glassmorphism or heavy blur effects.

## Shapes

Precision-cut rounded rectangles balance industrial hardware reliability with modern SaaS approachability. Nested containers step their radius down cleanly (`outer - padding`).

```yaml
rounded:
  sm: 6px
  DEFAULT: 8px
  md: 12px
  lg: 16px
  xl: 20px
  full: 9999px
```

## Motion & Micro-interaction

Motion is crisp, mechanical, and restrained. Interactive controls (buttons, tabs, quantity steppers) respond within `100ms`; drawers, mega-menus, and modals decelerate smoothly over `220ms`. Only `transform`, `opacity`, and color properties animate, honoring `prefers-reduced-motion`.

```yaml
motion:
  state-change:
    duration: 100ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 220ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-exit:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```

## Voice & Content Strategy

- **Tone of voice:** Direct, knowledgeable, and procurement-focused. Speak to technical reliability and bulk fulfillment without marketing fluff (e.g., *"Verified yield for high-volume enterprise fleets"* rather than *"Elevate your printing journey"*).
- **Capitalisation:** Sentence case for headings, form labels, and table headers; Title Case for brand/product names and primary navigation links.
- **Terminology:** Consistently use **"Inquiry Cart"** (never "Shopping Bag" or "Checkout"), **"Bulk Quotation"** (never "Order Now"), **"MOQ"** (Minimum Order Quantity), and **"OEM Equivalent"** for compatibility references.
- **Button and action labels:** Verb-first, outcome-specific (`Add to Inquiry`, `Request Bulk Quote`, `Find Compatible Supplies`, `Download Spec Sheet`).
- **Numbers & units:** Use `tabular-nums` for all SKUs, page yields (`12,000 pages`), MOQs (`10 units`), and cart counts.

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Badge** → `@components/badge.html` — `badge-numeric`, `badge-dot`
- **Button** → `@components/button.html` — `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html` — `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Input Field** → `@components/input-field.html` — `input-field-text`, `input-field-icon`
- **Table** → `@components/table.html` — `table-standard`, `table-interactive`, `table-selectable`
