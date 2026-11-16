// Etapa 7: validarea formularului „Comandă specială” și obiectul trimis la server.
// Funcții pure (fără React), ca să poată fi testate cu `node --test`; formularul doar le apelează.
import { PREPARAT_MAX, RESTAURANTE, TIPURI_LIVRARE, categorieRestaurant } from "./constants.js"; // valorile fixe

// Verifică câmpurile; întoarce null dacă totul e în regulă, altfel { camp, mesaj } pentru primul câmp greșit
// (camp = numele câmpului, ca formularul să-l marcheze cu aria-invalid și să-i dea focus)
export function valideazaComandaSpeciala({ preparat, restaurant, livrare }) { // primește valorile din formular
  const text = typeof preparat === "string" ? preparat.trim() : ""; // doar spațiile nu contează ca text
  if (text === "") return { camp: "preparat", mesaj: "Scrie numele preparatului pe care îl dorești." }; // câmpul obligatoriu
  if (text.length > PREPARAT_MAX) return { camp: "preparat", mesaj: `Numele preparatului are maximum ${PREPARAT_MAX} de caractere.` }; // validarea suplimentară: lungimea
  if (!RESTAURANTE.some((r) => r.nume === restaurant)) return { camp: "restaurant", mesaj: "Alege un restaurant din listă." }; // doar valorile fixe
  if (!TIPURI_LIVRARE.includes(livrare)) return { camp: "livrare", mesaj: "Alege un tip de livrare din listă." }; // doar valorile fixe
  return null; // nicio problemă
} // sfârșitul funcției

// Comanda trimisă la server, fără id (îl pune serverul). Prețul îl stabilește restaurantul, deci pret: null.
// `acum` e parametru (nu new Date() înăuntru), ca testele să primească mereu aceeași dată
export function comandaSpecialaNoua({ preparat, restaurant, livrare }, acum = new Date()) { // valorile deja validate și momentul trimiterii
  return { // obiect nou, cu câmpurile în ordinea din db.json
    preparat: preparat.trim(), // fără spațiile de la margini
    restaurant, // numele exact al restaurantului
    livrare, // tipul de livrare ales
    categorie: categorieRestaurant(restaurant), // categoria vine din restaurant, nu se alege separat
    livrata: false, // abia cerută, deci pe drum
    pret: null, // fără preț inventat: pe ecran apare „Preț la confirmare”
    speciala: true, // marchează comanda făcută din formular (eticheta „Comandă specială”)
    creata: acum.toISOString(), // data trimiterii, ex. „2026-11-16T18:30:00.000Z”
  }; // sfârșitul obiectului
} // sfârșitul funcției
