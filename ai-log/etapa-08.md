# Stage 8: AI log

## Tools
- Claude (Claude Code)

## Conversations
- Claude Code session in VS Code, 16 Nov 2026 (Claude Code has no share link): stage 8 built by a subagent from the stage 7–8 design document and the stage 8 guide, after stage 7 was committed.

## Key requests
### 1. Routes and a shared layout
- Asked: follow the guide: `react-router-dom`, `BrowserRouter` in `main.jsx`, `App.jsx` with only the route map inside `<Route element={<Layout />}>`, pages for the list, the detail (`/comenzi/:id`, the resource from `tw.json`), "Despre" and 404.
- Got: `Layout.jsx` with the logo (link to `/`), `<nav data-testid="nav">` with `NavLink` "Comenzi" (`end`) and "Despre", the theme toggle (theme state moved here) and the footer; `ComenziPage.jsx` with the whole stage 7 page moved almost unchanged; `DesprePage.jsx` and `NotFoundPage.jsx` (`data-testid="not-found"`).
- Changed or rejected: Search and the cart button were not moved into the shared header, because their state belongs to the orders page. They sit in a sticky bar under the header, only on `/`, styled as a second header row.

### 2. The detail page
- Asked: a detail page that shows more than the card and handles a missing id.
- Got: `fetchComanda(id)` through `request()`; the guide's effect with `ignore` and `[id]`; state that starts as loading with no error, so the `set-state-in-effect` lint rule is not triggered; an inner component with `key={id}` so another id starts fresh. The page shows a large photo, category, restaurant, price or "Preț la confirmare", status, delivery and estimated time, the placed date when `creata` exists, the order number and a link back. `/comenzi/999` shows the 404 message from `request()`.
- Changed or rejected: Kept `data-testid="item-title"` on the card's `h3` and put `item-link` on the `Link` inside it, so the stage 7 checks still find the title.

### 3. CSS Modules
- Asked: move the big `App.css` next to the components without changing how the page looks.
- Got: `index.css` with tokens, reset and shared classes; one `.module.css` per component and page. The skeletons import the real components' modules. `index.css` is imported before `App` so module rules come later in the bundle.
- Changed or rejected: One old rule never applied (`border-radius: 999px` on "Vezi meniul" was overridden by `.btn-primary` further down `App.css`). Moving it into a module would have changed the button, so it was removed to keep the page identical.

### 4. Checks
- Asked: lint, tests and build.
- Got: `npm run lint` without errors, `npm test` with 181 passing tests (174 before; new: `fetchComanda`, `formatData`), `npm run build` without errors. `db.json` was not changed.
- Changed or rejected: The browser checks (navigation without reload, refresh on `/comenzi/1`, `/comenzi/999`, `/ceva`, console queries) were left for a separate run with json-server.

## What I learned / what did not work
- `NavLink` to `/` needs `end`, otherwise it stays active on every page.
- `useParams()` always returns text, so the id is passed to the API as text and encoded.
- With CSS Modules the order of the CSS files matters: a global class written later can silently beat a module class, so the global file is imported first.
- Two components can share one module by importing it (the skeletons), instead of copying rules.
- Refreshing `/comenzi/1` works in Vite because the dev server answers every path with `index.html`.
