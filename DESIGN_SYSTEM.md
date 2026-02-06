# Relational Design Language — Design System

## Philosophy

**Calm, Contemplative, Clarity.**

This design prioritises clarity and calm over visual excitement. It creates space for thoughtful reflection rather than demanding attention. The aesthetic goal is to feel like a well-crafted journal — sophisticated but approachable, precise but warm.

### Emotional Goals

When using this application, users should feel:

- **Calm** — unhurried, no visual noise
- **Clear** — easy to parse, obvious hierarchy
- **Grounded** — trustworthy, professional, stable

---

## Design Principles

### 1. Quietude Over Loudness

- Muted colour palette
- Soft black text (not pure #000)
- Subtle borders (barely visible)
- No shadows except minimal on tooltips
- No gradients

### 2. Earned Complexity

- Progressive disclosure
- Minimal initial UI surface
- Details appear on interaction, not by default
- Avoid overwhelming with options

### 3. Warmth Through Restraint

- Cream backgrounds (not sterile white)
- Serif typography for headings (Newsreader)
- Generous whitespace
- Let content breathe

### 4. Honest Feedback

- Proportional hover/focus states
- Semantic colour use (not decorative)
- Simple loading indicators
- Clear action affordances

### 5. Accessibility as Foundation

- Skip-to-content link
- Minimum 4.5:1 contrast ratios
- Respect `prefers-reduced-motion`
- Semantic HTML structure
- Visible focus indicators on all interactive elements

---

## Colour Palette

### Foundation Colours

| Token           | Hex       | Usage                              |
| --------------- | --------- | ---------------------------------- |
| `bg`            | `#FAF9F7` | Primary background (warm cream)    |
| `bg-subtle`     | `#F5F3F0` | Secondary backgrounds, hover states |
| `bg-card`       | `#FFFFFF` | Cards, elevated surfaces           |
| `text`          | `#2C2C2C` | Primary text (soft black)          |
| `text-secondary`| `#6B6B6B` | Supporting text, labels            |
| `text-tertiary` | `#9A9A9A` | Disabled states, metadata          |
| `border`        | `#E8E6E3` | Primary borders (barely visible)   |
| `border-subtle` | `#F0EEEB` | Subtle dividers                    |
| `accent`        | `#7A6B5A` | Accent colour (warm taupe)         |

### Semantic State Colours

| State   | Colour    | Usage                    |
| ------- | --------- | ------------------------ |
| Focus   | `#7A6B5A` | Focus rings (accent)     |
| Error   | `#B54A4A` | Error states (muted red) |
| Success | `#4A7A5A` | Success states (muted green) |

### Monochromatic Tinting

Used for status badges, chips, and stepper nodes. Each colour family uses a light wash background with a darker text of the same hue, following the formula:

```
bg-{colour}-50  text-{colour}-700  border border-{colour}-200
```

#### Colour Families

| Family   | Background   | Text         | Border       | Semantic meaning         |
| -------- | ------------ | ------------ | ------------ | ------------------------ |
| Amber    | `amber-50`   | `amber-700`  | `amber-200`  | Early stage, caution     |
| Blue     | `blue-50`    | `blue-700`   | `blue-200`   | Mid stage, in progress   |
| Violet   | `violet-50`  | `violet-700` | `violet-200` | Structuring, distinctive |
| Emerald  | `emerald-50` | `emerald-700`| `emerald-200`| Advanced, positive       |

#### Stage-to-Colour Mapping

| Deal Stage          | Colour  |
| ------------------- | ------- |
| Definition          | Amber   |
| Pre-feasibility     | Amber   |
| Feasibility         | Blue    |
| Structuring         | Violet  |
| Transaction Close   | Emerald |

#### Readiness-to-Colour Mapping

| Readiness State                      | Colour         |
| ------------------------------------ | -------------- |
| No viable projects                   | Neutral (grey) |
| Conceptual interest                  | Amber          |
| Feasibility underway                 | Amber          |
| Structurable but stalled             | Blue           |
| Investable with minor intervention   | Emerald        |
| Scaled and replicable                | Emerald (dark) |

#### Usage Guidance

- Use for **badges, chips, and stepper nodes only** — never for large background fills
- All mappings are centralised in `lib/stage-colours.ts` — import from there
- For stepper nodes, use the stronger `-100` / `-400` / `-800` variant for visibility at small sizes

### Sankey Diagram Colours

| Layer         | Colour       | Hex       |
| ------------- | ------------ | --------- |
| Principles    | Warm taupe   | `#7A6B5A` |
| Instruments   | Muted slate  | `#64748B` |
| Capital Types | Sage green   | `#6B8E7A` |

Link colours derive from source/target node colours with reduced opacity.

---

## Typography

### Font Families

- **Display/Headings:** `'Newsreader', Georgia, serif`
- **Body/UI:** System sans-serif stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)

### Type Scale

| Element         | Size                              | Weight | Font       | Line Height |
| --------------- | --------------------------------- | ------ | ---------- | ----------- |
| Page heading    | `text-2xl` (24px)                 | 400    | Newsreader | 1.3         |
| Section heading | `text-lg` (18px)                  | 400    | Newsreader | 1.4         |
| Body            | `text-sm` (14px)                  | 400    | System     | 1.6         |
| Small/Caption   | `text-xs` (12px)                  | 400    | System     | 1.5         |
| Label           | `text-[10px]` uppercase tracking-wider | 500    | System     | 1.4         |

### Typography Rules

- Headings use Newsreader (serif) for warmth
- Body text uses system sans-serif for readability
- Labels are uppercase with wide letter-spacing
- No bold headings — use font weight 400 (regular)
- Line heights are generous (1.5–1.6 for body)

---

## Spacing System

### Base Unit

The spacing system uses Tailwind's default scale with preference for generous spacing.

### Common Patterns

| Context              | Spacing            |
| -------------------- | ------------------ |
| Section spacing      | `py-12` to `py-16` |
| Card padding         | `p-5` to `p-6`     |
| Component gaps       | `gap-3` to `gap-4` |
| Inline element gaps  | `gap-2`            |
| Text block margins   | `mt-1` to `mt-2`   |

### Whitespace Philosophy

- Wide margins between sections
- Tall padding within containers
- Let content breathe — negative space is content

---

## Layout Patterns

### Container Widths

- Maximum content width: `max-w-screen-2xl` (1536px)
- Narrower content: `max-w-4xl` for text-heavy areas

### Page Structure

```
┌─────────────────────────────────────────────────┐
│ Header (cream bg, border-bottom)                │
├──────────┬─────────────────────┬────────────────┤
│ Left     │ Main Content        │ Right Panel    │
│ Rail     │ (Sankey Diagram)    │ (Details)      │
│ (Filters)│                     │                │
├──────────┴─────────────────────┴────────────────┤
│ Footer (cream bg, border-top)                   │
└─────────────────────────────────────────────────┘
```

### Rail Widths

- Left rail: `w-64` (256px)
- Right panel: `w-80` (320px) when visible

---

## Component Patterns

### Visual Rules (Apply Everywhere)

- **Square corners** on all elements (no `rounded-*`)
- **No shadows** except minimal on tooltips
- **Transitions:** `duration-300 ease-out` on all interactive elements
- **Borders:** Use `border-[#E8E6E3]` (barely visible)

### Buttons

**Default (Secondary)**
```css
bg-transparent
border border-[#E8E6E3]
text-[#2C2C2C]
hover:border-[#9A9A9A]
transition duration-300 ease-out
```

**Primary**
```css
bg-[#2C2C2C]
text-[#FAF9F7]
hover:bg-[#3C3C3C]
transition duration-300 ease-out
```

**Text/Link**
```css
text-[#7A6B5A]
hover:text-[#5A4B3A]
underline-offset-2
```

### Cards

```css
bg-white
border border-[#E8E6E3]
hover:border-[#9A9A9A]
transition duration-300 ease-out
/* No border-radius, no shadow */
```

### Form Inputs

```css
bg-white
border border-[#E8E6E3]
text-[#2C2C2C]
placeholder:text-[#9A9A9A]
focus:border-[#7A6B5A]
focus:ring-1 focus:ring-[#7A6B5A]
transition duration-300 ease-out
/* No border-radius */
```

### Checkboxes

```css
h-4 w-4
border border-[#E8E6E3]
text-[#7A6B5A]
focus:ring-[#7A6B5A]
/* Square, not rounded */
```

### Navigation/Links

- Use underlines for text links (not colour alone)
- Current/active state: text-[#2C2C2C] with underline
- Inactive: text-[#6B6B6B]

---

## Motion & Animation

### Default Transition

```css
transition: all 0.3s ease-out;
```

### Animation Patterns

| Pattern     | Duration | Easing   | Usage                    |
| ----------- | -------- | -------- | ------------------------ |
| Hover       | 300ms    | ease-out | Buttons, cards, links    |
| Focus       | 200ms    | ease-out | Form elements            |
| Fade in     | 300ms    | ease-out | Panels, tooltips         |
| Selection   | 300ms    | ease-out | Sankey highlights        |

### Reduced Motion

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Accessibility Standards

### Contrast Requirements

- Body text: minimum 4.5:1 against background
- Large text (18px+): minimum 3:1
- Interactive elements: minimum 3:1 for borders/icons

### Focus States

All interactive elements must have visible focus indicators:

```css
focus:outline-none
focus:ring-2
focus:ring-[#7A6B5A]
focus:ring-offset-2
focus:ring-offset-[#FAF9F7]
```

### Skip Link

First focusable element in the page:

```html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>
```

### Keyboard Navigation

- All interactive elements reachable via Tab
- Logical focus order (left-to-right, top-to-bottom)
- Escape closes modals/panels

---

## Iconography

### Icon Library

Use **Lucide React** icons (stroke-based, consistent weight).

### Icon Styling

```css
stroke-width: 1.5
color: currentColor (inherits text colour)
```

### Size Scale

| Context      | Size   |
| ------------ | ------ |
| Inline       | 16px   |
| Button       | 18px   |
| Navigation   | 20px   |
| Decorative   | 24px+  |

---

## Data Visualisation

### Sankey Diagram Specifics

**Node Colours by Layer:**
- Principles: `#7A6B5A` (warm taupe)
- Instruments: `#64748B` (muted slate)
- Capital Types: `#6B8E7A` (sage green)

**Link Opacity:**
| State       | Opacity |
| ----------- | ------- |
| Default     | 0.25    |
| Highlighted | 0.50    |
| Dimmed      | 0.08    |

**Selection Indicator:**
- Use accent colour (`#7A6B5A`) for selection ring
- 2px stroke width

**Node Labels:**
- Use system sans-serif at 11px
- Colour: `#2C2C2C`

### Legends

- Position: top-right or bottom of visualisation
- Minimal chrome — just colour swatches and labels
- Use the semantic layer colours

---

## Voice & Tone

### Language

- British English spelling (colour, visualising, centre)
- Warm but professional
- Clear and direct
- No exclamation marks
- No jargon without explanation

### UI Copy Patterns

| Context        | Example                                      |
| -------------- | -------------------------------------------- |
| Empty state    | "Select a node or link to view details"      |
| Filter status  | "Showing 3 of 4 direct pathways"             |
| Action         | "Clear selection" (not "Clear!")             |
| Tooltip        | "P1 · GHG Emission Reduction · 2 pathways"   |

### Information Hierarchy

1. What it is (label)
2. What it means (context)
3. How to act (if applicable)

---

## Family Recognition Markers

These elements ensure consistency across all applications in this family:

1. **Logo placement:** Top-left, minimal
2. **Newsreader headings:** Serif for all display text
3. **Cream background:** `#FAF9F7` as base
4. **Taupe accent:** `#7A6B5A` for interactive elements
5. **Square corners:** No border-radius anywhere
6. **Generous whitespace:** Wide margins, tall padding
7. **Underline navigation:** Links use underlines
8. **Minimal footer:** Just essential info, cream background

---

## Design Decision Framework

When making new design decisions, evaluate against these questions:

1. **Does it maintain calm?** Avoid visual noise, animation, bright colours
2. **Is it honest?** Don't use decoration to hide poor UX
3. **Does it earn its complexity?** Progressive disclosure over upfront density
4. **Is it accessible?** Contrast, focus states, keyboard nav
5. **Does it feel like the family?** Cream, taupe, serif headings, square corners

If a decision fails any of these, reconsider.
