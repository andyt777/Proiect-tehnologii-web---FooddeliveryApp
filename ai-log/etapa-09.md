# Stage 9: AI log

## Tools
- Claude (Claude Code)

## Conversations
- Claude Code session in VS Code, 23 Nov 2026 (Claude Code has no share link): stage 9 built by a subagent from the stage 9 guide and the development plan (`ai-log/Savoro_plan_de_dezvoltare.md`), after the plan §3.2–3.4 commit.

## Key requests
### 1. An Express backend next to the frontend
- Asked: follow the guide: `backend/` with `"type": "module"`, `src/server.js` that only listens on `PORT` (default 3001), `src/app.js` with `cors`, `express.json()`, `GET /health`, the routers, a 404 middleware and a 4-argument error handler; data in memory, seeded from the committed `db.json`.
- Got: `server.js`, `app.js` (with a `createApp()` factory, so every test starts from the seed, and `export default app`), `src/data/seed.json` copied from `git show HEAD:frontend/db.json` (not the working copy, which had personal test data), a small in-memory collection helper with `nextId` that never reuses a deleted id, `.gitignore` and `.env.example`.
- Changed or rejected: Not one router but five, because the app uses five resources (`comenzi`, `meniu`, `livratori`, `recenzii`, `restaurante`); each has its own id parser (number, menu text id, restaurant slug) and its own Romanian 404 message.

### 2. Validation on the server
- Asked: a whitelist validator per resource returning `{ erori, date }`, `partial` for PATCH, the same fixed values as the frontend, and server-side rules ("the frontend does not decide validity").
- Got: `src/validation.js` re-exports one validator per resource from `src/validation/`; a shared `valideazaCampuri` keeps only known fields and fills defaults on POST. Enum fields are checked; a dish from the menu gets its price and category from the menu (quantity from "× n"); reviews must point to a delivered order, once; a courier with an active trip cannot be deleted (409). Malformed JSON gives 400 "Corpul cererii nu este JSON valid".
- Changed or rejected: The full order state machine was not copied to the server (out of scope for this stage); it stays a follow-up. The backend does not import frontend files (they start separately), so the constants are duplicated and a frontend test compares them.

### 3. Frontend changes
- Asked: remove json-server and `db.json`, read `{ error }` in `request()`, check every call in `src/` against the new server, fix undo.
- Got: `request()` throws the server's message (fallback "Eroare server: <code>"); the `api` script and `json-server` were removed and `package-lock.json` updated; the data-integrity tests read `backend/src/data/seed.json`. Undo now posts the deleted order without its id and puts the returned order (new id) back in place.
- Changed or rejected: Keeping the old id on undo would have needed a special case in the whitelist; using the new id is simpler and the list keys, the tracking map and the detail links all use the returned object.

### 4. Checks
- Asked: backend tests with `node:test` and `fetch`, frontend tests, lint, build, and the guide's curl commands.
- Got: `npm test` in `backend/` with 30 passing tests; in `frontend/` `npm run lint` without errors, `npm test` with 501 passing tests (497 before; new: the `{ error }` message in `request()` and the backend constants check) and `npm run build` without errors. The guide's curl commands returned 200, 201, 400, 404 and 204.
- Changed or rejected: The browser console CORS check was left for a manual run.

## What I learned / what did not work
- `express.json()` marks broken JSON with `type: "entity.parse.failed"`; without handling it, the error handler would answer 400 with an English parser message.
- Express 5 forwards errors thrown in route handlers to the error handler, so a `throw` with a `status` is enough for 400 / 404.
- `cors({ origin })` with a fixed string always sends that origin; the browser then blocks every other site.
- A whitelist changes old habits: json-server stored any field (and any id) it got, so undo relied on that.
- `localhost` can resolve to IPv6 (`::1`) first: an old json-server still listening there answered instead of the new server. Using `127.0.0.1` in curl showed which server was replying.
