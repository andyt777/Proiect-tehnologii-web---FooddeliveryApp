# Savoro

Savoro is a food delivery tracker: customers keep a list of their orders,
see which ones are still on the way and mark them as delivered.

## Data model

Since stage 6 the data lives in `frontend/db.json` (served by json-server), not in React code:
`comenzi` holds the orders described below, `meniu` the 9 dishes that can be added to the cart
(`id` "p1".."p9", `preparat`, `restaurant`, `categorie`, `pret`).

| Field      | In code (`db.json` → `comenzi`) | Type   | Notes                                    |
| ---------- | ---------------------- | ------------ | ------------------------------------------------ |
| id         | `id`                   | number       | unique, new id = max existing id + 1 (stage 2)   |
| name       | `preparat`             | text         | the ordered dish, required, max 100 chars        |
| delivered  | `livrata`              | boolean      | toggled from the list, default false             |
| delivery   | `livrare`              | fixed values | Standard, Express, Pickup (`LIVRARI`)            |
| category   | `categorie`            | relation     | Pizza, Burgers, Asian (`CATEGORII`)              |
| user       | (not yet)              | relation     | the customer who placed the order (from week 11) |
| restaurant | `restaurant`           | text         | extra field, where the order comes from          |
| price      | `pret`                 | number       | extra field, in lei, must be positive            |

Sample data used across all stages:

1. Pizza Margherita, active, Express, Pizzeria Napoli, 42 lei
2. Beef burger with fries, done, Standard, Burger Van, 48 lei
3. Sushi set (12 pcs), active, Pickup, Sushi Kyo, 65 lei

`db.json` adds three more (ramen, 2 × Pizza Diavola, veggie burger), so there are 6 orders.

## How to run

Two terminals, both in `frontend/` (`npm run api` keeps running, so it needs its own terminal).

Terminal 1, the mock API at http://localhost:3001:

```
cd frontend
npm install
npm run api
```

Terminal 2, the app at http://localhost:5173:

```
cd frontend
npm run dev
```

Then open the address printed in terminal 2. Without `npm run api` the page shows an error
with a "Încearcă din nou" button. `npm test` runs the unit tests (no server needed).

The stage 1 and 2 files (static page and `comenzi.js`) were moved to `mockup/`.

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
- placing the order turns every cart line into a new order "on the way" (new id = max id + 1),
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
- deleting asks first, in our own `ConfirmDialog` (`<dialog>`, closes with Esc, a backdrop click or "Renunță"),
  never with the browser's `confirm()`; the deletion itself is still `handleDelete` with `filter`

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
with a single column until the form comes back in stage 7.

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

Details per stage: see the ai-log/ folder.

## Status

- [x] Stage 1: static mockup
- [x] Stage 2: data logic in JavaScript
- [x] Stage 3: Vite and React project
- [x] Stage 4: components rendered from data
- [x] Stage 5: local state and events
- [x] Stage 6: loading data from a mock API
- [ ] Stage 7: form and validation