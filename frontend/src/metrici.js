// Pachetul B: cifrele paginii /admin, calculate doar din comenzi și din `istoric` (momentele reale ale fiecărei treceri).
// Indicatorii, regula comenzilor întârziate, filtrele și jurnalul de evenimente. Nimic inventat: fără istoric, fără cifră.
// Funcții pure (fără React); momentul de acum vine ca parametru (milisecunde), ca testele să aibă mereu aceeași oră.
import { dePlata } from "./cupoane.js"; // suma de plată (pret − reducere)
import { MINUTE_LIVRARE } from "./livrare.js"; // durata drumului pentru Standard și Express
import { STARI_FINALE, esteRidicare, istoricComanda, normalizeazaComanda } from "./stari.js"; // stările și istoricul curățat

export const TERMEN_ACCEPTARE_MIN = 10; // restaurantul acceptă sau respinge în cel mult 10 minute de la plasare
export const TIMP_PREPARARE_IMPLICIT_MIN = 20; // dacă restaurantul nu a spus cât durează, socotim 20 de minute
export const TERMEN_PRELUARE_MIN = 15; // livratorul ridică o comandă gata în cel mult 15 minute
const MINUT_MS = 60000; // un minut, în milisecunde

// Textul regulii, afișat pe pagină, ca adminul să știe de ce o comandă e marcată
export const REGULA_INTARZIERE = `O comandă e întârziată când pasul curent durează mai mult decât e de așteptat: acceptarea ${TERMEN_ACCEPTARE_MIN} min de la plasare, prepararea timpul cerut de restaurant (implicit ${TIMP_PREPARARE_IMPLICIT_MIN} min) de la acceptare, preluarea ${TERMEN_PRELUARE_MIN} min de la „Gata”, drumul ${MINUTE_LIVRARE.standard} min la Standard și ${MINUTE_LIVRARE.express} min la Express. Comenzile fără istoric nu sunt evaluate.`; // aceleași numere ca în cod

// Momentul (ms) în care comanda a intrat ultima dată în fiecare stare; „plasata” poate veni și din câmpul vechi `creata`
export function momenteStari(comanda) { // primește o comandă
  const momente = new Map(); // stare -> milisecunde
  for (const e of istoricComanda(comanda)) momente.set(e.stare, Date.parse(e.la)); // ultima apariție câștigă (istoricul e deja curățat)
  const creata = typeof comanda?.creata === "string" ? Date.parse(comanda.creata) : NaN; // data plasării din Etapa 7
  if (!momente.has("plasata") && Number.isFinite(creata)) momente.set("plasata", creata); // doar dacă istoricul nu o are
  return momente; // harta nouă
} // sfârșitul funcției

// Minutele dintre două momente; null dacă lipsește unul sau ordinea e greșită
export function minuteIntre(deLa, panaLa) { // primește două momente în milisecunde (sau undefined)
  if (!Number.isFinite(deLa) || !Number.isFinite(panaLa) || panaLa < deLa) return null; // nu se poate calcula
  return (panaLa - deLa) / MINUT_MS; // minute, cu zecimale
} // sfârșitul funcției

// Media unei liste, rotunjită la o zecimală; null pentru o listă goală
function medie(valori) { // primește o listă de numere
  if (valori.length === 0) return null; // nimic de mediat
  return Math.round((valori.reduce((s, v) => s + v, 0) / valori.length) * 10) / 10; // o zecimală
} // sfârșitul funcției

// Întârzierea pasului curent: { minute, pas, termenMin } sau null (la timp, încheiată sau fără istoric)
export function intarziere(comanda, acum) { // primește comanda și momentul de acum (ms)
  if (!Number.isFinite(acum)) return null; // fără ceas nu putem judeca
  const c = normalizeazaComanda(comanda); // stările cu valorile implicite
  if (STARI_FINALE.includes(c.stare)) return null; // comanda și-a terminat drumul
  const programata = c.programataLa ? Date.parse(c.programataLa) : NaN; // ora aleasă de client (sau NaN)
  const inAsteptare = Number.isFinite(programata) && acum < programata; // comanda programată nu e întârziată înainte de ora ei
  const momente = momenteStari(c); // momentele din istoric
  let start; // începutul pasului curent (ms)
  let termenMin; // câte minute are voie să dureze
  let pas; // textul pasului, pentru mesaj
  if (c.stare === "plasata") { start = momente.get("plasata"); termenMin = TERMEN_ACCEPTARE_MIN; pas = "acceptare"; } // restaurantul încă nu a răspuns
  else if (inAsteptare) return null; // după acceptare, o comandă programată așteaptă ora ei
  else if (c.stare === "acceptata" || c.stare === "in_preparare") { start = momente.get("acceptata"); termenMin = c.timpPreparare ?? TIMP_PREPARARE_IMPLICIT_MIN; pas = "preparare"; } // estimarea restaurantului
  else if (c.stare === "gata") { // așteaptă livratorul sau clientul
    if (esteRidicare(c)) return null; // la ridicare, clientul vine când vrea
    start = momente.get("gata"); termenMin = TERMEN_PRELUARE_MIN; pas = "preluare"; // livratorul întârzie
  } else if (c.stare === "in_livrare") { start = momente.get("in_livrare"); termenMin = MINUTE_LIVRARE[c.livrare] ?? MINUTE_LIVRARE.standard; pas = "livrare"; } // livratorul e pe drum
  else return null; // altă stare (nu ar trebui să existe)
  if (!Number.isFinite(start)) return null; // fără istoric pentru pasul curent: nu ghicim
  const minute = Math.floor((acum - start - termenMin * MINUT_MS) / MINUT_MS); // minutele de peste termen
  return minute >= 1 ? { minute, pas, termenMin } : null; // doar o depășire de cel puțin un minut
} // sfârșitul funcției

// Indicatorii paginii /admin, dintr-o singură trecere prin listă
export function indicatori(comenzi) { // primește lista de la server
  const lista = Array.isArray(comenzi) ? comenzi.map(normalizeazaComanda) : []; // comenzile cu valorile implicite
  let valoare = 0; // suma de plată a comenzilor neoprite
  let livrate = 0; // câte au ajuns la client
  let oprite = 0; // câte au fost anulate sau respinse
  const acceptare = []; // minutele plasare -> acceptare
  const preparare = []; // minutele în preparare -> gata
  const livrare = []; // minutele în livrare -> livrată
  for (const c of lista) { // fiecare comandă o dată
    const oprita = c.stare === "anulata" || c.stare === "respinsa"; // ieșirile laterale
    if (c.stare === "livrata") livrate += 1; // finalizată
    if (oprita) oprite += 1; // oprită
    else valoare += dePlata(c); // valoarea, după reducere (comenzile fără preț contează 0)
    const m = momenteStari(c); // momentele din istoric
    const durate = [[acceptare, "plasata", "acceptata"], [preparare, "in_preparare", "gata"], [livrare, "in_livrare", "livrata"]]; // ce măsurăm
    for (const [tinta, deLa, panaLa] of durate) { // fiecare durată
      const minute = minuteIntre(m.get(deLa), m.get(panaLa)); // null dacă lipsește un moment
      if (minute !== null) tinta.push(minute); // doar duratele reale
    } // sfârșitul buclei
  } // sfârșitul buclei
  const incheiate = livrate + oprite; // comenzile care și-au terminat drumul
  return { // obiect nou
    numar: lista.length, // toate comenzile
    valoare, // lei
    incheiate, // baza ratelor
    medieAcceptareMin: medie(acceptare), // minute sau null
    mediePreparareMin: medie(preparare), // minute sau null
    medieLivrareMin: medie(livrare), // minute sau null
    rataFinalizare: incheiate > 0 ? livrate / incheiate : null, // între 0 și 1, din comenzile încheiate
    rataAnulare: incheiate > 0 ? oprite / incheiate : null, // anulate + respinse, din comenzile încheiate
  }; // sfârșitul obiectului
} // sfârșitul funcției

export const FILTRE_GOALE = Object.freeze({ stare: "toate", livrare: "toate", plata: "toate", restaurant: "toate", doarIntarziate: false }); // „toate” = filtrul nu se aplică

// Comenzile care trec de filtre; întoarce obiectele primite (nu cele normalizate), în aceeași ordine
export function filtreazaComenzi(comenzi, filtre, acum) { // primește lista, filtrele și momentul de acum (ms)
  if (!Array.isArray(comenzi)) return []; // nimic de filtrat
  const f = { ...FILTRE_GOALE, ...filtre }; // filtrele lipsă înseamnă „toate”
  return comenzi.filter((bruta) => { // păstrăm comanda brută, pentru acțiuni
    const c = normalizeazaComanda(bruta); // valorile implicite
    if (f.stare !== "toate" && c.stare !== f.stare) return false; // starea comenzii
    if (f.livrare === "ridicare" && !esteRidicare(c)) return false; // doar ridicările
    if (f.livrare !== "toate" && f.livrare !== "ridicare" && c.livrareStare !== f.livrare) return false; // pasul livrării
    if (f.plata !== "toate" && c.plata.stare !== f.plata) return false; // starea plății
    if (f.restaurant !== "toate" && c.restaurant !== f.restaurant) return false; // restaurantul
    if (f.doarIntarziate && intarziere(c, acum) === null) return false; // doar cele întârziate
    return true; // trece de toate filtrele
  }); // sfârșitul filter
} // sfârșitul funcției

// Jurnalul de evenimente: toate intrările din `istoric`, de la toate comenzile, cele mai noi primele
export function jurnalEvenimente(comenzi, limita = 40) { // primește lista și câte intrări arătăm
  if (!Array.isArray(comenzi)) return []; // nimic de arătat
  const evenimente = comenzi.flatMap((c) => istoricComanda(c).map((e, i) => ({ // o intrare pentru fiecare trecere
    cheie: `${c?.id}-${i}-${e.stare}-${e.la}`, // unică: id, poziția în istoric, starea și momentul
    comandaId: c?.id ?? null, // pentru link spre comandă
    preparat: typeof c?.preparat === "string" ? c.preparat : "", // numele comenzii
    ridicare: esteRidicare(c), // pentru textul potrivit („Ridicată”)
    stare: e.stare, // starea în care a intrat
    la: e.la, // momentul, text ISO
  }))); // sfârșitul flatMap
  return evenimente.sort((a, b) => Date.parse(b.la) - Date.parse(a.la)).slice(0, Math.max(0, limita)); // cele mai noi primele, cel mult `limita`
} // sfârșitul funcției

// Procent întreg pentru afișare („75%”); „—” când nu există date
export function formatProcent(rata) { // primește o rată între 0 și 1 (sau null)
  return typeof rata === "number" && Number.isFinite(rata) ? `${Math.round(rata * 100)}%` : "—"; // fără date: liniuță
} // sfârșitul funcției

// Minute pentru afișare („12,5 min”); „—” când nu există date
export function formatMinute(minute) { // primește minute (sau null)
  return typeof minute === "number" && Number.isFinite(minute) ? `${minute.toLocaleString("ro-RO", { maximumFractionDigits: 1 })} min` : "—"; // virgulă zecimală românească
} // sfârșitul funcției

// Istoricul unui restaurant: comenzile lui încheiate (livrate, anulate, respinse), cele mai noi primele
export function comenziIncheiateRestaurant(comenzi, restaurant) {
  if (!Array.isArray(comenzi)) return [];
  const moment = (c) => {
    const m = momenteStari(c);
    const ms = Math.max(...[...m.values()].filter(Number.isFinite));
    return Number.isFinite(ms) ? ms : Number(c?.id) || 0;
  };
  return comenzi
    .filter((c) => c?.restaurant === restaurant && STARI_FINALE.includes(normalizeazaComanda(c).stare))
    .sort((a, b) => moment(b) - moment(a));
}

// Comenzile unui restaurant (pentru indicatorii lui, calculați cu `indicatori`)
export function comenziRestaurant(comenzi, restaurant) {
  return Array.isArray(comenzi) ? comenzi.filter((c) => c?.restaurant === restaurant) : [];
}
