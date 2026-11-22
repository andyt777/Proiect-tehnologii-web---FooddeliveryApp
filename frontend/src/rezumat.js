// Cifrele din „Comenzile tale” și textele din hero, calculate din date (nimic scris de mână).
// Funcții pure (fără React), ca să poată fi testate cu `node --test`.
import { CATEGORII } from "./categorii.js"; // numele categoriilor (Pizza, Burgers, Asian)
import { ETICHETE_LIVRARE } from "./livrare.js"; // tipurile de livrare (standard, express, ridicare)
import { formatComenzi, formatLei, formatProduse } from "./format.js"; // regula lui „de” (20 de produse), sumele în lei; redesign: și „6 comenzi”
import { stareComanda } from "./stari.js"; // fluxul complet: starea derivată (anulată / respinsă)
import { reducereComanda } from "./cupoane.js"; // pachetul C: reducerea salvată pe o comandă (0 dacă lipsește)

// Etapa 7: o comandă specială are pret: null până o confirmă restaurantul; doar numerele reale intră în sume
export function arePret(comanda) { // primește o comandă
  return typeof comanda.pret === "number" && Number.isFinite(comanda.pret); // null, undefined, text sau NaN = fără preț
} // sfârșitul funcției

// Suma prețurilor cunoscute și câte comenzi așteaptă prețul (pentru „+ 1 preț la confirmare”)
export function sumaPreturi(comenzi) { // primește o listă de comenzi
  let suma = 0; // suma prețurilor cunoscute
  let faraPret = 0; // câte comenzi n-au încă preț
  for (const c of comenzi) { // fiecare comandă o dată
    if (arePret(c)) suma += c.pret; // adunăm doar numerele
    else faraPret += 1; // restul le numărăm separat
  } // sfârșitul buclei
  return { suma, faraPret }; // obiect nou la fiecare apel
} // sfârșitul funcției

// Fluxul complet: o comandă anulată sau respinsă nu e nici pe drum, nici în total (starea vine din stari.js, cu valorile implicite)
function esteOprita(comanda) { // primește o comandă
  const stare = stareComanda(comanda); // „plasata” pentru comenzile vechi, fără `stare`
  return stare === "anulata" || stare === "respinsa"; // ieșirile laterale
} // sfârșitul funcției

// Rezumatul listei de comenzi: o singură trecere prin listă; contoarele pornesc de la 0 pentru fiecare categorie și livrare
export function rezumatComenzi(comenzi) { // primește toată lista de comenzi
  const peCategorie = Object.fromEntries(CATEGORII.map((c) => [c.nume, 0])); // { Pizza: 0, Burgers: 0, Asian: 0 }
  const peLivrare = Object.fromEntries(Object.keys(ETICHETE_LIVRARE).map((tip) => [tip, 0])); // { standard: 0, express: 0, ridicare: 0 }
  let peDrum = 0; // câte comenzi nu sunt livrate (și nici oprite)
  let livrate = 0; // câte comenzi sunt livrate
  for (const c of comenzi) { // fiecare comandă o dată
    if (c.livrata) livrate += 1; // livrată
    else if (!esteOprita(c)) peDrum += 1; // nelivrată și neanulată = pe drum
    if (Object.hasOwn(peCategorie, c.categorie)) peCategorie[c.categorie] += 1; // doar categoriile cunoscute (fără chei moștenite)
    if (Object.hasOwn(peLivrare, c.livrare)) peLivrare[c.livrare] += 1; // doar tipurile de livrare cunoscute
  } // sfârșitul buclei
  const neoprite = comenzi.filter((c) => !esteOprita(c)); // fluxul complet: comenzile anulate / respinse nu intră în total
  const { suma, faraPret } = sumaPreturi(neoprite); // Etapa 7: totalul ignoră prețurile neconfirmate (null)
  const total = suma - neoprite.filter(arePret).reduce((s, c) => s + Math.min(reducereComanda(c), c.pret), 0); // pachetul C: totalul e suma plătită, deci scădem reducerile cupoanelor (`pret` rămâne prețul de listă)
  return { numar: comenzi.length, total, faraPret, peDrum, livrate, peCategorie, peLivrare }; // obiect nou la fiecare apel
} // sfârșitul funcției

// Restaurantele din meniu, fiecare o singură dată, în ordinea în care apar
export function restauranteDinMeniu(meniu) { // primește lista de preparate
  return [...new Set(meniu.map((p) => p.restaurant))]; // Set păstrează ordinea primei apariții și scoate dublurile
} // sfârșitul funcției

// Acordul în română pentru alte cuvinte decât „produse”: aceeași regulă a lui „de” ca în format.js
// (format.js nu se modifică, așa că refolosim formatProduse și înlocuim doar cuvântul)
function cuAcord(numar, singular, plural) { // ex. (3, "restaurant", "restaurante")
  if (numar === 1) return `1 ${singular}`; // singularul e un caz special
  return formatProduse(numar).replace(/produse$/, plural); // „20 de produse” devine „20 de restaurante”
} // sfârșitul funcției

// „1 restaurant”, „3 restaurante”, „20 de restaurante”
export function formatRestaurante(numar) { // primește numărul de restaurante
  return cuAcord(numar, "restaurant", "restaurante"); // aceeași regulă de acord
} // sfârșitul funcției

// „1 preparat”, „3 preparate”, „20 de preparate”
export function formatPreparate(numar) { // primește numărul de preparate
  return cuAcord(numar, "preparat", "preparate"); // aceeași regulă de acord
} // sfârșitul funcției

// Etapa 7: „+ 1 preț la confirmare”, „+ 2 prețuri la confirmare”, afișat lângă sumele care ignoră comenzile speciale
export function formatFaraPret(numar) { // primește câte comenzi n-au încă preț
  return `+ ${cuAcord(numar, "preț", "prețuri")} la confirmare`; // aceeași regulă de acord
} // sfârșitul funcției

// Redesign „Pădure”: rezumatul comenzilor ca o frază simplă, în locul plăcilor bento.
// Ex. „6 comenzi: 3 pe drum, 3 livrate. Total: 331 lei.”; "" pentru o listă goală (lista arată atunci starea goală)
export function frazaRezumat(comenzi) { // primește toată lista de comenzi
  const r = rezumatComenzi(comenzi); // aceleași cifre ca înainte, dintr-o singură trecere
  if (r.numar === 0) return ""; // nimic de rezumat
  const livrate = cuAcord(r.livrate, "livrată", "livrate"); // „1 livrată”, „3 livrate”, „20 de livrate”
  const total = r.faraPret > 0 ? `${formatLei(r.total)} ${formatFaraPret(r.faraPret)}` : formatLei(r.total); // „331 lei + 1 preț la confirmare”
  const anulate = comenzi.filter((c) => stareComanda(c) === "anulata").length; // fluxul complet: anulate de client
  const respinse = comenzi.filter((c) => stareComanda(c) === "respinsa").length; // și respinse de restaurant
  const oprite = `${anulate > 0 ? `, ${cuAcord(anulate, "anulată", "anulate")}` : ""}${respinse > 0 ? `, ${cuAcord(respinse, "respinsă", "respinse")}` : ""}`; // apar doar când există
  return `${formatComenzi(r.numar)}: ${r.peDrum} pe drum, ${livrate}${oprite}. Total: ${total}.`; // fraza întreagă
} // sfârșitul funcției
