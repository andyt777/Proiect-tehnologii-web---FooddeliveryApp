# Savoro

Savoro is a food delivery tracker: customers keep a list of their orders,
see which ones are still on the way and mark them as delivered.

## Data model

| Field      | In code (`comenzi.js`) | Type         | Notes                                            |
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

Open index.html in a browser. No build step, no server.
To see the stage 2 results, open the browser console (F12).

## Stage 2: data logic

Plain JavaScript, no DOM. `comenzi.js` holds the `comenzi` array and the functions
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

Details per stage: see the ai-log/ folder.

## Status

- [x] Stage 1: static mockup
- [x] Stage 2: data logic in JavaScript
- [ ] Stage 3: Vite and React project