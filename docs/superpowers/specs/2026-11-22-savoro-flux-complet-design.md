# Savoro — full order flow on the frontend (packages A, B, C)

Date: 2026-11-22 · Branch: `redesign/padure` · Source: `ai-log/Savoro_plan_de_dezvoltare.md` (§3, §5), limited to what fits up to course stage 8.

## Why
Demonstrate the plan's main scenario end to end — the client orders, the restaurant accepts, a Savoro courier delivers, the client follows every step — using only what stages 1–8 allow: React + React Router + CSS Modules, json-server through `src/api.js`, `localStorage`. No own server, no real auth, no new npm dependencies, no real payments, no AI.

## Hard constraints
- Every existing `data-testid` keeps its meaning; list + „Comandă specială” form stay on `/`; delete removes immediately; `item-toggle` still flips `livrata`.
- `livrata` (from `tw.json`) stays on every order and is always kept in sync with the new state (see mapping). Seed orders without the new fields must still render correctly (derive defaults in a pure helper; never assume the fields exist).
- Pure logic in plain `.js` modules with `node:test` tests; lint/test/build pass. Romanian end-of-line comment on every source line. Pădure visual system (see `2026-11-21-savoro-padure-redesign-design.md`), including its anti-goals.
- Roles are a **demo switcher, not security**: say so in the UI (a short note in the switcher) and in README.
- No invented data presented as real. Demo couriers are labelled as demo.

## Data model (json-server)
Order (`comenzi`) — existing fields unchanged, new optional fields:
- `stare` — order state: `plasata` → `acceptata` → `in_preparare` → `gata` → `in_livrare` → `livrata`; side exits `anulata` (client, only before `in_preparare`), `respinsa` (restaurant, only from `plasata`). For `livrare: "ridicare"` the path skips `in_livrare` (`gata` → `livrata` when the client picks it up).
- `plata` — `{ metoda: "card_simulat" | "numerar", stare: "neplatita" | "platita" | "rambursata" }`. Card simulat → `platita` at placement; numerar → `platita` when delivered; cancelled/rejected paid orders → `rambursata`.
- `livrareStare` — delivery state, separate: `neasignata` → `asignata` → `spre_restaurant` → `preluata` → `spre_client` → `livrata`. Absent for `ridicare`.
- `livratorId`, `timpPreparare` (minutes, set by restaurant), `istoric` (`[{ stare, la }]` ISO timestamps, appended on every transition — used for metrics), `adresa` (text, null for ridicare), `contact` (`{ nume, telefon }`), `programataLa` (ISO or null), `cupon` + `reducere` (lei), `motiv` (rejection/cancel reason).
- Sync rule: `livrata === (stare === "livrata")`. Toggling `item-toggle` on `/` moves the order to `livrata` (or back to the state before it, else `plasata`) through the same pure transition helper.
- Seed defaults: missing `stare` → `livrata ? "livrata" : "plasata"`; missing `plata` → `{ metoda: "numerar", stare: livrata ? "platita" : "neplatita" }`.

New resources: `livratori` (2–3 demo couriers: `{ id, nume, online }`, names clearly demo), `recenzii` (`{ id, comandaId, restaurant, nota 1–5, text, creata }`, empty at start).

All transitions go through one pure module (e.g. `src/stari.js`): allowed-transition table, `poateTrece(comanda, stareNoua, rol)`, `aplicaTranzitie(comanda, stareNoua, acum)` returning the PATCH body (including `livrata`, `plata`, `istoric`). UI never builds these objects by hand. (Frontend-only validation is not security — note it.)

## Package A — client flow
1. Statuses on order card, detail page (timeline from `istoric`, real timestamps when present), and list grouping (active vs finished).
2. Cancel order from detail page while allowed, with reason; confirm inline (not a modal on the list — delete on the list must stay immediate).
3. Checkout `/cos`: contact + address (from saved profile or typed), delivery type, schedule (now / a time today ≥ 30 min ahead), payment (card simulat with a clear „simulare, nu introduce date reale” note and **no card number fields**, or numerar), then place. Validation like stage 7 (`validare.js` style, pure + tested).
4. `/cont`: name, phone, saved addresses (add/edit/delete, choose default) in `localStorage` with try/catch + shape validation like `citesteCos`.
5. In-app notifications: while the client has active orders, poll `/comenzi` (e.g. every 10 s, paused when the tab is hidden), show a toast when a state changes, use the existing `aria-live` region.

## Package B — role views (demo)
Role switcher in the layout (Client / Restaurant / Livrator / Admin), stored in `localStorage`. Client nav stays the default; others add their own route.
6. `/restaurant`: pick a restaurant; columns or sections Noi / În preparare / Gata. Accept (set `timpPreparare`, and price for „Comandă specială” orders with `pret: null`), reject with reason, start preparing, mark ready. For pickup orders, mark picked up.
7. `/livrator`: pick a demo courier, toggle online; available runs (ready or preparing, `neasignata`, not pickup); accept; steps spre restaurant → preluată → spre client → livrată; a simulated route drawn as inline SVG (restaurant → client), position advancing on a timer while the run is active, respects reduced motion. No real map, no GPS.
8. `/admin`: all orders with all three states, filters, late orders (rule based on `istoric` timestamps vs expected durations from `livrare.js` + `timpPreparare`), manual courier assignment, cancel; indicators from `istoric`: count, value, average acceptance time, prep time, delivery time, completion and cancel rates. Event log = flattened `istoric` across orders, newest first.

## Package C — extras
10. Reviews: on a delivered order's detail page, one review per order (1–5 + optional text, validated); restaurant page shows average + reviews from `/recenzii` (show nothing when there are none — no fake ratings).
11. Coupons: fixed rules in a constants module (e.g. a percentage code with a minimum, a fixed-amount code for the first order computed from local history); applied on `/cos`, stored as `cupon` + `reducere`, shown on detail. Pure + tested.
12. Recommendations: rule based, from the client's order history (most-ordered category → dishes not yet ordered; fallback: most-ordered dishes overall); a „Pentru tine” row on home, hidden with no history. Explain the rule in a short line under the title. Not AI.

## Left to the builder
Component breakdown, exact copy, polling interval details, layout of the role views (follow the Pădure system).
