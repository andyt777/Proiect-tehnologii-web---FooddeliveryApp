# Savoro redesign — „Cinematic + Fresh market + Bento”

Date: 2026-11-03 · Branch: `redesign/cinematic` · Restore point: tag `pre-redesign` (= `8d80687`)

## Intent

Make Savoro look like a 2026 food-delivery product (Glovo / Bolt Food / Wolt level) without losing anything
stages 1–6 require. Warm premium identity: cream, espresso, terracotta, Fraunces + Inter. Not a dark-mode app
(the existing optional dark theme stays).

Direction approved by the user: **A · Cinematic** as the base, plus
- from **B · Fresh market**: photo category cards, quick-add buttons, dish exploration;
- from **C · Night kitchen**: order organisation, delivery indicators, bento grid — in the warm light palette.

## Goals

1. Full-bleed photo hero, large Fraunces headline, the existing receipt (`BonComanda`) on top of the photo.
2. Photo category cards that filter the menu (combined with search).
3. Menu cards with large photos and an add button over the photo (becomes the existing stepper).
4. „Comenzile tale” bento with statistics, all computed from real data.
5. Order list grouped „Pe drum · N” / „Livrate · N”, with photo thumbnails, delivery badge and ETA.
6. Responsive: phone (≤ 640px), tablet (641–1024px), desktop (> 1024px).

## Non-goals / anti-goals

- No routing, no new pages (not required by stages 1–6; may come in a later stage).
- No stage-7+ work: no form, no server persistence, no users.
- No new dependencies, no Tailwind: plain CSS with variables.
- No change to `api.js`, `cos.js`, `cautare.js`, `format.js`, `livrare.js`, `db.json` (no demonstrated need).
- No invented data: every number on screen is derived from `comenzi` / `meniu`. „cheltuiți luna asta” becomes
  „cheltuiți în total” because the data has no dates.
- No fake photos: every photo shows the dish it is attached to. Photos are illustrative stock (Unsplash License),
  credited in the README.
- **The receipt keeps its current look** (tilted paper, zig-zag bottom edge, same content) — user request.

## Constraints

- Every source line keeps a Romanian end-of-line comment (project convention).
- The three states (loading / error / ready) remain in every section; skeletons adapt to the new shapes.
- Accessibility: AA contrast (text over photos sits on a dark gradient), visible focus, labels, full keyboard use,
  `prefers-reduced-motion` respected, existing focus management (add → plus, menu title focus, retry focus) kept.
- Images: local WebP in `frontend/public/img/`, explicit `width`/`height`, `loading="lazy"` below the fold,
  hero via `<picture>` with a 828px mobile and a 1600px desktop file, `fetchpriority="high"`.

## Page structure

1. **Header** — sticky, translucent espresso with backdrop blur (readable over the photo and over cream; no scroll JS).
   Logo, address pill, search (the single search input), theme toggle, cart button. Unchanged behaviour.
2. **Hero** — photo background (`hero-900.webp` / `hero-1600.webp`), dark bottom gradient.
   Eyebrow: restaurant names derived from `meniu` (unique, in order). Title: „Cina ta preferată, *la ușă*.”
   Subtitle derived: „9 produse din 3 restaurante.” Button „Vezi meniul” → same scroll + focus as `handleVeziMeniul`.
   Right column: `BonComanda` unchanged. Loading: skeleton line for eyebrow/subtitle.
3. **„Ce poftești azi?”** — `CategoriiCarduri`: „Toate” + one photo card per `CATEGORII` entry, each with
   „N preparate” counted from the full menu. Buttons with `aria-pressed`; one active at a time; „Toate” = `null`.
4. **Meniu** — photo cards (4:3), name ….. price, restaurant. „Adaugă” pill over the photo bottom-right; stepper
   replaces it while in the cart. Meta: „N din M produse” when search or category narrows the list. The empty
   state names what was filtered (search text and/or category) and its button clears both.
5. **„Comenzile tale”** — `RezumatBento`: big tile „cheltuiți în total” + per-category chips; tile „pe drum”;
   tile „livrate” „X din Y” as visible text + a decorative (`aria-hidden`) progress bar;
   wide tile with per-delivery-type counts using the existing badge colours. Loading: dashes + sr text (as today).
6. **Order list** — single `<ul>`, divider „Pe drum · N” before the first pending order and „Livrate · N” before
   the first delivered one (only when that group is non-empty). Card: photo thumbnail (falls back to the category
   icon), title, restaurant, badge, ETA, price, „Livrată” checkbox, delete. Search filters as today.
7. **Footer** — copyright + „Fotografii: Unsplash” link to the README credits section.

## Photos (in `frontend/public/img/`)

| File | Dish | Photographer | Unsplash page |
|---|---|---|---|
| pizza-margherita.webp, hero-*.webp | Pizza Margherita | Aurélien Lemasson-Théobald | https://unsplash.com/photos/x00CzBt4Dfk |
| pizza-diavola.webp | Pizza Diavola | Alan Hardman | https://unsplash.com/photos/SU1LFoeEUkk |
| pizza-quattro-formaggi.webp | Pizza Quattro Formaggi | Alexey Demidov | https://unsplash.com/photos/MVhg4ecfKBA |
| burger-vita.webp | Burger de vită cu cartofi | Jonathan Borba | https://unsplash.com/photos/8l8Yl2ruUsg |
| burger-pui.webp | Burger cu pui crocant | Tomi Saputra | https://unsplash.com/photos/RjmgHpZPY9w |
| burger-vegetarian.webp | Burger vegetarian | Grooveland Designs | https://unsplash.com/photos/Kjt-sJbgy8I |
| sushi-platou.webp | Platou sushi (12 buc.) | Riccardo Bergamini | https://unsplash.com/photos/O2yNzXdqOu0 |
| ramen-porc.webp | Ramen cu porc | Huyen Bui | https://unsplash.com/photos/NHEL1M1Cv-A |
| gyoza.webp | Gyoza cu legume (6 buc.) | Mikey Frost | https://unsplash.com/photos/klTf2RN37Ts |

Category cards reuse dish photos: Pizza → pizza-diavola, Burgers → burger-vita, Asian → sushi-platou.

## Functionality that must survive (verified with Playwright at the end)

Loading / error / retry; search (Esc, „Șterge căutarea”, sr status); category filter combined with search;
add / stepper / focus moves; cart drawer (quantities, remove, delivery choice, place order → orders + toast);
cart persisted in localStorage; toggle „Livrată” moves the order between groups with the view transition;
delete → confirm dialog → undo toast → order back in place; theme toggle; responsive at 390 / 768 / 1440.

## Left to the builder

Exact spacing, shadows, type scale and motion details, within the palette and the approved mockup.
