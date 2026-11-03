# Savoro redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved „Cinematic + Fresh market + Bento” redesign of the Savoro React app without changing its behaviour.

**Architecture:** State stays in `App.jsx`. New pure helpers (`imagini.js`, `rezumat.js`, `potrivesteCategoria` in `categorii.js`) are unit-tested with `node:test`. Two new presentational components (`CategoriiCarduri`, `RezumatBento`); existing components get photos and new classes; `App.css` carries the visual work.

**Tech Stack:** React 19, Vite 8, plain CSS with custom properties, lucide-react, json-server, `node --test`, Playwright MCP for browser checks.

**Spec:** `docs/superpowers/specs/2026-11-03-savoro-redesign-design.md`

## Global Constraints

- Every source line ends with a Romanian comment (existing convention, also in CSS blocks where practical).
- Do not modify `api.js`, `cos.js`, `cautare.js`, `format.js`, `livrare.js`, `db.json`, `tests/db.test.js`.
- No new npm dependencies. No routing. No dark-by-default.
- `BonComanda` keeps its current markup and look (only placement/stacking may change).
- Every number on screen derives from `comenzi`/`meniu`; „cheltuiți luna asta” → „cheltuiți în total”.
- Images: `/img/*.webp`, explicit `width`/`height`, `loading="lazy"` except the hero.
- Commit locally on `redesign/cinematic`; never push.

## Review Focus

1. Search + category active together with zero matches → empty state names both and its button clears both.
2. An order whose dish has a quantity suffix („Pizza Diavola × 2”) or an unknown dish → still gets the right photo or the category icon fallback, never a broken image.
3. Toggling the last pending order → „Pe drum” divider disappears, the list does not jump or duplicate a `viewTransitionName`.
4. Empty order list / empty menu / API down → bento shows dashes (loading/error) or zeros (ready, empty), never NaN.
5. Keyboard: category buttons, add/stepper over photos and the hero CTA reachable with Tab, focus ring visible on photos.

---

### Task 1: Pure helpers (photos, summary, category filter)

**Files:**
- Create: `frontend/src/imagini.js`, `frontend/src/rezumat.js`
- Modify: `frontend/src/categorii.js` (add export)
- Test: `frontend/tests/imagini.test.js`, `frontend/tests/rezumat.test.js`, `frontend/tests/categorii.test.js`

**Interfaces — Produces:**
- `imaginePreparat(preparat: string): string | null` — strips a trailing ` × N`, returns `/img/<file>.webp` for the 9 dishes, else `null`.
- `IMAGINI_CATEGORIE: { Pizza: "/img/pizza-diavola.webp", Burgers: "/img/burger-vita.webp", Asian: "/img/sushi-platou.webp" }`
- `imagineComanda(comanda: {preparat, categorie}): string | null` — `imaginePreparat(...) ?? IMAGINI_CATEGORIE[categorie] ?? null`.
- `rezumatComenzi(comenzi): { numar, total, peDrum, livrate, peCategorie: Record<string, number>, peLivrare: Record<string, number> }` — `peCategorie` has a key for every `CATEGORII` name, `peLivrare` for every `ETICHETE_LIVRARE` key (zeros included).
- `potrivesteCategoria(produs, categorie: string | null): boolean` — `null` matches everything.
- `restauranteDinMeniu(meniu): string[]` (in `rezumat.js`) — unique restaurant names, first-seen order.

- [ ] Tests: `imaginePreparat("Pizza Diavola × 2") === "/img/pizza-diavola.webp"`; unknown → `null`; `imagineComanda({preparat:"X", categorie:"Asian"}) === "/img/sushi-platou.webp"`; every `db.json` menu dish has a photo and every file exists in `public/img`; `rezumatComenzi(db.comenzi)` → `{numar:6,total:331,peDrum:3,livrate:3}`, each category 2, each delivery type 2; `rezumatComenzi([])` → zeros, no NaN; `potrivesteCategoria` null/hit/miss; `restauranteDinMeniu(db.meniu)` → `["Pizzeria Napoli","Burger Van","Sushi Kyo"]`.
- [ ] Run `npm test` → all pass (old + new).
- [ ] Commit `Redesign: photo, summary and category helpers`.

### Task 2: Components and layout

**Files:**
- Create: `frontend/src/components/CategoriiCarduri.jsx`, `frontend/src/components/RezumatBento.jsx`
- Modify: `App.jsx`, `Meniu.jsx`, `MeniuCard.jsx`, `ComandaList.jsx`, `ComandaCard.jsx`, `Schelete.jsx`, `App.css`, `index.html` (preload hero, fonts unchanged)

**Interfaces — Consumes:** Task 1 exports.
- `CategoriiCarduri({ meniu, activa: string|null, onAlege(categorie|null), incarcare })`
- `RezumatBento({ comenzi, stare: "incarcare"|"eroare"|"gata" })`
- `Meniu` gains props `categorie: string|null` (for meta/empty text) and `onStergeFiltrele` replaces `onStergeCautarea` (clears search + category, focuses search).
- `App`: `const [categorieActiva, setCategorieActiva] = useState(null)`; `meniuAfisat = meniu.filter(p => potrivesteCautarea(p, cautare) && potrivesteCategoria(p, categorieActiva))`; „Vezi meniul” reuses the scroll/focus code (extract `mergiLaMeniu()` used by both).

- [ ] Implement per spec sections 1–7; remove the `proof` band and the old order-category chips (their data moves to the bento).
- [ ] `npm run lint` and `npm run build` clean; `npm test` green.
- [ ] Commit `Redesign: cinematic hero, photo menu, bento and grouped orders`.

### Task 3: Docs

- [ ] README: „Redesign” section (what changed, why, decisions), photo credits table (from spec), `.gitignore` gets `.playwright-mcp/` and `.superpowers/`.
- [ ] Commit `Redesign: README and photo credits`.

### Task 4: Verification

- [ ] test-engineer: review/extend unit tests, run `npm test`.
- [ ] code-reviewer: review the branch diff vs `pre-redesign`.
- [ ] Playwright (step tools only, no `browser_run_code_unsafe`) at 1440, 768, 390: every section, search, category filter, add/stepper, cart drawer + place order, toggle between groups, delete → confirm → undo, theme, keyboard focus, API-down error + retry; console free of errors; after-screenshots in `docs/screenshots/`.
