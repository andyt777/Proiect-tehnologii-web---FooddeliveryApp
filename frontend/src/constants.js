// Etapa 7: valorile fixe ale formularului „Comandă specială”, într-un singur loc (formularul, validarea și testele le refolosesc).
// Fără React, ca să poată fi testate cu `node --test`.
import { ETICHETE_LIVRARE } from "./livrare.js"; // tipurile de livrare există deja; nu le scriem a doua oară

// Restaurantele din meniu, fiecare cu categoria lui; numele sunt exact cele din db.json („Pizzeria Napoli”, ...)
export const RESTAURANTE = Object.freeze([ // înghețat: nimeni nu-l poate modifica din greșeală
  Object.freeze({ nume: "Pizzeria Napoli", categorie: "Pizza" }), // pizzeria
  Object.freeze({ nume: "Burger Van", categorie: "Burgers" }), // burgerii
  Object.freeze({ nume: "Sushi Kyo", categorie: "Asian" }), // bucătăria asiatică
]); // sfârșitul listei

export const TIPURI_LIVRARE = Object.freeze(Object.keys(ETICHETE_LIVRARE)); // ["standard", "express", "ridicare"], în ordinea din livrare.js

export const PREPARAT_MAX = 60; // lungimea maximă a numelui unui preparat cerut special (validarea suplimentară a temei)

// Categoria unui restaurant („Pizzeria Napoli” -> „Pizza”); null pentru un restaurant necunoscut
export function categorieRestaurant(nume) { // primește numele restaurantului
  return RESTAURANTE.find((r) => r.nume === nume)?.categorie ?? null; // comparație exactă; `?.` evită eroarea când nu găsim nimic
} // sfârșitul funcției
