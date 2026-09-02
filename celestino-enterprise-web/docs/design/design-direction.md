# Design Direction

Positioning line for the design team: **"Enterprise cyber operations center meets premium technology consultancy."** Every decision below is justified against one question: does it make a security, IT or public-sector buyer trust Celestino more within ten seconds?

## 1. Positioning

Celestino is a small firm that must read as deliberate, not big. The competitive audit (`docs/research/cybersecurity-competitive-audit.md`) shows the national leaders win on scale signals (analyst badges, logos) that Celestino cannot honestly show. The regional benchmark (Ntiva, Dataprise) wins on transparency and clarity. The design therefore optimizes for **precision and evidence** over spectacle: restrained surfaces, engineered typography, one accent color used as a signal, diagrams that explain how the work is done, and gated claims that say "supplied by client" rather than inventing proof.

## 2. Palette

Two surface themes, switched per section, both defined as CSS custom properties in `src/app/globals.css`.

**Dark (operations surfaces)** graphite near-black `#0A0E13` with a blue undertone, layered surfaces `#141C25` → `#1A2430` → `#21303F`, hairline borders `#22303F`. Used for the header, hero, operating model, government band and CTA bands: the parts of the site that talk about control, monitoring and response.

**Light (document surfaces)** off-white `#F5F7FA` with white cards, used for service detail, articles, trust center and forms: the parts a compliance officer reads for twenty minutes.

**Accent** one electric signal blue (`#3D9BFF` on dark, `#0B66C9` on light). It is reserved for the primary CTA, active states, live connections in diagrams and status indicators. A second status green (`#2FD4A4` / `#0F8F6C`) marks "operational" states in diagrams. No purple, no gradients as decoration, no neon borders.

Contrast: all text/background pairs meet WCAG AA at their size; body text pairs exceed 7:1 on dark and 12:1 on light. Muted text is 5.2:1 on dark.

Why: dark reads as security to buyers trained on CrowdStrike, Arctic Wolf and SentinelOne; light reads as document-grade seriousness the way Coalfire and NCC Group present. Using both, on purpose, lets the site be both an operations center and a firm you would hand a compliance binder to.

## 3. Typography

- **Manrope** (variable, 200–800) for headlines: geometric, slightly engineered terminals, reads well at tight tracking.
- **Inter** (variable) for body: the most legible screen sans at 16–17px with long line lengths.
- **JetBrains Mono** for eyebrows, data labels, diagram annotations and table headers: the "instrument panel" voice, used sparingly.

All three are self-hosted (SIL OFL) via `next/font/local` with `display: swap` and size-adjusted fallbacks; total ~113 KB. Fluid scale via `clamp()`: H1 2.6–4.25rem, H2 1.9–2.4rem, body 1–1.0625rem. Body measure capped at 68ch. Headings are not oversized: the hero H1 is the only text above 3rem.

## 4. Layout and grid

12-column grid, 1280px content container (1440px for wide diagram sections), gutters `clamp(1.25rem, 4vw, 2.5rem)`, section rhythm `clamp(4.5rem, 8vw, 8rem)`. Designed at 1440 and verified at 1920, 1280, 1024, 768, 430, 390, 375, 320. Spacing uses the 4px scale only; no bespoke pixel values.

Sections alternate structure deliberately: hero (two-column, visual right), proof strip (single row), capabilities (asymmetric 5-up with one featured), operating model (full-bleed diagram), industries (list, not cards), government (split band), resources (editorial list), CTA (centered, short). No two adjacent sections share the same layout.

## 5. Motion philosophy

Motion is an instrument, not a show. Micro-interactions 160–240 ms, section entrances 600 ms with 14px rise and 60 ms stagger, all transform/opacity. The hero infrastructure graph animates connection pulses along paths (SVG, ~2 KB of script) and tilts subtly with cursor position on pointer devices only. Everything checks `prefers-reduced-motion` and degrades to static; content is never conveyed by motion alone. No parallax, no scroll hijacking, no cursor replacement, no autoplay media, no animation library.

## 6. Iconography

One custom set (`src/components/icons/icon.tsx`): 24px grid, 1.5px stroke, round joins, no fills, ~45 glyphs. Same geometry everywhere, so the mega menu, service pages and diagrams read as one system. No emoji, no mixed libraries.

## 7. Imagery

No stock photography at launch. The visual system is diagrammatic: the layered infrastructure graph (hero), the Assess → Improve operating model, the responsibility matrix, and industry "risk profiles" rendered as data. Photography is reserved for real team and environment images the client supplies; the image component and alt-text policy are ready for them. Decorative images get empty alt; informational images get descriptive alt.

## 8. Interaction

- Mega menu: hover-intent with 120 ms open delay and pointer-leave grace, click/Enter/Space toggle, Escape closes, focus trapped nowhere (menus are disclosure panels), arrow keys move between top-level items, Tab walks the open panel.
- Mobile navigation: full-height panel, grouped accordions, CTA pinned at bottom, body scroll locked, focus moved into panel and restored on close.
- Operating model: six stages; hover/focus/tap reveals the stage's inputs, outputs and evidence. Fully readable without interaction (all stages render their summary).
- Accordions use native `<details>`; tabs are only used where content is genuinely parallel (contact intents).

## 9. Mobile strategy

Mobile is designed, not collapsed. Hero visual becomes a compact static layer stack above the copy; proof strip becomes a two-column list; the operating model becomes a vertical timeline; tables scroll inside their own container; tap targets are ≥ 44px; the header keeps the primary CTA visible at 320px by collapsing its label to "Assessment".

## 10. Accessibility

WCAG 2.2 AA is a build requirement, tested with axe in Playwright and manual keyboard passes. Landmarks, skip link, single H1 per page, logical heading order, visible focus rings (2px accent, 3px offset), 44px targets, labeled form fields with inline errors tied by `aria-describedby`, `aria-expanded`/`aria-controls` on disclosure controls, reduced-motion respected globally.

## 11. What we refuse

Matrix rain, hooded figures, padlock wallpaper, fake dashboards, glass cards, purple gradients, particle clouds, glowing borders, 100px pills, scroll hijacking. The audit found these on a majority of mid-tier security sites; their absence is part of the differentiation.
