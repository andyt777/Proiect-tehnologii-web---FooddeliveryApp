// Fotografiile preparatelor: fișiere WebP locale din public/img (Unsplash, autorii sunt în README).
// Funcții pure (fără React), ca să poată fi testate cu `node --test`.

// Numele preparatului din meniu -> numele fișierului; Map, nu obiect, ca „constructor” sau „toString” să nu găsească nimic
const FISIERE_PREPARATE = new Map([ // fiecare fotografie arată chiar preparatul la care e pusă
  ["Pizza Margherita", "pizza-margherita"], // Pizzeria Napoli
  ["Pizza Diavola", "pizza-diavola"], // Pizzeria Napoli
  ["Pizza Quattro Formaggi", "pizza-quattro-formaggi"], // Pizzeria Napoli
  ["Burger de vită cu cartofi", "burger-vita"], // Burger Van
  ["Burger cu pui crocant", "burger-pui"], // Burger Van
  ["Burger vegetarian", "burger-vegetarian"], // Burger Van
  ["Platou sushi (12 buc.)", "sushi-platou"], // Sushi Kyo
  ["Ramen cu porc", "ramen-porc"], // Sushi Kyo
  ["Gyoza cu legume (6 buc.)", "gyoza"], // Sushi Kyo
]); // sfârșitul hărții

// Calea publică a unui fișier: Vite servește public/ de la rădăcina site-ului
function cale(fisier) { // primește numele fără extensie
  return `/img/${fisier}.webp`; // ex. „/img/gyoza.webp”
} // sfârșitul funcției

// Fotografia unui preparat; comenzile din coș au sufixul „ × 2”, pe care îl ignorăm. null = nu avem fotografie
export function imaginePreparat(preparat) { // primește numele preparatului (din meniu sau dintr-o comandă)
  const baza = String(preparat ?? "").replace(/ × \d+$/, ""); // „Pizza Diavola × 2” devine „Pizza Diavola”
  const fisier = FISIERE_PREPARATE.get(baza); // undefined pentru un preparat necunoscut
  return fisier ? cale(fisier) : null; // null: componenta afișează iconița categoriei
} // sfârșitul funcției

// Cardurile de categorii refolosesc câte o fotografie de preparat (aceeași categorie)
export const IMAGINI_CATEGORIE = Object.freeze({ // înghețat: nimeni nu-l poate modifica din greșeală
  Pizza: cale("pizza-diavola"), // pizza cu salam picant
  Burgers: cale("burger-vita"), // burgerul de vită
  Asian: cale("sushi-platou"), // platoul de sushi
}); // sfârșitul obiectului

// Fotografia unei comenzi: a preparatului, altfel a categoriei, altfel null (iconiță)
export function imagineComanda(comanda) { // primește o comandă { preparat, categorie, ... }
  const categorie = comanda.categorie; // categoria comenzii
  const aCategoriei = Object.hasOwn(IMAGINI_CATEGORIE, categorie) ? IMAGINI_CATEGORIE[categorie] : null; // doar cheile proprii, nu cele moștenite
  return imaginePreparat(comanda.preparat) ?? aCategoriei; // ?? alege a doua variantă doar când prima e null
} // sfârșitul funcției
