# Stage 7: AI log

## Tools
- Claude (Claude Code)

## Conversations
- Claude Code session in VS Code, 16 Nov 2026 (Claude Code has no share link): the "Cer senin" palette and a design document for stages 7 and 8 first, then stage 7 itself, built by a subagent from that document and from the stage 7 guide.

## Key requests
### 1. What the form should create
- Asked: a form that fits Savoro. Customers do not set prices, so a TaskFlow-style "add an order with a price" form made no sense.
- Got: two options in the browser; I chose "Comandă specială": the customer asks one of the three restaurants for a dish that is not on the menu. Fields: dish (max 60 characters), restaurant, delivery. The order is saved with `pret: null`, `speciala: true` and `creata`, and the page shows "Preț la confirmare" instead of an invented price.
- Changed or rejected: Rejected a price input. The category is not a field: it comes from the restaurant (`src/constants.js`).

### 2. The stage 7 guide, adapted
- Asked: follow the guide: a common `request()` in `api.js`, a controlled form with `noValidate`, the message in the page, the button disabled while sending, fields cleared only on success, server first then state, `tw.json` and the `data-testid` attributes from table 7.3.
- Got: `request(path, options)` that keeps the stage 6 timeout and Romanian messages, plus `createComanda`, `updateComanda`, `deleteComanda`; `ComandaForm.jsx` with the validation in a pure function (`src/validare.js`) so it can be tested; `handleAdd` without `try`, so the error reaches the form; PATCH for "Livrată" and DELETE for the trash button, both replacing state with what the server returned; `tw.json` in the repository root; the test ids on the card, the list, the form and the page messages; the two-column layout (form 1fr, list 2fr).
- Changed or rejected: The list condition became `!loading`, so a failed toggle or delete shows an error above the list instead of hiding it.

### 3. Delete without a dialog
- Asked: what to do with the stage 5 confirmation dialog, since the checker clicks delete and expects the order to disappear.
- Got: `ConfirmDialog` was removed; delete is immediate and the 5-second "Anulează" message stays. Undo sends the deleted order again with its old id (json-server 0.17 keeps the id, and refuses a duplicate), so it comes back the same and in its place.
- Changed or rejected: Kept the undo message instead of the dialog (the Gmail pattern). "Anulează" is closed when a new order is sent, because the new order could get the deleted id and undo would then fail.

### 4. The cart on the server
- Asked: placing an order from the cart should also be saved.
- Got: `cosInComenzi` no longer invents ids; one POST per cart line with `Promise.allSettled`. Saved lines join the list and leave the cart; failed lines stay in the cart and the drawer shows why.
- Changed or rejected: The cart button uses `aria-disabled` instead of `disabled` while sending, so the keyboard focus stays in the drawer.

### 5. Checks
- Asked: lint, tests and build.
- Got: `npm run lint` without errors, `npm test` with 174 passing tests (136 before; new: validation, restaurant → category, `tw.json`, `request` with a fake `fetch`, POST / PATCH / DELETE, `null` prices, the cart without ids), `npm run build` without errors. `db.json` was not changed.
- Changed or rejected: The browser checks from step 7 of the guide (empty submit, add + refresh, toggle / delete + refresh, API stopped, `--delay 3000`) were left for a separate run with json-server.

## What I learned / what did not work
- A controlled field needs both `value` and `onChange`; `value` alone locks it.
- `e.preventDefault()` has to be the first line of the submit handler, otherwise the page reloads.
- Clearing the form must come after `await`, never in `finally`, or the text is lost when saving fails.
- `res.json()` on a 204 answer throws "Unexpected end of JSON input", so `request` returns `null` for 204.
- json-server 0.17 gives new orders max id + 1 and accepts a POST with an id it does not have yet.
- `Promise.all` stops at the first failure; `Promise.allSettled` waits for every request, which is what a partial cart needs.
