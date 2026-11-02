# Stage 6: AI log

## Tools
- Claude (Claude Code)

## Conversations
- Claude Code session in VS Code, 2 Nov 2026 (Claude Code has no share link): comments on every line, the cart (menu + drawer), reading the stage 6 guide, `db.json` and `api.js`, loading / error states, extras beyond the guide, tests, README.

## Key requests
### 1. Comments on every line
- Asked: a short Romanian comment at the end of every line of JavaScript / JSX, so I can explain any line when presenting.
- Got: end-of-line `// ...` comments in the `.js` files and between JSX attributes, `{/* ... */}` after JSX children, one comment per rule block in `App.css`.
- Changed or rejected: Kept it. The rule stayed for everything written later in the session.

### 2. Cart: menu and cart drawer
- Asked: a menu with dishes that can be added to a cart, a cart panel, and placing an order that turns the cart into new orders.
- Got: `src/cos.js` with pure functions (`adaugaInCos`, `schimbaCantitate`, `scoateDinCos`, `liniiCos`, `cosInComenzi`, `citesteCos`), the `Meniu` / `MeniuCard` / `Stepper` / `CosDrawer` components, the cart saved in `localStorage` under `cos`. Claude Code split the work between subagents: one for the implementation, one that wrote 72 unit tests (`node --test`, no new dependency), and one read-only code review; the review findings were then fixed.
- Changed or rejected: A few review points were left for later and done in stage 6 (see request 4).

### 3. Stage 6 from the guide
- Asked: follow the stage 6 guide, adapted to Savoro: `db.json` with at least 5 orders, json-server, `src/api.js`, the three states.
- Got: `frontend/db.json` with `comenzi` (the 3 orders from the README plus 3 more, numeric ids 1..6) and `meniu` (the 9 dishes, ids "p1".."p9"); `src/meniu.js` and `COMENZI_INITIALE` were deleted. json-server `0.17.4` as a dev dependency and the `"api"` script. `src/api.js` is the only file with `fetch` (`fetchComenzi`, `fetchMeniu`, `res.ok` check, `API_URL` from `VITE_API_URL`), `.env.example` documents the variable. In `App`: `useState([])`, `loading`, `error`, one `useEffect` with `async function load()`, `Promise.all`, `try / catch / finally` and the `ignore` cleanup. "Se încarcă…" messages, an error message that says to run `npm run api`, and `.info` / `.error` styles with new `--error-bg` / `--error-border` tokens in both themes, in the terracotta palette instead of the guide's pink.
- Changed or rejected: json-server is pinned to 0.17.4 on purpose, because 1.x creates random string ids and later stages need numeric ones. Toggle, delete, undo and placing an order stay local, as the guide says for this stage.

### 4. Extras beyond the guide
- Asked: retry without reloading, a timeout, response validation, skeletons, the cart working with a menu that arrives later, a working search, the leftovers from the cart review, tests for `api.js`.
- Got: an "Încearcă din nou" button (a `reincercari` counter in the effect dependencies); an `AbortController` with an 8 second timeout and Romanian messages for timeout and "Failed to fetch"; "Răspuns neașteptat de la server" when the answer is not a list; skeletons for menu, orders and receipt, with "—" instead of "0 lei" while loading; `citesteCos` now checks only the shape and the new `pastreazaDinMeniu` drops unknown dishes after the menu loads; `src/cautare.js` (`normalizeaza`, `potrivesteCautarea`) filters menu and orders, ignoring diacritics, with result counts and a "Șterge căutarea" empty state; Enter on a delivery option no longer places the order, the delivery goes back to Standard, the focus outline is removed only on two headings, no page scroll behind an open dialog, and `--header-h` is derived for phones instead of a hard-coded 140px. New tests: `api.test.js`, `db.test.js`, `cautare.test.js`; `meniu.test.js` was replaced by `db.test.js`.
- Changed or rejected: `import.meta.env` does not exist under Node, so `api.js` reads `import.meta.env?.VITE_API_URL`; I checked that a build with `VITE_API_URL` set still uses that address.

### 5. Checks
- Asked: run the project's checks and the API.
- Got: `npm run lint` without errors, `npm test` with 108 passing tests, `npm run build` without errors. With `npx json-server --watch db.json --port 3001`, `/comenzi` returned the 6 orders and `/meniu` the 9 dishes; with the server stopped, `api.js` answered "Serverul nu poate fi contactat".
- Changed or rejected: The page itself (skeletons, error panel, search, Enter on a radio button) was not checked in a browser in this session.

## What I learned / what did not work
- `fetch` only rejects when there is no answer at all; a 404 or 500 still resolves, so `res.ok` has to be checked by hand.
- `useEffect` cannot take an `async` function directly; the async `load()` lives inside it and is called right away.
- The `ignore` flag in the cleanup stops a late answer from overwriting state; in StrictMode the effect really runs twice in development.
- `Promise.all` starts both requests at once and fails as soon as one of them fails, so one `catch` covers both.
- `AbortController` + `setTimeout` gives `fetch` a time limit; the timer has to be cleared in `finally`, otherwise it would cancel a request that already finished.
- The page needs three states, not two: while `loading` is true the counters are unknown, so showing "0 lei" would be wrong.
