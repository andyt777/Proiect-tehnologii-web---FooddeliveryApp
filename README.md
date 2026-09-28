# Savoro

Savoro is a food delivery tracker: customers keep a list of their orders,
see which ones are still on the way and mark them as delivered.

## Data model

| Field      | Type         | Notes                                            |
| ---------- | ------------ | ------------------------------------------------ |
| name       | text         | the ordered dish, required, max 100 chars        |
| delivered  | boolean      | toggled from the list, default false             |
| delivery   | fixed values | Standard, Express, Pickup                        |
| category   | relation     | Pizza, Burgers, Asian                            |
| user       | relation     | the customer who placed the order (from week 11) |
| restaurant | text         | extra field, where the order comes from          |
| price      | number       | extra field, in lei                              |

Sample data used across all stages:

1. Pizza Margherita, active, Express, Pizzeria Napoli, 42 lei
2. Beef burger with fries, done, Standard, Burger Van, 48 lei
3. Sushi set (12 pcs), active, Pickup, Sushi Kyo, 65 lei

## How to run

Open index.html in a browser. No build step, no server.

## AI usage

| Tool   | Used for                                                                  |
| ------ | ------------------------------------------------------------------------- |
| Claude | README draft, HTML structure and CSS (Grid, Flexbox, dark theme), stage 1 |

Details per stage: see the ai-log/ folder.

## Status

- [x] Stage 1: static mockup
- [ ] Stage 2: data logic in JavaScript