# Stage 4: AI log

## Tools
- Claude (Claude Code)

## Conversations
- Claude Code session in VS Code, 19 Oct 2026 (Claude Code has no share link): reading the stage 4 guide, writing the two components, checking the console and the empty list, README.

## Key requests
### 1. Components
- Asked: follow the stage 4 guide: replace the JSON list with cards drawn from the data, one component for an order and one for the list, in `src/components/`.
- Got: `ComandaCard.jsx` (receives `comanda` through props) and `ComandaList.jsx` (receives `comenzi`, early `return` with a message when empty, otherwise `map` with `key={comanda.id}` on `ComandaCard`). In `App.jsx` the `<pre>` was replaced with `<ComandaList comenzi={comenzi} />`.
- Changed or rejected: Kept it. I named the components after my theme (Comanda instead of Task) and kept the card markup from the stage 1 mockup (icon, restaurant, badge, time, price, status) instead of the simpler TaskFlow card.

### 2. Labels
- Asked: show the same texts as the mockup without changing the data.
- Got: `ETICHETE_LIVRARE` (ridicare → "Ridicare personală"), `DURATE_LIVRARE` (estimated time per delivery type) and `ICONITE_CATEGORIE` (Pizza → 🍕). The classes `card-${comanda.livrare}` and `badge-${comanda.livrare}` are built from the data and match the CSS from stage 1.
- Changed or rejected: The mockup had exact hours ("Livrată azi, 13:40"), which are not in the data; a delivered order now shows "Comandă încheiată" instead.

### 3. Checks
- Asked: check that there are no warnings in the console and that the empty list shows the message.
- Got: `npm run lint` and `npm run build` with no errors; a render of the app gives 3 cards, the delivered one with the `done` class, no React warnings; `ComandaList` with `[]` gives "Nu ai nicio comandă.".
- Changed or rejected: Kept it. To see the key warning from the guide, remove `key={comanda.id}` for a moment, save, look at the console, then put it back.

### 4. Redesign after a Figma template
- Asked: add an icon library and a font, then restyle the page after a Figma Community template, aligned and polished like a finished app.
- Got: `lucide-react` icons in the header and on the cards, the Urbanist font, the colors read from the Figma file with the Figma connector (dark grey, coral accent), category chips with a count per category, a grid of order cards, a common container for header, hero, content and footer, a footer with the design credit, a favicon and a phone layout. Checked in Chrome on desktop and at 390px.
- Changed or rejected: The first template I chose had a personal-use-only license that forbids web apps, so I picked another one. The template's photos were not used, because the orders have no images; the emojis stay. The light theme was dropped, because the design is dark.

## What I learned / what did not work
- A component is a function whose name starts with a capital letter; the props arrive as one object, destructured in the parameters (`{ comanda }`).
- The prop name in the parent (`comenzi={comenzi}`) must match the destructured name, otherwise the child gets `undefined`.
- `key` goes on the element returned directly by `map`, with the id, not the index, so React can tell the cards apart when one is deleted (stage 5).
- With `map((c) => { <Card /> })` (braces, no `return`) nothing appears and there is no error; round brackets return the JSX.
- Changing `livrata` in the array is enough to change the card look, no other code changes.
