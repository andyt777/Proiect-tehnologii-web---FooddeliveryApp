// Savoro, Etapa 2: logica pe date.
// Fără DOM: funcțiile primesc o listă și întorc o listă nouă, fără să o modifice.

const LIVRARI = ["standard", "express", "ridicare"];
const CATEGORII = ["Pizza", "Burgers", "Asian"];

const comenzi = [
  { id: 1, preparat: "Pizza Margherita", livrata: false, livrare: "express", categorie: "Pizza", restaurant: "Pizzeria Napoli", pret: 42 },
  { id: 2, preparat: "Burger de vită cu cartofi", livrata: true, livrare: "standard", categorie: "Burgers", restaurant: "Burger Van", pret: 48 },
  { id: 3, preparat: "Platou sushi (12 buc.)", livrata: false, livrare: "ridicare", categorie: "Asian", restaurant: "Sushi Kyo", pret: 65 },
];

// --- Citire ---

function listeazaPreparate(lista) {
  return lista.map((c) => c.preparat);
}

function numaraPeDrum(lista) {
  return lista.filter((c) => !c.livrata).length;
}

// caută în numele preparatului și în numele restaurantului, fără să țină cont de litere mari
function cautaComenzi(lista, text) {
  const cautat = text.toLowerCase();
  return lista.filter(
    (c) =>
      c.preparat.toLowerCase().includes(cautat) ||
      c.restaurant.toLowerCase().includes(cautat)
  );
}

function gasesteDupaId(lista, id) {
  return lista.find((c) => c.id === id);
}

// --- Modificare ---

function nextId(lista) {
  return lista.reduce((max, c) => Math.max(max, c.id), 0) + 1;
}

function adaugaComanda(lista, preparat, livrare = "standard", restaurant = "", pret = 0, categorie = "Pizza") {
  const preparatCurat = preparat.trim();
  const restaurantCurat = restaurant.trim();

  if (preparatCurat === "") {
    console.log("Numele preparatului nu poate fi gol.");
    return lista;
  }
  if (preparatCurat.length > 100) {
    console.log("Numele preparatului are mai mult de 100 de caractere.");
    return lista;
  }
  if (!LIVRARI.includes(livrare)) {
    console.log("Tip de livrare invalid:", livrare);
    return lista;
  }
  if (restaurantCurat === "") {
    console.log("Restaurantul nu poate fi gol.");
    return lista;
  }
  if (typeof pret !== "number" || !(pret > 0)) {
    console.log("Prețul trebuie să fie un număr pozitiv:", pret);
    return lista;
  }
  if (!CATEGORII.includes(categorie)) {
    console.log("Categorie invalidă:", categorie);
    return lista;
  }

  const noua = {
    id: nextId(lista),
    preparat: preparatCurat,
    livrata: false,
    livrare,
    categorie,
    restaurant: restaurantCurat,
    pret,
  };
  return [...lista, noua];
}

function comutaLivrata(lista, id) {
  return lista.map((c) => (c.id === id ? { ...c, livrata: !c.livrata } : c));
}

function stergeComanda(lista, id) {
  return lista.filter((c) => c.id !== id);
}

// --- Teste în consolă ---

console.log("--- Citire ---");
console.log("Preparate:", listeazaPreparate(comenzi).join(", "));
console.log("Pe drum:", numaraPeDrum(comenzi));
console.log("Căutare 'pizza':", listeazaPreparate(cautaComenzi(comenzi, "pizza")).join(", "));
console.log("Căutare 'kyo' (restaurant):", listeazaPreparate(cautaComenzi(comenzi, "kyo")).join(", "));
console.log("Comanda cu id 2:", gasesteDupaId(comenzi, 2).preparat);

console.log("--- Adăugare ---");
let lista = adaugaComanda(comenzi, "Pad Thai cu pui", "express", "Bangkok Street", 39, "Asian");
console.log("Lista nouă:", lista.length, "comenzi");
console.log("Originalul a rămas cu:", comenzi.length, "comenzi");

console.log("--- Modificare și ștergere ---");
lista = comutaLivrata(lista, 1);
console.log("După marcarea id 1 ca livrată, pe drum:", numaraPeDrum(lista));
lista = stergeComanda(lista, 3);
console.log("După ștergerea id 3:", listeazaPreparate(lista).join(", "));
lista = adaugaComanda(lista, "Pizza Diavola", "standard", "Pizzeria Napoli", 45, "Pizza");
console.log("Id-ul noii comenzi după ștergere:", lista[lista.length - 1].id);

console.log("--- Validare ---");
adaugaComanda(lista, "   ", "express", "Pizzeria Napoli", 42);
adaugaComanda(lista, "Ceva", "dronă", "Pizzeria Napoli", 42);
adaugaComanda(lista, "Ceva", "standard", "Pizzeria Napoli", -5);
