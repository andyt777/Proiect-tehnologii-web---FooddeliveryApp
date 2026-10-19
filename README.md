# Savoro

Savoro is a food delivery tracker: customers keep a list of their orders,
see which ones are still on the way and mark them as delivered.

## Data model

| Field      | In code (`App.jsx`)    | Type         | Notes                                            |
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

## How to run

```
cd frontend
npm install
npm run dev
```

Then open the address printed in the terminal (http://localhost:5173).

The stage 1 and 2 files (static page and `comenzi.js`) were moved to `mockup/`.

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

Details per stage: see the ai-log/ folder.

## Status

- [x] Stage 1: static mockup
- [x] Stage 2: data logic in JavaScript
- [x] Stage 3: Vite and React project
- [x] Stage 4: components rendered from data
- [ ] Stage 5: local state and events