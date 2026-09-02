# On-Page SEO Checklist (per page)

Enforced by `src/lib/seo/metadata.ts`, the page templates, and `tests/seo.spec.ts`. Use this list when adding a page or article.

## Metadata
- [ ] Unique `<title>` ≤ 60 characters, primary keyword near the front, brand appended by the layout template
- [ ] Meta description 120–158 characters, specific to the page, includes the primary term naturally
- [ ] Absolute canonical to the apex domain (`buildMetadata` sets it; never `*.vercel.app`)
- [ ] Open Graph + Twitter card via `buildMetadata`; route has an `opengraph-image.tsx` or inherits a branded one
- [ ] `robots` index/follow on production; `noindex` on thanks pages and previews

## Structure
- [ ] Exactly one `<h1>` containing the page's promise (not the brand name)
- [ ] Heading order H1 → H2 → H3 with no skipped levels
- [ ] Breadcrumb visible and in `BreadcrumbList` JSON-LD
- [ ] Descriptive URL slug, lowercase, hyphenated, no dates or IDs
- [ ] Main content server-rendered; no SEO-critical text behind client fetches

## Content
- [ ] Direct answer or summary in the first 100 words
- [ ] Primary keyword in H1, first paragraph, and at least one H2, written naturally
- [ ] Secondary terms and entities from `docs/seo/keyword-map.md` present where they fit
- [ ] Body line length ≤ 75 characters; paragraphs 2–4 sentences
- [ ] No forbidden phrases (`pnpm check:placeholders` includes the slop list)
- [ ] Claims traceable to `site.ts` verification or client documentation

## Links
- [ ] ≥ 3 internal links out to cluster siblings using descriptive anchor text
- [ ] ≥ 2 internal links in (page reachable from nav, hub or related-links)
- [ ] External references open in new tab with `rel="noopener noreferrer"`; authoritative sources only

## Structured data
- [ ] `WebPage` + `BreadcrumbList` on every page
- [ ] `Service` on service pages; `Article` on articles; `FAQPage` only where the FAQ is on the page
- [ ] No `Review`, `AggregateRating`, `Award`, or certification claims

## Media
- [ ] Informational images: descriptive alt, explicit width/height, `next/image`
- [ ] Decorative SVGs: `aria-hidden="true"`; diagrams with information: `role="img"` + `<title>`/`<desc>`
- [ ] LCP element not lazy-loaded

## Performance and accessibility
- [ ] No layout shift from fonts (self-hosted, `display: swap`, size-adjusted fallback)
- [ ] All interactive elements keyboard-operable with visible focus
- [ ] Contrast AA on both surface themes
