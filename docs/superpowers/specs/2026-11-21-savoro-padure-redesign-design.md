# Savoro „Pădure” — frontend redesign + full front-end app

Date: 2026-11-21 · Branch: `redesign/padure`

## Why
The user feels the current UI („Cer senin”: baby blue + bubblegum pink, Fraunces italic headlines, bento stats, pills everywhere, torn-receipt card) looks like every AI-generated site. Reference they like: **Wolt** — one confident brand colour used with discipline, a bold friendly sans, photography doing the work, horizontal discovery rows, plain useful copy, very little decoration. We take Wolt's principles, not its blue identity.

User decisions: whole app; new palette = **dark forest green + cream**; keep the local Unsplash photos (credited in README); full redesign; frontend only — new pages/features welcome, but **no backend / no architecture from future labs** (json-server + `src/api.js` stay the data layer).

## Goals
- A product-grade, recognisably *Savoro* look; nothing from the „AI tells” list below.
- Turn the single long page into a small real app (discovery → restaurant → cart/checkout → orders).
- Keep every existing course requirement working (stages 1–8).

## Anti-goals (failure even if it works)
- Serif italic headlines, one coloured/italic word in a headline, ALL-CAPS tracked eyebrow labels, `A · B · C` meta strings, `→` on buttons, bento grids, gradient washes/blurred blobs, identical cards with one radius + one soft shadow everywhere, fade-up on every section.
- Cream page + serif display + terracotta (the #1 AI default). Green must dominate the brand, cream is the paper.
- Invented data presented as real (ratings, review counts, fake addresses).

## Constraints (must keep)
- Routes `/`, `/comenzi/:id`, `/despre`, `*` and their behaviour; list + „Comandă specială” form stay on `/`.
- All `data-testid`s: nav, form, form-title, form-restaurant, form-livrare, form-error, form-submit, empty, item, item-title, item-link, item-toggle, item-delete, not-found, loading, error, detail, detail-title. Delete has no confirm dialog.
- Pure modules (`api.js`, `cos.js`, `validare.js`, `cautare.js`, `categorii.js`, `format.js`, `imagini.js`, `rezumat.js`, `livrare.js`, `constants.js`) keep their exported API; `npm test` (181 tests), `npm run lint`, `npm run build` pass. New pure helpers get `node:test` tests.
- No new npm dependencies (React Router, lucide-react already present). Google Fonts via `<link>` is fine.
- Light + dark theme (stage 5), visible focus, reduced motion, AA contrast, mobile down to 360px.
- Every source line keeps a Romanian end-of-line comment (project style).
- `db.json` schema unchanged.

## Visual system
**Palette** (light)
- `--padure` #133A2B — brand surface: header, hero, primary buttons, active states
- `--padure-2` #1F5440 — hover / secondary green
- `--hartie` #F5EFE2 — page background (paper)
- `--alb` #FFFDF8 — raised surfaces (cards, sheets)
- `--cerneala` #17211B — text; `--sters` #5B6459 — secondary text (check ≥4.5:1 on paper)
- `--sofran` #E9B44C — the *only* warm signal, tiny doses: „Express”, cart count, focus ring on green
- semantic: error uses deep red #B3261E + icon + text (never colour alone)
Dark: page #0E1F17, surfaces #15291F, text #EFE8D8, green surfaces get lighter green #2C6B52 for buttons, saffron unchanged.

**Type** — one family, no serif. First choice **Gabarito** (Google Fonts, 400/600/800); verify it renders Romanian ș ț ă î â (latin-ext). Fallbacks if not: Rethink Sans, then Onest. Scale ~1.25: 14/16/20/25/31/39/61px; headlines weight 800, tight tracking (-0.02em), sentence case. Prices in tabular figures, same family.

**Shape** — hierarchy by radius: photos 18px, sheets/drawers 24px, buttons fully round (pill) only for primary actions, inputs 12px. Shadows only on things that float (drawer, toast, sticky bar). Cards are flat on paper, separated by space, not borders.

**Signature (the one bold thing)** — the forest-green hero/header block: huge cream headline set tight, with the search field inside it, and the dish photos breaking out of the green band's bottom edge into the paper. Everything else is quiet.

**Motion** — only in response to actions (add to cart: count bump; drawer slide; toast). No entrance animations. Respect `prefers-reduced-motion`.

**Copy** — plain, Romanian, sentence case, active verbs („Adaugă în coș”, „Plasează comanda” → toast „Comanda a fost plasată”). Errors say what happened and what to do.

## Information architecture (front-end only)
- `/` Acasă: green hero (headline + search + delivery mode), category row, „Restaurante” row (cards → restaurant page), menu grid (filtered by category/search), then „Comenzile tale” (list with all test ids + „Comandă specială” form + a simple text summary instead of the bento).
- `/restaurante/:slug` (new): restaurant header (photo, name, cuisine, delivery options from `livrare.js`), its dishes from `/meniu` filtered by restaurant, add to cart. Unknown slug → 404 component.
- `/cos` (new): full checkout page — lines, quantities, delivery choice, total, „Plasează comanda” → existing `cosInComenzi` + `createComanda`, then navigate to `/` orders section (or the new order's detail). The drawer stays for quick view and links here.
- `/favorite` (new, optional): favourite dishes in localStorage (try/catch), heart button on dish cards.
- `/comenzi/:id`: redesigned detail with a simple status timeline (placed → on the way → delivered) derived from `livrata` only.
- `/despre`, 404: restyled.
- Restaurant metadata (slug, cuisine, one-line description) lives in a frontend constants module, describing only what is true of the demo (no ratings, no addresses).

## Left to the builder
Component breakdown, exact spacing, which existing components to merge/delete (e.g. `RezumatBento`, `BonComanda`), mobile nav pattern (bottom bar on mobile recommended).
