# Savoro

Savoro is a food delivery tracker: customers keep a list of their orders,
see which ones are still on the way and mark them as delivered.

## Data model

Since stage 9 the data is served by our own Express server (`backend/`), kept in memory and seeded
at every start from `backend/src/data/seed.json` (the former `frontend/db.json`, stages 6–8):
`comenzi` holds the orders described below, `meniu` the 9 dishes that can be added to the cart
(`id` "p1".."p9", `preparat`, `restaurant`, `categorie`, `pret`).

| Field      | In code (`seed.json` → `comenzi`) | Type   | Notes                                    |
| ---------- | ---------------------- | ------------ | ------------------------------------------------ |
| id         | `id`                   | number       | unique; set by the server (max + 1, never reused; stages 7–8: json-server) |
| name       | `preparat`             | text         | the ordered dish, required, max 100 chars        |
| delivered  | `livrata`              | boolean      | toggled from the list, default false             |
| delivery   | `livrare`              | fixed values | Standard, Express, Pickup (`LIVRARI`)            |
| category   | `categorie`            | relation     | Pizza, Burgers, Asian (`CATEGORII`)              |
| user       | (not yet)              | relation     | the customer who placed the order (from week 11) |
| restaurant | `restaurant`           | text         | extra field, where the order comes from          |
| price      | `pret`                 | number / null | in lei, positive; `null` only for a special order (price set by the restaurant) |
| special    | `speciala`             | boolean      | optional, stage 7: true for orders from the "Comandă specială" form |
| created    | `creata`               | text (ISO)   | optional, stage 7: when the order was sent (form and cart) |

Sample data used across all stages:

1. Pizza Margherita, active, Express, Pizzeria Napoli, 42 lei
2. Beef burger with fries, done, Standard, Burger Van, 48 lei
3. Sushi set (12 pcs), active, Pickup, Sushi Kyo, 65 lei

`seed.json` adds three more (ramen, 2 × Pizza Diavola, veggie burger), so there are 6 orders.

## How to run

Two terminals: the backend keeps running, so it needs its own terminal.

Terminal 1, the backend (Express) at http://localhost:3001:

```
cd backend
npm install
npm run dev
```

Terminal 2, the app at http://localhost:5173:

```
cd frontend
npm install
npm run dev
```

Then open the address printed in terminal 2 (pages: `/`, `/restaurante/sushi-kyo`, `/cos`, `/favorite`, `/comenzi/1`, `/despre`). Without the backend the page shows an error
with a "Încearcă din nou" button. `npm test` runs the unit tests in each folder (no server needed: the backend
tests start the app on a free port themselves). `npm run dev` restarts the backend when a file changes
(`node --watch`); `npm start` runs it without watching. Every restart brings the data back to `seed.json`.

Optional settings for the backend (see `backend/.env.example`): `PORT` (default 3001) and `CORS_ORIGIN`
(default `http://localhost:5173`). Node does not read the example file by itself; set them in the shell if needed.

## Stage 9: own backend

json-server is gone: the frontend now talks to our own server, written with Express 5 in `backend/`.
`frontend/db.json`, the `api` script and the `json-server` dependency were removed; the data moved to
`backend/src/data/seed.json`. The data lives in memory (arrays + `nextId`) and resets on every restart;
stage 10 moves it to MariaDB.

```
backend/
  package.json        "type": "module", scripts start / dev / test, express ^5 + cors
  .env.example        PORT=3001, CORS_ORIGIN=http://localhost:5173
  src/server.js       only app.listen(PORT)
  src/app.js          cors, express.json(), GET /health, the five routers, 404, central error handler
  src/validation.js   entry point for the validators in src/validation/ (one per resource)
  src/routes/         one express.Router per resource
  src/reguli/         domain rules: comenzi.js (Order Management), stari.js (order lifecycle), plata.js (Payment),
                      livrare.js (Delivery & Dispatch), restaurant.js (Restaurant / Catalog)
  src/idempotenta.js  Idempotency-Key registry for POST /comenzi
  src/data/           seed.json, the in-memory store and a small collection helper
  tests/              node:test + fetch against app.listen(0)
```

REST routes (all answers are JSON; every error is `{ "error": "..." }` in Romanian):

| Resource | Id | Routes | Used by the frontend for |
| -------- | -- | ------ | ------------------------ |
| `/comenzi` (tw.json) | number, set by the server | GET list, GET `/:id`, POST, PATCH `/:id`, DELETE `/:id` | list, detail, special order, cart, toggle, undo, role panels |
| `/meniu` | text ("p10"), set by the server | GET list, GET `/:id`, POST, PATCH `/:id`, DELETE `/:id` | menu, restaurant menu admin |
| `/livratori` | number, set by the server | GET list, GET `/:id`, POST, PATCH `/:id`, DELETE `/:id` | courier panel, admin couriers |
| `/recenzii` | number, set by the server | GET list, GET `/:id`, POST, PATCH `/:id`, DELETE `/:id` | reviews after delivery |
| `/restaurante` | the restaurant slug, sent by the client | GET list, GET `/:id`, POST, PUT `/:id`, PATCH `/:id`, DELETE `/:id` | restaurant profile and opening hours |

Status codes: 200 read / modify, 201 POST, 204 DELETE (no body), 400 invalid data, invalid id or malformed
JSON ("Corpul cererii nu este JSON valid"), 404 missing element ("Comanda nu există", "Preparatul nu
există", ...) or unknown route ("Ruta nu există"), 409 for a conflict (second review of an order, a profile
that already exists, deleting a courier with an active trip), 500 "Eroare internă" (details only in the
server log).

- **Server-side validation, as a whitelist.** Every validator returns `{ erori, date }`; only known fields,
  cleaned (trimmed text, phone without separators), are stored. Unknown fields and a client-sent `id` are
  ignored. PATCH uses the same validator with `partial: true` (only the sent fields, no defaults). The fixed
  values are the frontend's (`constants.js`, `livrare.js`, `stari.js`, `cupoane.js`, `meniuAdmin.js`, ...),
  copied into `backend/src/constants.js`; `frontend/tests/backendConstante.test.js` fails if they drift apart
- **The frontend does not decide what is valid.** Enum fields (`livrare`, `stare`, `livrareStare`,
  `plata.metoda` / `plata.stare`, `cupon`) are checked on the server. For a dish from the menu
  ("Pizza Diavola × 2") the server sets `pret` (menu price × quantity) and `categorie`, ignoring the client's
  price; anything else is a special order (`speciala: true`, `pret: null` until the restaurant accepts it).
  A review needs a delivered, existing order and takes its restaurant from the order. The order state
  machine is also enforced on the server (see "Server-side rules" below)
- **Minimal order.** `{ preparat, livrata, restaurant, livrare }` (the checker's POST) is enough: the server fills
  `stare: "plasata"`, `plata`, `livrareStare`, `istoric`, `creata` and the other fields with the same defaults
  the frontend uses (`campuriInitiale` in `stari.js`)
- **CORS** allows only `CORS_ORIGIN` (default `http://localhost:5173`), so the Vite app can call port 3001
- **Undo** used to re-POST the deleted order with its old id (json-server kept it). The server now always sets
  the id, so "Anulează" sends the order without `id` and puts the returned object (new id) back in its place
- `api.js`: on an error, `request()` reads `{ error }` from the body and shows the server's message (fallback
  "Eroare server: <code>"), so `/comenzi/999` now shows "Comanda nu există"
- tests: `backend/tests/*.test.js` (checker flow, 400s, malformed JSON, whitelist, 404 route, CORS, one file per
  resource); the frontend data-integrity tests read `backend/src/data/seed.json`

Check it by hand (backend running):

```
curl -i http://localhost:3001/comenzi
curl -i -X POST http://localhost:3001/comenzi -H "Content-Type: application/json" -d '{"preparat":"X","livrata":false,"restaurant":"Pizzeria Napoli","livrare":"standard"}'
curl -i -X POST http://localhost:3001/comenzi -H "Content-Type: application/json" -d '{"preparat":""}'
curl -i http://localhost:3001/comenzi/999
curl -i -X DELETE http://localhost:3001/comenzi/7
```

Expected: 200 with the list, 201 with the new order (id 7), 400 `{"error":"preparat nu poate fi gol; ..."}`,
404 `{"error":"Comanda nu există"}`, 204.

The stage 1 and 2 files (static page and `comenzi.js`) were moved to `mockup/`.

### Server-side rules (development plan)

Plan §4.3 / §5 / stages 3–4, inside the stage 9 architecture (Express, data in memory, no users yet). The server,
not the frontend, decides the three separate fields `stare`, `plata.stare` and `livrareStare`.

- **State machine.** `backend/src/reguli/stari.js` and `livrare.js` are copies of the rules in `frontend/src/stari.js`
  (same states, same transitions, same side effects). `frontend/tests/backendReguli.test.js` compares both copies on
  every combination of state, role, delivery type, payment and delivery step, and runs the real frontend PATCH bodies
  against the server. On `PATCH /comenzi/:id` the server computes the result itself and the sent values must match it:
  - order: `plasata -> acceptata | respinsa | anulata`, `acceptata -> in_preparare | anulata`, `in_preparare -> gata | anulata`,
    `gata -> in_livrare` (delivery) `| livrata` (pickup) `| anulata`, `in_livrare -> livrata | anulata`; final: `livrata`, `anulata`, `respinsa`
  - the "Livrată" checkbox on "/" (`{ livrata: true/false }`) stays a manual shortcut, exactly as in the UI: any
    non-delivered state -> `livrata`; un-ticking goes back to the state before the last delivery (from `istoric`)
  - delivery: `neasignata -> asignata -> spre_restaurant -> preluata -> spre_client -> livrata`, `asignata -> neasignata`
    (withdraw); assigning needs an accepted order and an existing, active courier; `preluata` needs `gata` and moves the
    order to `in_livrare`; `livrata` needs `in_livrare`
  - payment: card (simulated) is paid at placement, cash is paid on delivery and unpaid again if un-ticked, a paid order
    that is cancelled or rejected becomes `rambursata`; `plata`, `livratorId`, `timpPreparare` and `motiv` cannot be changed directly
  - cancel / reject need `motiv` (400); accept needs `timpPreparare` 5–180 (400) and, for a special order without price, `pret` (400)
  - switching between pickup and delivery is allowed only while the order is `plasata`
- **History.** The server appends `{ stare, la }` (server time) on every accepted state change; a client-sent
  `istoric` is ignored, on POST and on PATCH.
- **Placement (POST).** A new order starts at `plasata` (or `livrata` with `livrata: true`, as the stage 7 form allows);
  any other `stare` -> 409. The server sets the payment state, `livrareStare`, `livratorId`, `timpPreparare`, `motiv`.
  409 when the menu dish has `disponibil: false`, the restaurant is paused, or it is closed at the order time
  (`programataLa` for a scheduled order, otherwise now; server time zone). Special orders follow the same pause and
  opening-hours rules. A restaurant without a saved profile or program is always open, so the checker's POST for
  "Pizzeria Napoli" (no profile in the seed) gets 201 at any hour. Undo of an order that had already moved past
  `plasata` now gets a 409 (the server does not accept a lifecycle it did not record).
- **Duplicates.** `Idempotency-Key` header on `POST /comenzi`: the same key with the same body returns the original
  response again (201, same order, header `Idempotent-Replayed: true`), no new order; same key with another body -> 409;
  malformed key -> 400; only successful creations keep the key (in memory, last 1000). `/cos` sends one
  `crypto.randomUUID()` per line per placement attempt.
- **Dispatch.** `POST /comenzi/:id/dispatch` assigns a courier that is online, active and without a trip in progress
  (fewest completed deliveries, then lowest id): 200 with the updated order, 409 when the order cannot get a courier now
  or nobody is available, 404 / 400 for the id. `/admin` has an "Asignează automat" button next to the manual assignment.

Status codes: 409 for a rule that conflicts with the current state (illegal transition, unavailable dish, paused or
closed restaurant, reused key, no courier), 400 for missing or malformed input.

## Full order flow: roles, coupons, reviews, recommendations

Spec in `docs/superpowers/specs/2026-11-22-savoro-flux-complet-design.md` (packages A, B, C). Still front end only:
json-server + `src/api.js`, `localStorage`, no own server, no new npm dependencies.

- **Role switcher is a demo, not security.** The header switcher (Client / Restaurant / Livrator / Admin) is stored in
  `localStorage` (`src/rol.js`) and adds `/restaurant`, `/livrator` or `/admin`. Anyone can pick any role; there are no
  accounts or passwords, and json-server accepts any request. Every rule (allowed state transitions in `src/stari.js`,
  coupon checks, one review per order) is validated only in the browser; a real backend would have to repeat it.
- **Demo couriers.** `db.json` → `livratori` holds three couriers whose names say "(livrator demo)". They are not real
  people; the route on `/livrator` is an inline SVG simulation, not a map or GPS.
- **Coupons** (`src/cupoane.js`, applied on `/cos`): `SAVORO10` gives 10% off a cart of at least 100 lei;
  `PRIMA20` gives 20 lei off the first order placed from the cart, from 60 lei ("first" = no earlier cart order that
  was not cancelled or rejected, counted from `/comenzi` when the code is applied). The cart becomes one order per line,
  so the discount is split across lines in proportion to their price (`imparteReducere`); each order stores `cupon` and
  its share in `reducere`, while `pret` stays the list price. The order page shows the code, the discount and the amount
  to pay (`pret − reducere`).
- **Reviews** (`src/recenzii.js`, resource `recenzii`): a delivered order gets one review (1–5 and optional text, up to
  500 characters) on its page. The restaurant page shows the average and the list only when real reviews exist; no
  invented ratings. If `/recenzii` cannot be loaded, the restaurant page simply hides the section.
- **Recommendations** (`src/recomandari.js`): the "Pentru tine" row on `/` is rule based, not AI. From the order history
  (cancelled / rejected orders ignored): dishes not ordered yet from the most-ordered category; if all were tried, the
  most-ordered dishes. The rule used is shown under the title; with no history the row is hidden.

## Redesign „Pădure”: forest green, cream, Gabarito

Branch `redesign/padure`, spec in `docs/superpowers/specs/2026-11-21-savoro-padure-redesign-design.md`. It replaces the
"Cer senin" look (pastel blue / pink, Fraunces italic, bento, torn receipt) with a Wolt-like discipline: one brand
colour, one bold sans, photos doing the work, plain copy. Front end only: `db.json`, `api.js` and json-server are unchanged.

Visual system (tokens in `src/index.css`):
- palette: `--padure` #133A2B (header, hero, primary buttons, active states), `--padure-2` #1F5440 (hover),
  `--hartie` #F5EFE2 (page), `--alb` #FFFDF8 (sheets), `--cerneala` #17211B (text), `--sters` #5B6459 (secondary text,
  5.4:1 on paper), `--sofran` #E9B44C only for "Express", the cart count and the focus ring on green; errors use
  #B3261E with an icon and text. Dark theme: page #0E1F17, sheets #15291F, text #EFE8D8, buttons #2C6B52, saffron focus ring
- type: Gabarito only (Google Fonts, 400/600/800, the latin-ext subset has ș ț ă î â), fallbacks Rethink Sans, Onest,
  system UI. Scale 14/16/20/25/31/39/61px, headings 800 with -0.02em tracking, sentence case, tabular prices
- shape: photos 18px, sheets / drawer 24px, inputs and small controls 12px, pills only for primary buttons. Cards are
  flat on the paper; only the drawer, toasts and the mobile bottom bar have shadows
- signature: the green header continues into the home hero (huge cream headline, search, delivery mode); the three
  dish photos break out of the band's bottom edge onto the paper. The restaurant page repeats it with one photo
- motion only after an action: cart count bump, drawer slide, toast. No entrance animations; reduced motion respected

Pages (all inside `components/Layout.jsx`):

| Route | Page | What it shows |
| ----- | ---- | ------------- |
| `/` | `pages/ComenziPage.jsx` | hero, category row, "Restaurante" row, menu grid, "Comenzile tale" (one-sentence summary, list with every test id, "Comandă specială" form) |
| `/restaurante/:slug` | `pages/RestaurantPage.jsx` | restaurant header (photo, cuisine, description, delivery options from `livrare.js`) and its dishes; an unknown slug renders the 404 page |
| `/cos` | `pages/CosPage.jsx` | checkout: lines, quantities, delivery choice, total, "Plasează comanda" (stage 7 logic: one POST per line, `Promise.allSettled`), then `/#comenzi` |
| `/favorite` | `pages/FavoritePage.jsx` | dishes saved with the heart button (ids in `localStorage`, read defensively) |
| `/comenzi/:id` | `pages/ComandaDetaliuPage.jsx` | large photo, title, a three-step status (Plasată, Pe drum, Livrată) derived only from `livrata`, details |
| `/despre`, `*` | `DesprePage.jsx`, `NotFoundPage.jsx` | restyled; credits table kept |

Architecture changes:
- the menu, cart, favourites, chosen delivery type and the "Comanda a fost plasată" toast moved from `ComenziPage` to
  `src/magazin.js` (`useStareMagazin`, used once by `Layout`, passed to pages with `<Outlet context>`; pages read it
  with `useMagazin()`). Orders, search and category stay in `ComenziPage`
- the cart drawer is now a quick view on every page with "Mergi la plată" (to `/cos`); placing happens on `/cos`
- "Anulează" is rendered by `ComenziPage` into the Layout toast region through a portal, so both toasts share one
  `aria-live` region
- navigation: one `<nav data-testid="nav">` (Acasă, Favorite, Despre; plus Coș on phones) that becomes a fixed bottom
  bar up to 640px. A "Sari la conținut" skip link; `/#meniu`, `/#comenzi`, `/#restaurante` scroll to the section and
  focus its heading
- `/` still shows exactly one `data-testid="error"` and one `data-testid="loading"`: the menu and orders states are merged
- removed: `RezumatBento`, `BonComanda`, the full-width hero photo, eyebrow labels, `A · B` meta strings, Fraunces / Inter
- new pure helpers with `node:test` tests: `src/restaurante.js` (slug, lookup, dishes per restaurant),
  `src/favorite.js` (parse / toggle / prune favourites), `src/etape.js` (status steps), `frazaRezumat` in `src/rezumat.js`

## Stage 8: routing and detail page

Four pages behind React Router (`react-router-dom` 7, `BrowserRouter` in `src/main.jsx`), plus component
styles moved to CSS Modules. Navigation never reloads the document; only the API requests show in Network.

| Route | Page | What it shows |
| ----- | ---- | ------------- |
| `/` | `pages/ComenziPage.jsx` | the whole stage 7 page: hero, categories, menu, bento, "Comandă specială" form, orders, cart, undo |
| `/comenzi/:id` | `pages/ComandaDetaliuPage.jsx` | one order, fetched from the server by id |
| `/despre` | `pages/DesprePage.jsx` | what Savoro is, the stack, the photo credits |
| `*` | `pages/NotFoundPage.jsx` | the app's 404 page (`data-testid="not-found"`) |

- `src/App.jsx` holds only the route map; every route is nested in `<Route element={<Layout />}>`
- `components/Layout.jsx`: the shared header (logo linking to `/`, `<nav data-testid="nav">` with the
  `NavLink`s "Comenzi" (`end`) and "Despre", marked automatically when active), the theme toggle (theme
  state moved here, so it works on every page), `<main>` with `<Outlet />` and the footer (credits link to
  `/despre#fotografii`). A new link scrolls to the top (or to the `#anchor`); Back / Forward keep the
  browser's own scroll handling
- search and the cart button stay with `ComenziPage`, where their state lives: on `/` they sit in a
  sticky bar right under the header, in the same translucent style, so it reads as a second header row.
  The hero, the menu title and the form panel line up under both through a `--sus-h` token
  (header + bar), computed from `--header-h` and `--searchbar-h`
- the card title stays `<h3 data-testid="item-title">` and now contains
  `<Link to="/comenzi/:id" data-testid="item-link">`; all stage 7 test ids are on the same elements
- the route uses the resource name from `tw.json`: `/comenzi/:id`. `api.js` gained `fetchComanda(id)`
  through the common `request()` (id encoded, a non-object answer is rejected)
- detail page: `useParams`, then the guide's effect with `.then / .catch / .finally` and an `ignore`
  flag, depending on `[id]`. State starts as `loading = true`, `error = null`, so the effect never calls
  `setState` synchronously (`react-hooks/set-state-in-effect`); the page renders an inner component with
  `key={id}`, so moving to another id starts fresh. Test ids: `loading`, `error`, `detail`, `detail-title`.
  It shows more than the card: a large photo (category icon for special orders), category, "Comandă
  specială" tag, restaurant, price or "Preț la confirmare", status (Livrată / Pe drum), delivery type and
  estimated time, the date it was placed (`creata`, `ro-RO` format via `formatData`) and the order number,
  plus "Înapoi la comenzi". The title gets focus once loaded. `/comenzi/999` shows
  "Comanda nu a putut fi încărcată: Eroare server: 404." with a way back, never an empty page
- CSS Modules: `App.css` became `src/index.css` with only tokens, reset, base typography and the classes
  shared by several components (`.wrap`, `.panel`, `.btn-*`, `.info`, `.error`, `.empty`, `.badge-*`,
  `.price`, `.thumb`, skeletons, focus, view-transition groups, print tokens). Every component and page
  with its own rules has `Name.module.css` next to it (`styles.name` in JSX; dynamic classes such as
  `styles[`livrare-${livrare}`]`). `index.css` is imported before `App` so modules can override it.
  The skeletons reuse the real components' modules, so they never drift apart
- tests: `fetchComanda` (URL, encoding, 404, non-object answer, network error) in `tests/api.test.js`,
  `formatData` in `tests/format.test.js`

Note: refreshing a detail URL works with `npm run dev` / `npm run preview` because Vite serves
`index.html` for every path; a plain static server needs that fallback configured.

## Stage 7: form and validation

Orders can now be created from the page, and every change (add, toggle, delete, undo, placing the cart)
goes to the API first; the list shows what the server returned, so everything survives a refresh.

- **"Comandă specială"** (`src/components/ComandaForm.jsx`): the customer asks one of the three restaurants
  for a dish that is not on the menu. It sits in "Comenzile tale", under the bento: form panel on the left
  (1fr), orders on the right (2fr), stacked up to 860px wide. Controlled fields (`value` + `onChange`):
  `preparat` (text, max 60 characters, with a counter), `restaurant` (select: Pizzeria Napoli, Burger Van,
  Sushi Kyo) and `livrare` (select: Standard, Express, Ridicare personală). Option values are exactly what
  is stored in `db.json`
- validation in code (`noValidate`, never `alert`): `valideazaComandaSpeciala` in `src/validare.js` is a pure
  function, so it is unit-tested. Dish required (after `trim`) and at most 60 characters; restaurant and
  delivery must be one of the fixed values (`src/constants.js`). The message shows in the form
  (`role="alert"`), the wrong field gets `aria-invalid="true"` (thick red border) and the focus, and no
  request is sent
- sending: `e.preventDefault()`, the button is disabled and says "Se trimite…", the fields are cleared only
  after the server confirmed; on failure the text stays and the error from `api.js` shows in the form
  (`handleAdd` does not catch it). The object sent has no id:
  `{ preparat, restaurant, livrare, categorie, livrata: false, pret: null, speciala: true, creata }`.
  `categorie` comes from the restaurant; there is no price field (customers do not set prices), so cards
  and the receipt show "Preț la confirmare" and the totals ignore `null` ("+ 1 preț la confirmare")
- `src/api.js`: one common `request(path, options)` (JSON header, `res.ok` check, 204 → `null`, the 8 s
  timeout and the Romanian error messages from stage 6), plus `createComanda`, `updateComanda(id, changes)`
  (PATCH) and `deleteComanda(id)`. `fetch` is still only in `api.js`
- server first, then state:
  - toggle "Livrată": PATCH `{ livrata }`, then the returned object replaces the old one
  - delete: DELETE, then `filter`; the "Anulează" message (5 s) re-POSTs the deleted order with its old id
    (json-server 0.17 keeps it) and puts the server's object back in its place. `ConfirmDialog` was removed
    (see stage 5)
  - cart: one POST per line with `Promise.allSettled`; saved lines join the list and leave the cart, failed
    ones stay in the cart and the drawer says why
  - a failed toggle / delete / undo shows an error above the list and the list stays visible
    (the list condition is only `!loading`)
- automated checker: `tw.json` in the repository root (`comenzi`, `preparat`, `livrata`, sample
  `{ restaurant, livrare }`) and the `data-testid` attributes from table 7.3: `item` (with `data-id`),
  `item-title`, `item-toggle`, `item-delete`, `empty`, `form`, `form-title`, `form-restaurant`,
  `form-livrare`, `form-submit`, `form-error`, `loading`, `error`
- tests: `tests/validare.test.js` (validation, restaurant → category, `tw.json`), new `request` / CRUD tests
  in `tests/api.test.js`, `null` prices in `tests/rezumat.test.js`, `cosInComenzi` without ids in
  `tests/cos.test.js`; `tests/db.test.js` accepts `pret: null` (only with `speciala`) and the optional
  `speciala` / `creata` fields

## Redesign: cinematic hero, photo menu, bento (replaced)

Superseded by the „Pădure” redesign above (the bento and the receipt were removed); kept as a record.

Done after stage 6, on the `redesign/cinematic` branch (restore point: tag `pre-redesign`). The goal was a
2026 food-delivery look (Glovo / Wolt level) without losing anything stages 1–6 require. Spec and plan:
`docs/superpowers/specs/`.

- header: sticky, translucent espresso with a backdrop blur (solid espresso where `backdrop-filter`
  is not supported); same controls as before
- hero: a full-width photo (`<picture>`, an 828px portrait file up to 640px wide, a 1600px one above,
  preloaded from `index.html` with the same media rules, `fetchpriority="high"`) under a dark gradient,
  so the white text stays AA. Eyebrow = the restaurants found in the menu, subtitle = "9 produse din
  3 restaurante.", a "Vezi meniul" button that scrolls to the menu and focuses its title (the same
  `mergiLaMeniu()` as "Vezi meniul" in the empty cart)
- the receipt (`BonComanda`) is unchanged (tilted paper, zig-zag edge, same states); it now sits on the
  photo, with a `drop-shadow` on a wrapper (a `box-shadow` would be cut by the zig-zag mask)
- "Ce poftești azi?": "Toate" + one photo card per category, each with "N preparate" counted from the
  menu. They are `aria-pressed` toggle buttons; clicking the active one again (or "Toate") clears the
  filter. The category filter works together with the search (`potrivesteCategoria` in `src/categorii.js`);
  the meta says "N din M produse" and the empty state names the search and/or the category, with a
  button that clears both and focuses the search field
- menu cards: a 4:3 photo (`loading="lazy"`, explicit `width` / `height`), "Adaugă" over the photo,
  replaced by the "− 2 +" stepper while the dish is in the cart (same focus moves as before). A dish
  without a photo falls back to its category icon
- "Comenzile tale": the old summary strip and the category pills became a bento grid
  (`RezumatBento`): total spent with per-category counts, orders on the way, "X din Y" delivered with a
  decorative progress bar, and counts per delivery type with the existing badge colours. While loading
  the tiles show "—" (plus a screen-reader text), never "0 lei"
- orders: one list, with a "Pe drum · N" divider before the first order on the way and "Livrate · N"
  before the first delivered one (each shown whenever its group is not empty, so a list with only
  delivered orders still says what it is); photo thumbnails, falling back to the category icon
- responsive: phone ≤ 640px (photo ~480px under the header, receipt below the title, categories as a
  horizontal scroll-snap row, one menu column, bento in two columns), tablet 641–1024px (two menu
  columns), desktop (three)

Decisions:
- no change to `db.json` (or `api.js`, `cos.js`, `cautare.js`, `format.js`, `livrare.js`): photos are
  matched by dish name in `src/imagini.js`, so the data model and its tests stay as stage 6 left them
- every number on screen is derived from `comenzi` / `meniu` (`src/rezumat.js`). The old "cheltuiți luna
  asta" became "cheltuiți în total": the orders have no dates, so "this month" could not be computed
- photos are local WebP files in `frontend/public/img/` (no hotlinking, no extra requests to a CDN),
  each one showing the dish it is attached to; credits are below
- tests: `tests/imagini.test.js` (every menu dish has a photo and the file exists), `tests/rezumat.test.js`
  (totals on `db.json`, empty list gives zeros), `tests/categorii.test.js`

## Fotografii

Photo credits. All photos are from Unsplash (Unsplash License), resized and converted to WebP.
Category cards reuse dish photos: Pizza → `pizza-diavola`, Burgers → `burger-vita`, Asian → `sushi-platou`.
Restaurant cards: Pizzeria Napoli → `pizza-margherita`, Burger Van → `burger-pui`, Sushi Kyo → `ramen-porc`.
The home hero uses `hero-900.webp` (portrait), `sushi-platou` and `burger-vita`; `hero-1600.webp` is no longer used.

| File | Dish | Photographer | Unsplash page |
| ---- | ---- | ------------ | ------------- |
| pizza-margherita.webp, hero-*.webp | Pizza Margherita | Aurélien Lemasson-Théobald | https://unsplash.com/photos/x00CzBt4Dfk |
| pizza-diavola.webp | Pizza Diavola | Alan Hardman | https://unsplash.com/photos/SU1LFoeEUkk |
| pizza-quattro-formaggi.webp | Pizza Quattro Formaggi | Alexey Demidov | https://unsplash.com/photos/MVhg4ecfKBA |
| burger-vita.webp | Burger de vită cu cartofi | Jonathan Borba | https://unsplash.com/photos/8l8Yl2ruUsg |
| burger-pui.webp | Burger cu pui crocant | Tomi Saputra | https://unsplash.com/photos/RjmgHpZPY9w |
| burger-vegetarian.webp | Burger vegetarian | Grooveland Designs | https://unsplash.com/photos/Kjt-sJbgy8I |
| sushi-platou.webp | Platou sushi (12 buc.) | Riccardo Bergamini | https://unsplash.com/photos/O2yNzXdqOu0 |
| ramen-porc.webp | Ramen cu porc | Huyen Bui | https://unsplash.com/photos/NHEL1M1Cv-A |
| gyoza.webp | Gyoza cu legume (6 buc.) | Mikey Frost | https://unsplash.com/photos/klTf2RN37Ts |

## Stage 6: data from a mock API

The orders and the menu are no longer written in React code. They live in `frontend/db.json`
and are served by json-server (`0.17.4`, pinned: 1.x generates random string ids):

| Route          | Returns                    |
| -------------- | -------------------------- |
| `GET /comenzi` | the 6 orders (numeric ids) |
| `GET /meniu`   | the 9 dishes ("p1".."p9")  |

- `src/api.js` is the only file with `fetch`: `fetchComenzi()` and `fetchMeniu()` check `res.ok`
  and throw `Eroare server: <status>`. The address comes from `VITE_API_URL` (see `.env.example`),
  falling back to `http://localhost:3001`; `.env` is git-ignored
- `App` starts with `useState([])` for `comenzi` and `meniu`, plus `loading` (true) and `error` (null).
  One `useEffect` with an inner `async function load()` loads both resources in parallel with
  `Promise.all`, in `try / catch / finally`; the `let ignore = false` cleanup stops a late answer
  from overwriting state (StrictMode runs the effect twice in development)
- three states on the page: "Se încarcă meniul…" / "Se încarcă comenzile…" over grey skeletons;
  an error that says what happened and what to do
  ("Nu am putut încărca datele: … Rulează `npm run api`?"); the lists once the data arrived
- checking, deleting, undo and placing an order still change only the local state:
  they are lost on refresh until stage 7 sends them to the server

### Extras

- retry without reload: "Încearcă din nou" puts the page back in the loading state and runs the
  effect again (a `reincercari` counter in its dependencies)
- timeout: every request is cancelled after 8 seconds with an `AbortController`
  ("Serverul nu a răspuns în 8 secunde"); a stopped server gives "Serverul nu poate fi contactat"
  instead of the browser's "Failed to fetch"
- validation: a response that is not a list (or not JSON) gives "Răspuns neașteptat de la server"
- skeletons for the menu, the orders and the receipt (`aria-busy`, a visible status text; the shimmer
  stops with reduced motion). While loading or on error the receipt and the summary strip show "—",
  never "0 lei" or "Nicio comandă încă"
- the cart is still read from `localStorage` on the first render, but `citesteCos` now checks only
  the shape; `pastreazaDinMeniu` removes dishes missing from the menu once the menu has arrived
- working search: the header field filters both the menu and the orders by dish or restaurant,
  ignoring case and diacritics (`src/cautare.js`). The section titles show "2 din 9 produse",
  empty results say "Niciun preparat pentru „x”" with a "Șterge căutarea" button, and Esc clears
  the field. Header, summary and receipt counters still count all orders
- review fixes for the cart: Enter on a delivery option no longer places the order; the delivery
  choice goes back to Standard after an order; only the two headings focused from code
  (`.titlu-focus`) drop the focus outline; the page behind an open dialog does not scroll;
  on phones `--header-h` is 124px (two header rows), so the menu title stops right under the header
- tests: `tests/api.test.js` (fake `fetch`: list, 500, non-list, network error, timeout),
  `tests/db.test.js` (integrity of `db.json`), `tests/cautare.test.js`, and the updated
  `tests/cos.test.js`; run them with `npm test`

### Cart

Added between stage 5 and stage 6 (commit "Cart: menu and cart drawer"):
- a "Meniu" section above the orders: one card per dish with "Adaugă", which turns into a
  "− 2 +" quantity selector (max 20 per dish)
- the cart button in the header opens a side panel (`CosDrawer`, a native `<dialog>`): lines with
  quantity and subtotal, a delivery choice (Standard / Express / Ridicare personală), the total and
  "Plasează comanda"
- placing the order turns every cart line into a new order "on the way" (since stage 7 a POST per line; the server sets the id),
  empties the cart and shows a confirmation for 5 seconds
- the cart is kept in `localStorage` under the key `cos` and validated when read
  (`src/cos.js` holds the pure cart logic, tested in `tests/cos.test.js`)

## Stage 5: local state and events

The list lives in React state. Checking and deleting work from the page,
and the counters in the header follow automatically. A button in the
header switches between light and dark mode. Changes are lost on refresh,
which is what stage 6 and stage 10 fix.

- `App` keeps the orders in `useState(COMENZI_INITIALE)` and is the only place that changes them:
  `handleToggleLivrata` (`map` + spread) and `handleDelete` (`filter`), both with the `setComenzi((prev) => ...)` form
- the functions go down as `onToggle` / `onDelete` through `ComandaList` to each `ComandaCard`
- on the card, the status pill is a controlled checkbox (`checked` + `onChange`), and the trash button
  in the corner has `aria-label="Șterge <dish>"`
- the counters (orders on the way, delivered, money spent, orders per category) are computed from the list on
  every render, not kept in state
- the theme is a second state, `tema`, starting from the system setting; the button writes
  `data-theme` on `<html>` and the CSS swaps the color variables (light base, dark under
  `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]`)
- deleting asked first, in our own `ConfirmDialog` (`<dialog>`, closes with Esc, a backdrop click or "Renunță"),
  never with the browser's `confirm()`; the deletion itself is still `handleDelete` with `filter`.
  Replaced in stage 7: the automated checker clicks the delete button and expects the order to be gone,
  so deleting is now immediate and the 5-second "Anulează" message covers mistakes

### Redesign

Together with stage 5 the page was restyled after my CodeAlpha restaurant project (Trattoria):
- cream background and espresso header / hero, terracotta accent, olive green for delivered orders;
  a separate espresso-toned dark theme
- Fraunces (serif) for headings, Inter for text
- a summary strip under the hero instead of stat cards
- orders as rows of a printed menu: category icon, dish ..... price, then restaurant, delivery badge
  and time; "Livrată" and delete on the right. Category pills above the list
- `lucide-react` icons instead of emojis (`src/categorii.js`), sums through `formatLei`
- every small text passes WCAG AA (lowest measured: 5.44:1 light, 5.69:1 dark); 44px touch areas;
  on phones each row stacks and the dialog buttons go full width

### Design details

- a "receipt" in the hero shows the next order on the way and the total still on the way
  (`BonComanda`, derived from the list); when nothing is on the way it says so
- orders on the way come first, delivered ones below a "Livrate" separator (a sorted copy, the state is unchanged)
- checking, deleting, undoing and switching the theme animate with the View Transitions API (`src/tranzitie.js`);
  without browser support, or with reduced motion turned on, the change is instant
- the strike-through on a delivered order draws from left to right; the numbers in the summary strip slide in
- after a delete, a message offers "Anulează" for 5 seconds; undo puts the order back in its place (immutable insert)
- the theme choice is kept in `localStorage` (optional in the guide); a small script in `index.html` applies it
  before the first paint, so the page never flashes in the wrong theme
- own logo and favicon (a bowl whose steam forms an "S"), an illustrated empty state, an icon in the dialog
- correct Romanian plurals: 1 comandă, 2 comenzi, 20 de comenzi (`formatComenzi`)
- print styles (Ctrl+P): white page, no buttons, the list like a receipt

## Stage 4: components

The list is rendered from the data, through two components in `frontend/src/components/`:
- `ComandaList` receives the whole `comenzi` array and renders one card per order (`map`, `key={comanda.id}`),
  or the message "Nu ai nicio comandă." when the array is empty
- `ComandaCard` receives a single order through props and displays it: category icon, restaurant,
  dish, delivery badge, estimated time, price and status (Pe drum / Livrată)

The labels shown on screen are kept apart from the values in the data (`ETICHETE_LIVRARE`,
`DURATE_LIVRARE`, `ICONITE_CATEGORIE`): the data says `ridicare`, the card says "Ridicare personală".
A delivered order gets the `done` class (struck-through title, faded card).

### Redesign

After the stage 4 components were done, the page was restyled after the Figma Community file
"Food app delivery - Mobile App": dark grey surfaces, coral accent (`#ff7269`), the Urbanist font
and icons from `lucide-react`. Orders are shown as a grid of cards (3 columns on desktop, 2 on phones),
and header, hero, sections and footer share one container width so they line up.
The components, props, `key` and the empty-list message are unchanged.

## Stage 3: Vite and React project

The app now lives in `frontend/`, built with Vite. The data from stage 2
moved into the main component; the list is still printed raw.

`frontend/src/App.jsx` holds the `comenzi` array above the `App` function. The header
values are computed from it: total orders, orders on the way (`filter`), delivered orders
and money spent (`reduce`). The stage 1 styles are reused in `frontend/src/App.css`,
with a single column until the form comes back in stage 7. Since stage 8 that file is `src/index.css`
(global styles only) and every component has its own `.module.css`.

## Stage 2: data logic

Plain JavaScript, no DOM. `mockup/comenzi.js` holds the `comenzi` array and the functions
that read and change it. Results are printed in the browser console (F12).

| Function            | What it does                                                 |
| ------------------- | ------------------------------------------------------------ |
| `listeazaPreparate` | list of dish names (`map`)                                   |
| `numaraPeDrum`      | how many orders are not delivered yet (`filter`)             |
| `cautaComenzi`      | search by dish or restaurant, case-insensitive (`filter`)    |
| `gasesteDupaId`     | one order by id (`find`)                                     |
| `adaugaComanda`     | validated add, new id = max id + 1 (`reduce`), returns a new array |
| `comutaLivrata`     | toggle delivered for one id (`map` + spread)                 |
| `stergeComanda`     | remove one id (`filter`)                                     |

Validation rejects: empty or >100 char dish name, delivery type not in `LIVRARI`,
empty restaurant, price that is not a positive number, category not in `CATEGORII`.

## Stage 9 checklist

| ID    | Requirement | Where | How to check |
| ----- | ----------- | ----- | ------------ |
| S9-R1 | backend/ next to frontend/: ES modules, start / dev scripts, server listens on PORT (3001) | [package.json#L5-L11](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/package.json#L5-L11), [server.js#L4-L8](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/server.js#L4-L8), [.gitignore](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/.gitignore), [.env.example](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/.env.example) | `cd backend && npm install && npm run dev` |
| S9-R2 | REST routes with the right codes: GET 200, POST 201, PATCH 200, DELETE 204, then 404 | [app.js#L22-L26](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/app.js#L22-L26), [routes/comenzi.js#L14-L43](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/routes/comenzi.js#L14-L43), [src/routes](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/tree/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/routes) (five resources) | curl commands in Stage 9, `npm test` in backend/ |
| S9-R3 | server-side validation: invalid data -> 400 `{ error }`; whitelist, `partial` for PATCH | [validation.js](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/validation.js), [validation/comune.js#L10-L27](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/validation/comune.js#L10-L27), [validation/comenzi.js#L44-L47](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/validation/comenzi.js#L44-L47), [L71-L73](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/validation/comenzi.js#L71-L73), [routes/util.js#L11-L15](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/routes/util.js#L11-L15) | POST `{}` and `{"preparat":""}` |
| S9-R4 | missing element -> 404, unknown route -> 404, central error handler (500 "Eroare internă") | [routes/comenzi.js#L8](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/routes/comenzi.js#L8), [routes/util.js#L5-L9](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/routes/util.js#L5-L9), [ids.js#L8-L11](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/ids.js#L8-L11), [app.js#L28-L40](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/app.js#L28-L40) | GET /comenzi/999, GET /ceva, POST broken JSON |
| S9-R5 | CORS for the frontend; the frontend uses our server and shows its `error` message | [app.js#L15-L16](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/backend/src/app.js#L15-L16), [api.js#L22-L25](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/frontend/src/api.js#L22-L25), [frontend/package.json](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/frontend/package.json) (no json-server) | open http://localhost:5173, Console without CORS errors |
| S9-R6 | README Stage 9 section, how to run, AI log | [README.md#L34](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/README.md#L34), [README.md#L62](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/README.md#L62), [ai-log/etapa-09.md](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/1c35d95ad11b2b640f77a890486553555364c2df/ai-log/etapa-09.md) | read |
| S9-R7 | commit “Stage 9” | [1c35d95](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/commit/1c35d95ad11b2b640f77a890486553555364c2df) | commit history |

## Stage 8 checklist

| ID    | Requirement | Where | How to check |
| ----- | ----------- | ----- | ------------ |
| S8-R1 | header navigation changes the page without reload | [main.jsx#L9-L11](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/main.jsx#L9-L11), [App.jsx#L12-L19](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/App.jsx#L12-L19), [Layout.jsx#L66-L73](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/components/Layout.jsx#L66-L73), [L87](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/components/Layout.jsx#L87) (Outlet) | click Comenzi / Despre, watch Network |
| S8-R2 | click on an item opens its detail page | [ComandaCard.jsx#L33-L37](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/components/ComandaCard.jsx#L33-L37), [ComandaDetaliuPage.jsx#L16](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/pages/ComandaDetaliuPage.jsx#L16), [api.js#L58-L62](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/api.js#L58-L62) (fetchComanda) | click a title |
| S8-R3 | refresh on the detail URL works; missing id shows an error | [ComandaDetaliuPage.jsx#L28-L43](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/pages/ComandaDetaliuPage.jsx#L28-L43), [L64-L73](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/pages/ComandaDetaliuPage.jsx#L64-L73) | refresh /comenzi/1, open /comenzi/999 |
| S8-R4 | unknown URL shows the app 404 page | [App.jsx#L17](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/App.jsx#L17) (path="*"), [NotFoundPage.jsx](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/pages/NotFoundPage.jsx) | open /ceva |
| S8-R5 | each component has its .module.css; index.css only shared styles | [src/components](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/tree/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/components), [src/pages](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/tree/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/pages), [index.css](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/index.css) | read |
| S8-R6 | data-testid attributes from tables 7.3 and 8.2; detail route /comenzi/:id | [Layout.jsx#L66](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/components/Layout.jsx#L66), [ComandaCard.jsx#L33-L34](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/components/ComandaCard.jsx#L33-L34), [ComandaDetaliuPage.jsx#L59](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/pages/ComandaDetaliuPage.jsx#L59), [L68](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/pages/ComandaDetaliuPage.jsx#L68), [L88](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/pages/ComandaDetaliuPage.jsx#L88), [L102](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/pages/ComandaDetaliuPage.jsx#L102), [NotFoundPage.jsx#L18](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/pages/NotFoundPage.jsx#L18), [App.jsx#L15](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/frontend/src/App.jsx#L15), [tw.json](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/tw.json) | querySelector in the console |
| S8-R7 | README Stage 8 section + AI log | [README.md#L57](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/README.md#L57), [ai-log/etapa-08.md](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820/ai-log/etapa-08.md) | read |
| S8-R8 | commit “Stage 8” pushed | [ef771aa](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/commit/ef771aa08038da8dd18e83a9a15d6bf2ac4c1820) | commit history |

## Stage 7 checklist

| ID    | Requirement | Where | How to check |
| ----- | ----------- | ----- | ------------ |
| S7-R1 | controlled form: value + onChange on every field | [ComandaForm.jsx#L14-L20](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaForm.jsx#L14-L20), [L73-L74](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaForm.jsx#L73-L74), [L89-L90](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaForm.jsx#L89-L90), [L105-L106](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaForm.jsx#L105-L106) | read |
| S7-R2 | empty title shows an error, nothing is sent | [ComandaForm.jsx#L25-L35](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaForm.jsx#L25-L35), [validare.js#L7-L13](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/validare.js#L7-L13) (valideazaComandaSpeciala) | submit empty, watch Network |
| S7-R3 | added item shows in the list and survives refresh | [App.jsx#L148-L153](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/App.jsx#L148-L153) (handleAdd), [api.js#L58-L60](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/api.js#L58-L60), [L13-L30](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/api.js#L13-L30) (request) | add, refresh |
| S7-R4 | toggle and delete survive refresh | [App.jsx#L156-L189](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/App.jsx#L156-L189) | toggle/delete, refresh |
| S7-R5 | button disabled while sending, form cleared only on success | [ComandaForm.jsx#L39-L51](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaForm.jsx#L39-L51), [L120-L122](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaForm.jsx#L120-L122) | --delay 3000; stop API and submit |
| S7-R6 | tw.json and the data-testid attributes from table 7.3 | [tw.json](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/tw.json), [ComandaCard.jsx#L19-L20](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaCard.jsx#L19-L20), [L30](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaCard.jsx#L30), [L59](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaCard.jsx#L59), [L69](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaCard.jsx#L69), [ComandaList.jsx#L10](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaList.jsx#L10), [ComandaForm.jsx#L65](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/components/ComandaForm.jsx#L65), [App.jsx#L397](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/App.jsx#L397), [L441](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/App.jsx#L441), [L449](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/frontend/src/App.jsx#L449) | querySelectorAll in the console |
| S7-R7 | README Stage 7 section + AI log | [README.md#L57](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/README.md#L57), [ai-log/etapa-07.md](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/98efcce796be32d8f7f108ad3d181fc811f06bde/ai-log/etapa-07.md) | read |
| S7-R8 | commit “Stage 7” pushed | [98efcce](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/commit/98efcce796be32d8f7f108ad3d181fc811f06bde) | commit history |

## Stage 6 checklist

| ID    | Requirement | Where | How to check |
| ----- | ----------- | ----- | ------------ |
| S6-R1 | npm run api starts, route shows JSON | [package.json#L12](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/package.json#L12), [L28](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/package.json#L28), [db.json](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/db.json) | open localhost:3001/comenzi and /meniu |
| S6-R2 | data no longer in React code | [App.jsx#L43-L46](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/src/App.jsx#L43-L46) (useState([])), [L63-L81](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/src/App.jsx#L63-L81) (useEffect + ignore) | read |
| S6-R3 | loading message while waiting | [App.jsx#L329](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/src/App.jsx#L329), [Meniu.jsx](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/src/components/Meniu.jsx) | `npx json-server --watch db.json --port 3001 --delay 4000` |
| S6-R4 | error message when API is down | [App.jsx#L295-L304](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/src/App.jsx#L295-L304) | stop npm run api, refresh |
| S6-R5 | fetch only in api.js, URL from env | [api.js#L6](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/src/api.js#L6), [L16-L17](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/src/api.js#L16-L17), [.env.example](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/frontend/.env.example) | search for fetch |
| S6-R6 | README Stage 6 section + AI log | [README.md#L55](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/README.md#L55), [ai-log/etapa-06.md](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/55428cf5144466cb6ab503ede5827bcb4fbae605/ai-log/etapa-06.md) | read |
| S6-R7 | commit "Stage 6" pushed | [55428cf](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/commit/55428cf5144466cb6ab503ede5827bcb4fbae605) | commit history |

## Stage 5 checklist

| ID    | Requirement | Where | How to check |
| ----- | ----------- | ----- | ------------ |
| S5-R1 | list kept in useState in App | [App.jsx#L13-L17](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/App.jsx#L13-L17), [L32](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/App.jsx#L32) | read |
| S5-R2 | toggle delivered, immutable (map + spread) | [App.jsx#L47-L53](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/App.jsx#L47-L53) | tick "Livrată" |
| S5-R3 | delete from the page (filter), with confirmation | [App.jsx#L55-L60](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/App.jsx#L55-L60), [ConfirmDialog.jsx](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/components/ConfirmDialog.jsx) | trash button, confirm |
| S5-R4 | handlers passed down through props | [App.jsx#L157-L161](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/App.jsx#L157-L161), [ComandaList.jsx#L5](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/components/ComandaList.jsx#L5) | read |
| S5-R5 | controlled checkbox and delete button on the card | [ComandaCard.jsx#L37-L52](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/components/ComandaCard.jsx#L37-L52) | click, F12 Console clean |
| S5-R6 | counters derived from the list, not stored | [App.jsx#L85-L88](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/App.jsx#L85-L88) | toggle / delete, header updates |
| S5-R7 | light / dark theme button | [App.jsx#L72-L83](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/App.jsx#L72-L83), [L104-L111](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/frontend/src/App.jsx#L104-L111) | click the button |
| S5-R8 | README Stage 5 section + AI log | [README.md#L37](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/README.md#L37), [ai-log/etapa-05.md](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/4cad5bd264470eb3990441dfb04a34e283ce876d/ai-log/etapa-05.md) | read |
| S5-R9 | commit "Stage 5" pushed | [4cad5bd](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/commit/4cad5bd264470eb3990441dfb04a34e283ce876d) | commit history |

## Stage 4 checklist

| ID    | Requirement | Where | How to check |
| ----- | ----------- | ----- | ------------ |
| S4-R1 | 2+ components in src/components/ | [frontend/src/components/](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/tree/cbb84db3164875a9e08934ffa4c67269634e170f/frontend/src/components) | open folder |
| S4-R2 | card receives data through props | [ComandaCard.jsx#L6-L27](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/cbb84db3164875a9e08934ffa4c67269634e170f/frontend/src/components/ComandaCard.jsx#L6-L27) | read |
| S4-R3 | map + key={id}, no console warnings | [ComandaList.jsx#L8-L14](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/cbb84db3164875a9e08934ffa4c67269634e170f/frontend/src/components/ComandaList.jsx#L8-L14) | F12, Console |
| S4-R4 | message for empty list | [ComandaList.jsx#L4-L6](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/cbb84db3164875a9e08934ffa4c67269634e170f/frontend/src/components/ComandaList.jsx#L4-L6) | set array to [] |
| S4-R5 | state changes the card look | [ComandaCard.jsx#L8](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/cbb84db3164875a9e08934ffa4c67269634e170f/frontend/src/components/ComandaCard.jsx#L8), [L24](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/cbb84db3164875a9e08934ffa4c67269634e170f/frontend/src/components/ComandaCard.jsx#L24) | toggle livrata |
| S4-R6 | README Stage 4 section + AI log | [README.md#L37](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/cbb84db3164875a9e08934ffa4c67269634e170f/README.md#L37), [ai-log/etapa-04.md](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/cbb84db3164875a9e08934ffa4c67269634e170f/ai-log/etapa-04.md) | read |
| S4-R7 | commit "Stage 4" pushed | [cbb84db](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/commit/cbb84db3164875a9e08934ffa4c67269634e170f) | commit history |

## Stage 3 checklist

| ID    | Requirement                                   | Where                                                                                     | How to check             |
| ----- | --------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------ |
| S3-R1 | npm run dev starts without errors             | [frontend/package.json](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ee90c9c72ea234cb25aa45a97a3771abb3697dd4/frontend/package.json)                                         | npm install, npm run dev |
| S3-R2 | app name and counter computed from data       | [App.jsx#L8-L10](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ee90c9c72ea234cb25aa45a97a3771abb3697dd4/frontend/src/App.jsx#L8-L10), [L30-L41](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ee90c9c72ea234cb25aa45a97a3771abb3697dd4/frontend/src/App.jsx#L30-L41) | edit data, save          |
| S3-R3 | data from README, not from the example        | [App.jsx#L1-L5](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ee90c9c72ea234cb25aa45a97a3771abb3697dd4/frontend/src/App.jsx#L1-L5)                                            | compare with README      |
| S3-R4 | stage 1 styles reused                         | [frontend/src/App.css](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ee90c9c72ea234cb25aa45a97a3771abb3697dd4/frontend/src/App.css)                                           | look at the page         |
| S3-R5 | node_modules ignored, build passes            | [frontend/.gitignore](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ee90c9c72ea234cb25aa45a97a3771abb3697dd4/frontend/.gitignore)                                             | npm run build            |
| S3-R6 | README Stage 3 section + AI log               | [README.md#L37](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ee90c9c72ea234cb25aa45a97a3771abb3697dd4/README.md#L37), [ai-log/etapa-03.md](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/ee90c9c72ea234cb25aa45a97a3771abb3697dd4/ai-log/etapa-03.md)            | read                     |
| S3-R7 | commit "Stage 3" pushed                       | [ee90c9c](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/commit/ee90c9c72ea234cb25aa45a97a3771abb3697dd4)                                                                            | commit history           |

## Stage 2 checklist

| ID    | Requirement                                   | Where                                                                                     | How to check            |
| ----- | --------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------- |
| S2-R1 | JS file linked, logs on page load             | [index.html#L150](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/3c553735743d5bd9637a8a974b6a20fcfd02ef43/index.html#L150)                                                     | open page, F12          |
| S2-R2 | 3+ items with id, name, state, tag            | [comenzi.js#L4-L11](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/3c553735743d5bd9637a8a974b6a20fcfd02ef43/comenzi.js#L4-L11)                                                 | read                    |
| S2-R3 | list, count, search, add, toggle, delete      | [comenzi.js#L15-L90](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/3c553735743d5bd9637a8a974b6a20fcfd02ef43/comenzi.js#L15-L90)                                               | console output          |
| S2-R4 | add rejects empty name and invalid tag        | [comenzi.js#L47-L70](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/3c553735743d5bd9637a8a974b6a20fcfd02ef43/comenzi.js#L47-L70), tests [L114-L117](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/3c553735743d5bd9637a8a974b6a20fcfd02ef43/comenzi.js#L114-L117)   | last 3 console lines    |
| S2-R5 | original array unchanged after add            | [comenzi.js#L104](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/3c553735743d5bd9637a8a974b6a20fcfd02ef43/comenzi.js#L104)                                                     | console line            |
| S2-R6 | README Stage 2 section + AI log               | [README.md#L30](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/3c553735743d5bd9637a8a974b6a20fcfd02ef43/README.md#L30), [ai-log/etapa-02.md](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/blob/3c553735743d5bd9637a8a974b6a20fcfd02ef43/ai-log/etapa-02.md)            | read                    |
| S2-R7 | commit "Stage 2" pushed                       | [3c55373](https://github.com/andyt777/Proiect-tehnologii-web---FooddeliveryApp/commit/3c553735743d5bd9637a8a974b6a20fcfd02ef43)                                                                            | commit history          |

## AI usage

| Tool   | Used for                                                                  |
| ------ | ------------------------------------------------------------------------- |
| Claude | README draft, HTML structure and CSS (Grid, Flexbox, dark theme), stage 1 |
| Claude | data array, immutable functions and console tests in comenzi.js, stage 2 |
| Claude | restyled the mockup in a food-delivery-app look (top bar, categories, cards), stage 2 |
| Claude | Vite + React setup, App.jsx with computed header values, stage 3          |
| Claude | ComandaCard and ComandaList components, list rendered from data, stage 4  |
| Claude | redesign after a Figma Community template (dark theme, card grid, layout), stage 4 |
| Claude | list in state, toggle and delete, light / dark theme button, stage 5      |
| Claude | delete dialog and redesign after my CodeAlpha restaurant project, stage 5 |
| Claude | menu, cart drawer and placing orders, unit tests and code review, cart |
| Claude | short Romanian comments on every line of code, stage 6                    |
| Claude | db.json, api.js, loading / error states, retry, timeout, search, tests, stage 6 |
| Claude | redesign: photo hero, category filter, photo menu, bento summary, grouped orders, helper tests |
| Claude | "Comandă specială" form, validation, request() and server-first add / toggle / delete / undo / cart, tw.json, tests, stage 7 |
| Claude | React Router pages (layout, detail, about, 404), fetchComanda, CSS Modules split, tests, stage 8 |
| Claude | „Pădure” redesign: tokens, Gabarito, restaurant / cart / favourites pages, shared state, status steps, helper tests |
| Claude | Express backend in backend/ (five resources, whitelist validation, CORS, error handler), undo with a new id, backend tests, stage 9 |

Details per stage: see the ai-log/ folder.

## Status

- [x] Stage 1: static mockup
- [x] Stage 2: data logic in JavaScript
- [x] Stage 3: Vite and React project
- [x] Stage 4: components rendered from data
- [x] Stage 5: local state and events
- [x] Stage 6: loading data from a mock API
- [x] Stage 7: form and validation
- [x] Stage 8: routing and detail page
- [x] Stage 9: own backend with Express
- [ ] Stage 10: MariaDB and full CRUD
