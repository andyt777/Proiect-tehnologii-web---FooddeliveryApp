// Pachetul C: cupoanele de reducere aplicate pe /cos. Regulile sunt fixe, scrise aici (nu vin de la server).
// Ce înseamnă sumele, peste tot în aplicație:
// - `pret` rămâne prețul de listă al comenzii (preț unitar × cantitate), ca în Etapa 7 și în db.json;
// - `reducere` (lei, întreg) e partea din reducerea cuponului care revine acelei comenzi; `cupon` e codul folosit;
// - suma de plată a unei comenzi = pret − reducere (dePlata), niciodată sub 0.
// Coșul devine câte o comandă pentru fiecare linie, deci reducerea întregului coș se împarte pe linii (imparteReducere).
// Verificările rulează doar în browser: un cupon „valid” aici nu e o garanție, ar trebui verificat și pe un server real.
// Funcții pure (fără React sau fetch), testate cu `node --test`.
import { formatLeiDe } from "./format.js"; // sumele din mesaje („100 de lei”, „1 leu”)
import { normalizeazaComanda } from "./stari.js"; // comenzile citite cu valorile implicite

export const COD_MAX = 20; // lungimea maximă a unui cod scris de utilizator

// Cupoanele demo. tip: „procent” (valoare = procente) sau „fix” (valoare = lei); minim = subtotalul minim al coșului
export const CUPOANE = Object.freeze([ // înghețată: regulile nu se schimbă din greșeală
  Object.freeze({ cod: "SAVORO10", tip: "procent", valoare: 10, minim: 100, primaComanda: false, descriere: "10% reducere la un coș de cel puțin 100 de lei." }), // procentul, cu minim
  Object.freeze({ cod: "PRIMA20", tip: "fix", valoare: 20, minim: 60, primaComanda: true, descriere: "20 de lei reducere la prima comandă plasată din coș, de la 60 de lei." }), // suma fixă, doar prima dată
]); // sfârșitul listei

// Codul scris de utilizator, curățat: fără spații și cu litere mari („ savoro10 ” -> „SAVORO10”)
export function normalizeazaCod(text) { // primește textul din câmp
  return typeof text === "string" ? text.replace(/\s+/g, "").toUpperCase() : ""; // doar text
} // sfârșitul funcției

// Cuponul cu acest cod; null dacă nu există
export function gasesteCupon(cod) { // primește codul (scris oricum)
  const curat = normalizeazaCod(cod); // aceeași formă ca în listă
  return CUPOANE.find((c) => c.cod === curat) ?? null; // comparație exactă
} // sfârșitul funcției

// Reducerea în lei pentru un subtotal (întreagă, cel mult subtotalul)
export function calculeazaReducere(cupon, subtotal) { // primește cuponul și subtotalul coșului
  if (!cupon || !Number.isFinite(subtotal) || subtotal <= 0) return 0; // nimic de redus
  const suma = cupon.tip === "procent" ? Math.floor((subtotal * cupon.valoare) / 100) : cupon.valoare; // procentul rotunjit în jos sau suma fixă
  return Math.max(0, Math.min(suma, subtotal)); // niciodată mai mult decât costă coșul
} // sfârșitul funcției

// „Istoricul local” pentru PRIMA20: comenzile plasate din coș (au contact, din pachetul A) care nu au fost anulate / respinse.
// Comenzile de exemplu din db.json și cele din formularul „Comandă specială” nu au contact, deci nu contează.
export function numarComenziAnterioare(comenzi) { // primește lista de la server
  if (!Array.isArray(comenzi)) return 0; // un răspuns ciudat nu blochează cuponul
  return comenzi.map(normalizeazaComanda).filter((c) => c.contact !== null && c.stare !== "anulata" && c.stare !== "respinsa").length; // doar comenzile din coș, încă valabile
} // sfârșitul funcției

// Verifică un cod pentru coșul de acum: { ok: true, cupon, reducere } sau { ok: false, mesaj }
export function valideazaCupon(cod, { subtotal, comenziAnterioare = 0 }) { // primește codul, subtotalul și câte comenzi din coș are clientul
  const curat = normalizeazaCod(cod); // forma comparată
  if (curat === "") return { ok: false, mesaj: "Scrie codul cuponului." }; // câmp gol
  const cupon = curat.length <= COD_MAX ? gasesteCupon(curat) : null; // un text prea lung nu e un cod
  if (!cupon) return { ok: false, mesaj: "Codul nu există. Verifică literele și cifrele." }; // cod necunoscut
  if (!Number.isFinite(subtotal) || subtotal < cupon.minim) { // coșul e prea mic
    const lipsa = Number.isFinite(subtotal) ? cupon.minim - subtotal : cupon.minim; // cât mai trebuie adăugat
    return { ok: false, mesaj: `Codul ${cupon.cod} e valabil de la ${formatLeiDe(cupon.minim)}. Mai adaugă produse de ${formatLeiDe(lipsa)}.` }; // ce poate face utilizatorul
  } // sfârșitul if
  if (cupon.primaComanda && comenziAnterioare > 0) return { ok: false, mesaj: `Codul ${cupon.cod} e doar pentru prima comandă, iar tu ai deja comenzi plasate din coș.` }; // regula primei comenzi
  const reducere = calculeazaReducere(cupon, subtotal); // suma în lei
  if (reducere <= 0) return { ok: false, mesaj: `Codul ${cupon.cod} nu reduce nimic la acest coș.` }; // caz limită (ex. procent dintr-o sumă foarte mică)
  return { ok: true, cupon, reducere }; // cuponul se poate aplica
} // sfârșitul funcției

// Împarte reducerea pe liniile coșului, proporțional cu prețul fiecăreia, în lei întregi.
// Suma părților e exact reducerea (plafonată la total), iar nicio parte nu depășește prețul liniei ei.
export function imparteReducere(reducere, preturi) { // primește reducerea și prețurile liniilor (subtotalurile)
  if (!Array.isArray(preturi)) return []; // nimic de împărțit
  const valide = preturi.map((p) => (Number.isFinite(p) && p > 0 ? p : 0)); // prețurile ciudate contează ca 0
  const total = valide.reduce((s, p) => s + p, 0); // totalul coșului
  const deImpartit = Number.isFinite(reducere) && reducere > 0 ? Math.min(Math.floor(reducere), total) : 0; // reducerea întreagă, plafonată
  if (deImpartit === 0 || total === 0) return valide.map(() => 0); // fără reducere: zero peste tot
  const exacte = valide.map((p) => (deImpartit * p) / total); // partea exactă (cu zecimale) a fiecărei linii
  const parti = exacte.map((x) => Math.floor(x)); // partea întreagă
  let rest = deImpartit - parti.reduce((s, x) => s + x, 0); // leii rămași după rotunjirea în jos
  const ordine = exacte.map((x, i) => ({ i, fractie: x - Math.floor(x) })).sort((a, b) => b.fractie - a.fractie || a.i - b.i); // cele mai mari zecimale primesc primele câte un leu
  for (const { i } of ordine) { // în ordinea zecimalelor
    if (rest === 0) break; // am împărțit tot
    if (parti[i] + 1 <= valide[i]) { parti[i] += 1; rest -= 1; } // un leu în plus, fără să depășim prețul liniei
  } // sfârșitul buclei
  return parti; // câte o parte pentru fiecare linie, în aceeași ordine
} // sfârșitul funcției

// Câmpurile cuponului pentru o comandă nouă: doar dacă îi revine o parte din reducere
export function campuriCupon(cod, parte) { // primește codul și partea comenzii
  return Number.isInteger(parte) && parte > 0 ? { cupon: cod, reducere: parte } : {}; // obiect gol = comanda nu are cupon
} // sfârșitul funcției

// Reducerea salvată pe o comandă (0 dacă lipsește sau e greșită)
export function reducereComanda(comanda) { // primește o comandă
  const r = comanda?.reducere; // poate lipsi
  return typeof r === "number" && Number.isFinite(r) && r > 0 ? r : 0; // doar un număr pozitiv
} // sfârșitul funcției

// Suma de plată: pret − reducere; 0 pentru o comandă fără preț (comanda specială neconfirmată)
export function dePlata(comanda) { // primește o comandă
  const pret = comanda?.pret; // prețul de listă
  if (typeof pret !== "number" || !Number.isFinite(pret)) return 0; // fără preț încă
  return Math.max(0, pret - reducereComanda(comanda)); // niciodată negativă
} // sfârșitul funcției
