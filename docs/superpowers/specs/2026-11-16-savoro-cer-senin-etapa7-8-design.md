# Savoro — paleta „Cer senin”, Etapa 7 și Etapa 8

Date: 2026-11-16 · Base: branch `redesign/cinematic` (`9036459`, not pushed; `main` = `8d80687` = `origin/main`)
Guides: `TW_Etapa7_Ghid.pdf` (form and validation), `TW_Etapa8_Ghid.pdf` (routing and CSS Modules).

## Intent and why

Savoro must look like a sellable 2026 food-delivery product (Wolt / Glovo / Uber Eats level) **and** pass the
course's automated checker for stages 7 and 8. The user works in lab sessions, so every part must be finishable
quickly: reuse the existing cinematic redesign, change looks through CSS variables, follow the guides closely.

## Three parts, in this order (each with its own commits; local only, push when the user says)

1. **Re-skin „Cer senin”** on `redesign/cinematic`, commit `Redesign: Cer senin palette`, then fast-forward
   `main` to that branch (`git merge --ff-only redesign/cinematic` on `main`).
2. **Stage 7** on `main`: `Stage 7: form and validation`, then `Stage 7: checklist`.
3. **Stage 8** on `main`: `Stage 8: routing and detail page`, then `Stage 8: checklist`.

Doing the palette before stage 8 means the CSS Modules move carries the new look; the palette lives only in
`:root` tokens, which stage 8 keeps in `index.css` unchanged.

## Approaches considered

- **A · keep the cinematic structure, re-skin via tokens + fonts (chosen).** About one lab session; survives
  stage 8 untouched.
- B · new airy layout designed for pastels. More coherent, several hours, and stage 8 would make us move all
  that new CSS into modules anyway. Rejected for time.

Palette variants shown in the browser: A „Cer senin” (chosen), B „Bubblegum” (pink dominant, Playfair italic),
C „Alb pur” (white, gradient hero, Instrument Serif). Stage 7 form: „Comandă specială” (chosen) vs a TaskFlow-style
form with a user-typed price (rejected: customers don't set prices).

## Part 1 — „Cer senin” palette

- Light theme tokens: page `#ffffff`, soft surfaces baby blue `#eaf6fd` / `#f4fafe`, lines `#dceffa` / `#bfe3f7`,
  brand baby blue `#89cff0` (decor, fills, progress), header/hero ink navy `#0f3a5c`, text `#172033`,
  bubblegum `#ffb3d4` / soft `#ffe1ef` (chips, badges, highlights), action pink `#d02a73` (buttons, prices,
  focus, active states — white on it passes AA), pink text on soft pink `#a3195a`.
- Bubblegum `#ffb3d4` is never a background under white text (fails AA).
- Hero keeps the full-bleed photo; the dark gradient becomes navy (`rgba(15,58,92,…)`). Header: light baby-blue
  translucent bar with navy text (no longer espresso).
- Fonts: titles, logo and prices in **Fraunces italic 600** (already loaded; only the italic axis is used for
  display). Body stays Inter upright — long italic text reads poorly.
- Delivery badges (express / standard / ridicare) and the „livrată” state get colours from the new palette
  with AA contrast; the receipt (`BonComanda`) keeps its shape, only its colours follow the tokens.
- Dark theme stays: navy background (`#0b1a2b`-ish), baby-blue and pink accents lightened for AA. Builder's call
  on exact values.

## Part 2 — Stage 7: form and validation (resource `comenzi`)

**`tw.json`** (repo root):
`{ "resource": "comenzi", "title": "preparat", "done": "livrata", "sample": { "restaurant": "Pizzeria Napoli", "livrare": "standard" } }`

**`api.js`**: a common `request(path, options)` (JSON header, `res.ok` check, 204 → `null`) that keeps today's
timeout and the friendly „Serverul nu poate fi contactat” mapping. Functions: `fetchComenzi`, `fetchMeniu`,
`createComanda`, `updateComanda(id, changes)` (PATCH), `deleteComanda(id)`. `fetch` stays only in `api.js`.

**`ComandaForm.jsx`** — „Comandă specială”: the customer asks a restaurant for a dish that isn't on the menu.
- Fields (controlled, `value` + `onChange`): `preparat` text (`data-testid="form-title"`), `restaurant` select
  (`form-restaurant`, the 3 real restaurants), `livrare` select (`form-livrare`: express / standard / ridicare).
  Option `value`s are exactly what is stored (`"Pizzeria Napoli"`, `"standard"`), so the checker's `sample` fits.
- Validation in code (`noValidate`), message in the page (`form-error`), never `alert`: preparat required,
  max 60 characters; restaurant and livrare must be one of the fixed values. Validation lives in a pure function
  so it can be unit-tested.
- Submit: `preventDefault`, button disabled and „Se trimite…” while sending (`form-submit`), fields cleared
  only after the server confirmed, text kept on failure, error from the server shown in `form-error`.
- Object sent (no id): `{ preparat, restaurant, livrare, categorie, livrata: false, pret: null, speciala: true, creata: <ISO date> }`.
  `categorie` derives from the restaurant (Napoli → Pizza, Burger Van → Burgers, Sushi Kyo → Asian).
  No invented price: cards, receipt and detail show „Preț la confirmare”; totals in the bento ignore `null`.
- Fixed values (restaurants with their category, delivery types) in `src/constants.js` (stage 8 asks for it;
  creating it now is harmless).

**Server first, then state** for every change:
- add: `handleAdd` awaits `createComanda`, appends the server's object; does not catch (error goes back to the form).
- toggle „Livrată”: PATCH `{ livrata }`, replace with the returned object; error → page error, list stays.
- delete: DELETE, then remove; undo (toast „Anulează”) re-POSTs the deleted order **with its old id**
  (json-server 0.17 accepts it), so it comes back identical and in place.
- placing an order from the cart: POST each cart line (as today's `cosInComenzi` builds it, without id).
  Lines that saved are added and removed from the cart; lines that failed stay in the cart and the drawer shows
  the error. New cart orders also get `creata`.

**Layout:** in „Comenzile tale”, under the bento: form panel left (1fr), order list right (2fr); stacked on phones.

**`data-testid`** exactly as table 7.3: `item` (li, `data-id`), `item-title`, `item-toggle`, `item-delete`,
`empty`, `form`, `form-title`, `form-restaurant`, `form-livrare`, `form-submit`, `form-error`, `loading`
(orders loading message), `error` (page error).

**Delete confirmation — open question for the user** (see bottom).

Also: README „Stage 7” section + status, `ai-log/etapa-07.md`, checklist table S7-R1…R8 with permalinks.

## Part 3 — Stage 8: routing and detail page

- `npm install react-router-dom` (required by the guide), `BrowserRouter` in `main.jsx`.
- Routes in `App.jsx` only: `/` → `ComenziPage` (today's whole page: hero, categories, menu, bento, form, orders),
  `/comenzi/:id` → `ComandaDetaliuPage`, `/despre` → `DesprePage`, `*` → `NotFoundPage`, all inside `Layout`.
- **Layout** (shared): logo, nav (`data-testid="nav"`, `NavLink` „Comenzi” with `end`, „Despre”), theme toggle,
  footer with photo credits link. **Search and the cart button stay with `ComenziPage`** (their state lives there)
  in a sticky bar right under the header; other pages don't show them.
- Card title becomes `<Link to="/comenzi/:id" data-testid="item-link">` inside the `h3 data-testid="item-title"`.
- **Detail page** (`data-testid="detail"`, `detail-title`, `loading`, `error`): fetches `/comenzi/:id` via
  `fetchComanda(id)`. Shows more than the card: large dish photo (or category icon), restaurant, category,
  delivery type + estimated time, status, price or „Preț la confirmare”, „Comandă specială” tag, placed date when
  `creata` exists, id; link back. `/comenzi/999` → error message from `request()`.
- **Despre**: what Savoro is, stack, photo credits (Unsplash). **NotFound**: `data-testid="not-found"`, link home.
- **CSS Modules**: `App.css` → `index.css` with only tokens, reset, body, shared classes (`.panel`, `.btn`,
  `.btn-danger`, `.info`, `.error`, `.badge-*`, `.sr-only`, skeleton keyframes, view-transition rules, focus).
  Every component and page gets its `X.module.css`; theme selectors inside modules via `:global([data-theme=…])`.
- README „Stage 8” section + status, `ai-log/etapa-08.md`, checklist S8-R1…R8.

## Must survive (from stages 1–6 and the redesign)

Three states (loading / error / ready) with skeletons; search (Esc, clear, sr status) and category filter; add /
stepper / focus moves; cart drawer and localStorage; view transitions; theme toggle; responsive 390 / 768 / 1440;
Romanian end-of-line comment on every source line; no invented data; no new deps except `react-router-dom`.

## Verification

`npm run lint`, `npm test` (node:test; add tests for form validation, `request`, category-from-restaurant),
`npm run build`; Playwright (step-by-step tools only) runs the guides' manual checks: empty submit sends nothing,
add survives reload, toggle/delete survive reload, API stopped keeps text, nav without reload, `/comenzi/1`
refresh, `/comenzi/999`, `/ceva` → 404, testid queries in the console. json-server must be running on 3001.

## Checker facts and housekeeping (decided)

- Guides live one folder above the repo: `C:\Users\ASUS\OneDrive\Tehnologii web\TW_Etapa7_Ghid.pdf` / `TW_Etapa8_Ghid.pdf`.
  `item-toggle` is the checkbox (`<input type="checkbox">`), `item` is the `<li>` with `data-id`. The grouped list
  stays one `<ul>`; the „Pe drum / Livrate” dividers are `<li>` without `data-testid`. `empty` only when there are
  no orders at all; `loading` only while orders load. The checker runs on `npm run build` + `npm run api`.
- `db.json`: json-server writes every change into `frontend/db.json`. After manual/Playwright checks, restore it with
  `git checkout -- frontend/db.json` before each commit. `tests/db.test.js` is relaxed so `pret` may be `null`
  and `speciala` (boolean) / `creata` (ISO string) are optional.
- Checklist permalinks use the local SHA of the matching „Stage N: …” commit (`blob/<sha>/…#Lx-Ly`). No rebase or
  amend afterwards, so the links resolve once the user pushes.
- Moving `main` (fast-forward to the re-skinned redesign) is part of the approved plan; no push.

## Non-goals

No users/auth, no own backend (stage 9), no Tailwind, no page beyond the four routes, no price input.

## Left to the builder

Exact token shades for the dark theme, spacing and motion; how CSS rules split between modules; test layout.

## Delete confirmation (decided by the user, 2026-11-16)

The checker clicks `item-delete` and expects the order to be gone, so `ConfirmDialog` is removed: delete happens
immediately (server first), and the 5-second „Anulează” toast protects against mistakes (the Gmail pattern).
README's stage-5 extras line about the dialog is updated to say it was replaced in stage 7 and why.
