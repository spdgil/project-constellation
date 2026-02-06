# Cursor Package README

This folder contains the core documents for building the Project Constellation prototype in Cursor.

## Files
- `PRD_Project_Constellation.md` — product requirements and prototype scope
- `DESIGN_SYSTEM.md` — design language (source of truth)
- `narrative_Project_Constellation.md` — About page narrative + living context
- 'GW3MetsDiversificationStrategy_DigitalFinal04.09.24.pdf' - Content for prototype LGAs

## Build approach
Start from `PRD.md` and implement in the “Build order (Cursor friendly)” section.

## Note on source material
The Greater Whitsunday example in `PRD.md` is derived only from the PDF supplied alongside these docs.

## Accessibility (done)
- **Skip to content:** Skip-to-main-content link is the first focusable element; targets `#main-content`; visible on focus (DESIGN_SYSTEM.md).
- **Focus states:** Visible focus rings on all interactive elements (links, buttons, inputs, selects, textareas, custom focusable) via `focus-visible` and global CSS; accent colour `#7A6B5A`, 2px inner + 4px outer ring.
- **Tab order:** Logical DOM order (skip → header nav → main → footer); Deal drawer uses focus trap so Tab/Shift+Tab cycle within the dialog when open.
- **Escape closes overlays:** Deal drawer and LGA detail panel close on Escape; deal search clears/resets on Escape where applicable.
- **Reduced motion:** `prefers-reduced-motion: reduce` respected in `globals.css`; animations and transitions reduced to minimal duration (0.01ms) so motion is effectively disabled.
- **Tests:** Layout test asserts skip link is first focusable and main has `id="main-content"`; DealDrawer tests Escape and focus trap (Tab from last focusable wraps to first); LgaDetailPanel test asserts Escape calls onClose.
