// Redesign „Pădure”: datele de prezentare ale restaurantelor (slug pentru adresă, bucătărie, o descriere scurtă, fotografie).
// Descriu doar ce e adevărat în demo (preparatele din db.json): fără note, recenzii sau adrese inventate.
// Funcții pure (fără React), ca să poată fi testate cu `node --test`.
import { RESTAURANTE } from "./constants.js"; // numele exacte din db.json și categoria fiecăruia
import { normalizeaza } from "./cautare.js"; // litere mici, fără diacritice: baza slug-ului
import { imaginePreparat } from "./imagini.js"; // fotografia unui preparat, refolosită pentru restaurant

// Numele unui restaurant -> textul din adresă: „Pizzeria Napoli” -> „pizzeria-napoli”
export function slugDin(nume) { // primește orice valoare (de obicei numele restaurantului)
  return normalizeaza(nume) // „pizzeria napoli”: fără diacritice și fără spații duble
    .replace(/[^a-z0-9]+/g, "-") // orice nu e literă sau cifră devine „-”
    .replace(/^-+|-+$/g, ""); // fără „-” la început sau la final
} // sfârșitul funcției

// Ce scriem despre fiecare restaurant; cheia e numele exact din db.json. Descrierile spun doar ce e în meniu.
const DETALII = new Map([ // Map, nu obiect: „constructor” sau „toString” nu găsesc nimic
  ["Pizzeria Napoli", { bucatarie: "Italiană", descriere: "Pizza Margherita, Diavola și Quattro Formaggi.", foto: "Pizza Margherita" }], // pizzeria
  ["Burger Van", { bucatarie: "Americană", descriere: "Burgeri de vită, de pui și unul vegetarian.", foto: "Burger cu pui crocant" }], // burgerii
  ["Sushi Kyo", { bucatarie: "Japoneză", descriere: "Sushi, ramen cu porc și gyoza cu legume.", foto: "Ramen cu porc" }], // bucătăria asiatică
]); // sfârșitul hărții

// Lista completă, în ordinea din constants.js; înghețată, ca nimeni să n-o modifice din greșeală
export const RESTAURANTE_INFO = Object.freeze(RESTAURANTE.map((r) => { // un obiect pentru fiecare restaurant
  const detalii = DETALII.get(r.nume); // textele de mai sus (undefined pentru un restaurant fără detalii)
  return Object.freeze({ // obiect nou, înghețat
    nume: r.nume, // ex. „Burger Van”
    categorie: r.categorie, // ex. „Burgers”
    slug: slugDin(r.nume), // ex. „burger-van”
    bucatarie: detalii?.bucatarie ?? r.categorie, // fără detalii: măcar categoria
    descriere: detalii?.descriere ?? "", // fără detalii: niciun text inventat
    imagine: imaginePreparat(detalii?.foto), // „/img/....webp” sau null
  }); // sfârșitul obiectului
})); // sfârșitul listei

// Restaurantul din adresa /restaurante/:slug; null pentru un slug necunoscut (pagina afișează atunci 404)
export function restaurantDupaSlug(slug) { // primește textul din adresă
  if (typeof slug !== "string" || slug === "") return null; // useParams dă text; altceva nu e un slug
  return RESTAURANTE_INFO.find((r) => r.slug === slug) ?? null; // comparație exactă, fără litere mari
} // sfârșitul funcției

// Restaurantul cu numele exact din db.json (de pe un preparat sau dintr-o comandă); null dacă nu-l știm
export function restaurantDupaNume(nume) { // primește numele restaurantului
  return RESTAURANTE_INFO.find((r) => r.nume === nume) ?? null; // comparație exactă
} // sfârșitul funcției

// Preparatele unui restaurant, în ordinea din meniu
export function preparateRestaurant(meniu, nume) { // primește meniul și numele restaurantului
  return meniu.filter((p) => p.restaurant === nume); // listă nouă, doar cu preparatele lui
} // sfârșitul funcției
