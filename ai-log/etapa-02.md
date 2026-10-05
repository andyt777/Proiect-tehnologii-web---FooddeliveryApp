# Stage 2: AI log

## Tools
- Claude (Claude Code)

## Conversations
- Claude Code session in VS Code, 5 Oct 2026 (Claude Code has no share link): reading the stage 2 guide, writing comenzi.js, README, restyling the page, publishing on GitHub.

## Key requests
### 1. Data and naming
- Asked: move the three sample orders from the HTML into a JavaScript array, following the stage 2 guide.
- Got: `comenzi.js` with the `comenzi` array (id, preparat, livrata, livrare, categorie, restaurant, pret) and the fixed values `LIVRARI` and `CATEGORII`, matching the values from the form in index.html.
- Changed or rejected: Kept it. I used Romanian names (preparat, livrata, pret) like the form in index.html, and added a column in the README that maps them to the English field names.

### 2. Functions
- Asked: listing, counting, search, add with validation, toggle and delete, all without changing the original array.
- Got: `listeazaPreparate`, `numaraPeDrum`, `cautaComenzi` (dish or restaurant), `gasesteDupaId`, `nextId` with `reduce`, `adaugaComanda`, `comutaLivrata`, `stergeComanda`.
- Changed or rejected: Kept it. I also kept the extra checks for my own fields: restaurant not empty, positive price, valid category.

### 3. Console tests
- Asked: tests grouped by section, as in the guide.
- Got: Citire / Adăugare / Modificare și ștergere / Validare, including a check that the original still has 3 orders and that the id after a delete is max + 1, not length + 1.
- Changed or rejected: Kept it. There are 3 validation tests instead of 2, because price is an extra field and needs its own check.

### 4. New look for the page
- Asked: make the page look like DoorDash.
- Got: white sticky top bar (logo, address pill, search, cart), bold heading with the stats, round category icons, red accent #EB1700, black pill for the active filter, cards with larger images and no colored stripe; dark theme and narrow screens kept. Only the style is inspired, the Savoro name stays and no DoorDash logo is used.
- Changed or rejected: Kept it. It was committed separately from the stage 2 code, so the stage 2 commit only has the data logic.

## What I learned / what did not work
- map, filter, find and reduce do not change the array they are called on, so I can return a new list instead of using push. React needs this in stage 5, because it compares references to decide when to redraw.
- To change one object inside the list I copy it with { ...c, livrata: !c.livrata } instead of setting c.livrata directly.
- The new id must be the max existing id + 1 (with reduce), not lista.length + 1: after deleting id 3, length + 1 would give an id that already exists. The console test shows id 5 after a delete.
- The search compares both texts with toLowerCase(), otherwise "pizza" would not find "Pizza Margherita".
- In the console, every message shows the file and line it came from on the right, so I can jump to the code from there.
- Variable and function names are written without diacritics, the console messages with diacritics.
