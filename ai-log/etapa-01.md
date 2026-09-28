# Stage 1: AI log

## Tools
- Claude (claude.ai)

## Conversations
- <https://claude.ai/share/49949648-3b52-4c0a-9174-c951e807b5ac> (choosing the theme, README draft, HTML/CSS mockup)

## Key requests
### 1. Theme and data model
- Asked: adapt my Databases project (Savoro, food delivery) to the required item fields.
- Got: orders as items: dish name, delivered yes/no, delivery type (Standard, Express, Pickup), restaurant category, customer; plus two extra fields, restaurant and price.
- Changed or rejected: <I kept the Savoro theme from my Database project, but only the idea, the code is new>

### 2. HTML and CSS mockup
- Asked: build the stage 1 page following the guide skeleton.
- Got: semantic HTML, Grid for the two columns, Flexbox for form and cards, colors as CSS variables, dark theme and :focus-visible.
- Changed or rejected: <the first layout was too close to the one presented in tje course>

### 3. A less generic layout
- Asked: make the page structure richer, so it does not look like the TaskFlow example.
- Got: header with stats, a delivery-type legend under the form, filter buttons above the list, cards with an image, ETA, price and a colored stripe per delivery type.
- Changed or rejected: <kept it>

## What I learned / what did not work
<3Grid is for the page layout (two columns), Flexbox for arranging things on one axis: the form fields, the cards and the parts inside a card.
Defining every color as a CSS variable makes the dark theme only a few lines: I just redefine the variables in prefers-color-scheme: dark.
The @media rule for narrow screens has to come last, otherwise the .container rule overrides it.
With Git I learned the difference between git clone and git init: after cloning I ran git init in the parent folder by mistake, and git add failed until I moved into the cloned folder with cd.>