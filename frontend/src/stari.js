// Fluxul complet: stările unei comenzi, ale plății și ale livrării, într-un singur loc.
// Toate trecerile (client, restaurant, livrator, admin și bifa „Livrată” de pe „/”) folosesc funcțiile de aici;
// interfața nu construiește niciodată de mână corpul unui PATCH. Funcții pure (fără React), testate cu `node --test`.
// Atenție: rolurile sunt un comutator demo. Serverul (backend/src/reguli/) repetă aceleași reguli și refuză cu 409
// o trecere nepermisă (testul tests/backendReguli.test.js ține cele două copii identice), dar nu știe încă cine o cere.

// Stările comenzii, în ordinea drumului principal; „anulata” și „respinsa” sunt ieșiri laterale
export const STARI_COMANDA = Object.freeze(["plasata", "acceptata", "in_preparare", "gata", "in_livrare", "livrata", "anulata", "respinsa"]); // toate valorile permise pentru `stare`
export const STARI_FINALE = Object.freeze(["livrata", "anulata", "respinsa"]); // din ele nu mai pleacă nicio tranziție normală
export const DRUM_LIVRARE = Object.freeze(["plasata", "acceptata", "in_preparare", "gata", "in_livrare", "livrata"]); // drumul unei comenzi cu livrare
export const DRUM_RIDICARE = Object.freeze(["plasata", "acceptata", "in_preparare", "gata", "livrata"]); // ridicarea personală sare peste „in_livrare”

// Textele afișate pentru fiecare stare
export const ETICHETE_STARE = Object.freeze({ // cheia = valoarea din date
  plasata: "Plasată", // abia trimisă
  acceptata: "Acceptată", // restaurantul a confirmat-o
  in_preparare: "În preparare", // se gătește
  gata: "Gata", // așteaptă livratorul (sau clientul, la ridicare)
  in_livrare: "În livrare", // livratorul a preluat-o
  livrata: "Livrată", // ajunsă la client
  anulata: "Anulată", // anulată de client (sau de admin)
  respinsa: "Respinsă", // refuzată de restaurant
}); // sfârșitul obiectului

// Pașii livrării, separați de starea comenzii (doar pentru comenzile cu livrare, nu și la ridicare)
export const PASI_LIVRARE = Object.freeze(["neasignata", "asignata", "spre_restaurant", "preluata", "spre_client", "livrata"]); // în ordine
export const ETICHETE_PAS_LIVRARE = Object.freeze({ // textele pașilor
  neasignata: "Fără livrator", // nimeni nu a luat cursa
  asignata: "Livrator asignat", // un livrator a acceptat cursa
  spre_restaurant: "Livratorul merge la restaurant", // pe drum spre restaurant
  preluata: "Preluată de livrator", // a ridicat comanda
  spre_client: "Livratorul vine spre tine", // pe drum spre client
  livrata: "Livrată", // ajunsă
}); // sfârșitul obiectului

// Plata: doar simulată (fără date de card) sau numerar la livrare
export const METODE_PLATA = Object.freeze(["card_simulat", "numerar"]); // valorile permise pentru plata.metoda
export const STARI_PLATA = Object.freeze(["neplatita", "platita", "rambursata"]); // valorile permise pentru plata.stare
export const ETICHETE_METODA_PLATA = Object.freeze({ card_simulat: "Card (simulare)", numerar: "Numerar" }); // textele metodelor
export const ETICHETE_STARE_PLATA = Object.freeze({ neplatita: "Neplătită", platita: "Plătită", rambursata: "Rambursată" }); // textele stărilor plății

export const ROLURI = Object.freeze(["client", "restaurant", "livrator", "admin"]); // rolurile comutatorului demo

export const MOTIV_MAX = 200; // lungimea maximă a motivului de anulare / respingere
export const MOTIVE_ANULARE = Object.freeze(["M-am răzgândit", "Am greșit adresa sau ora", "Durează prea mult"]); // motivele gata scrise pentru client
export const TIMP_PREPARARE_MIN = 5; // minutele minime pe care le poate cere restaurantul
export const TIMP_PREPARARE_MAX = 180; // și cele maxime
export const PRET_MAXIM = 10000; // plafonul prețului pus de restaurant unei comenzi speciale
const ISTORIC_MAXIM = 200; // câte intrări din `istoric` citim cel mult (datele nu sunt de încredere)

// Tabelul tranzițiilor permise: din starea curentă -> starea nouă -> rolurile care o pot face.
// Map (nu obiect simplu): „constructor” sau „toString” nu găsesc nimic.
const TRANZITII = new Map([ // fiecare intrare: [din, Map(spre -> roluri)]
  ["plasata", new Map([["acceptata", ["restaurant", "admin"]], ["respinsa", ["restaurant", "admin"]], ["anulata", ["client", "admin"]]])], // restaurantul decide; clientul poate anula
  ["acceptata", new Map([["in_preparare", ["restaurant", "admin"]], ["anulata", ["client", "admin"]]])], // clientul mai poate anula până începe prepararea
  ["in_preparare", new Map([["gata", ["restaurant", "admin"]], ["anulata", ["admin"]]])], // de aici, doar adminul mai anulează
  ["gata", new Map([["in_livrare", ["livrator", "admin"]], ["livrata", ["restaurant", "admin"]], ["anulata", ["admin"]]])], // livrare: livratorul o ia; ridicare: restaurantul o predă
  ["in_livrare", new Map([["livrata", ["livrator", "admin"]], ["anulata", ["admin"]]])], // livratorul o predă clientului
  ["livrata", new Map()], // finală
  ["anulata", new Map()], // finală
  ["respinsa", new Map()], // finală
]); // sfârșitul tabelului

// Pașii livrării: din pasul curent -> pașii următori permiși
const TRANZITII_LIVRARE = new Map([ // aceeași idee ca mai sus, fără roluri (doar livratorul și adminul îi folosesc)
  ["neasignata", ["asignata"]], // un livrator acceptă cursa
  ["asignata", ["spre_restaurant", "neasignata"]], // pornește spre restaurant sau renunță la cursă
  ["spre_restaurant", ["preluata"]], // ridică comanda
  ["preluata", ["spre_client"]], // pornește spre client
  ["spre_client", ["livrata"]], // predă comanda
  ["livrata", []], // final
]); // sfârșitul tabelului

// --- ajutoare interne ---

function esteObiect(valoare) { // true pentru un obiect simplu (nu null, nu listă)
  return valoare !== null && typeof valoare === "object" && !Array.isArray(valoare); // cele trei condiții
} // sfârșitul funcției

function esteDataValida(text) { // true pentru un text ISO care chiar e o dată
  return typeof text === "string" && text !== "" && !Number.isNaN(Date.parse(text)); // Date.parse dă NaN pentru texte greșite
} // sfârșitul funcției

function esteIdValid(id) { // id-ul unui livrator: număr întreg pozitiv sau text nevid
  return (Number.isInteger(id) && id > 0) || (typeof id === "string" && id.trim() !== ""); // json-server folosește numere, dar acceptăm și text
} // sfârșitul funcției

function existaTranzitie(din, spre) { // true dacă tabelul are trecerea, pentru orice rol
  return TRANZITII.get(din)?.has(spre) ?? false; // `?.`: o stare necunoscută nu are tranziții
} // sfârșitul funcției

// Regulile care depind de comandă, nu doar de stări: ridicarea sare peste livrare
function conditiiIndeplinite(comanda, din, spre) { // primește comanda, starea curentă și cea nouă
  if (din === "gata" && spre === "in_livrare") return !esteRidicare(comanda); // la ridicare nu există livrator
  if (din === "gata" && spre === "livrata") return esteRidicare(comanda); // o comandă cu livrare ajunge la client doar prin livrator
  return true; // restul nu au condiții în plus
} // sfârșitul funcției

// Plata după o tranziție: numerarul se încasează la predare; o comandă plătită și oprită se rambursează
function plataDupa(plata, stareNoua) { // primește plata curentă (deja validată) și starea nouă
  if (stareNoua === "livrata" && plata.metoda === "numerar" && plata.stare === "neplatita") return { metoda: "numerar", stare: "platita" }; // banii se dau la predare
  if ((stareNoua === "anulata" || stareNoua === "respinsa") && plata.stare === "platita") return { metoda: plata.metoda, stare: "rambursata" }; // banii se întorc
  return { metoda: plata.metoda, stare: plata.stare }; // copie neschimbată
} // sfârșitul funcției

// Starea de dinaintea ultimei livrări, din istoric (pentru debifarea lui „Livrată”); „plasata” dacă nu știm
function stareInainteDeLivrare(istoric) { // primește istoricul deja validat
  const ultimaLivrare = istoric.map((e) => e.stare).lastIndexOf("livrata"); // poziția ultimei intrări „livrata” (-1 dacă nu există)
  const inainte = ultimaLivrare === -1 ? istoric : istoric.slice(0, ultimaLivrare); // intrările de dinaintea ei
  for (let i = inainte.length - 1; i >= 0; i -= 1) { // de la cea mai nouă spre cea mai veche
    if (inainte[i].stare !== "livrata") return inainte[i].stare; // prima stare care nu e tot „livrata”
  } // sfârșitul buclei
  return "plasata"; // nimic în istoric: începutul drumului
} // sfârșitul funcției

function curataMotiv(motiv) { // textul motivului, fără spații la margini; null dacă e gol sau prea lung
  if (typeof motiv !== "string") return null; // doar text
  const text = motiv.trim(); // fără spațiile de la margini
  return text !== "" && text.length <= MOTIV_MAX ? text : null; // doar un motiv valid
} // sfârșitul funcției

// --- citirea unei comenzi (cu valorile implicite pentru comenzile vechi din db.json) ---

// true pentru ridicare personală (fără livrator și fără pașii livrării)
export function esteRidicare(comanda) { // primește o comandă
  return comanda?.livrare === "ridicare"; // valoarea din db.json
} // sfârșitul funcției

// Istoricul curățat: doar intrări { stare, la } cu o stare cunoscută și o dată validă; [] dacă lipsește
export function istoricComanda(comanda) { // primește o comandă
  const istoric = comanda?.istoric; // poate lipsi (comenzile din db.json)
  if (!Array.isArray(istoric)) return []; // lipsă sau alt tip
  return istoric.slice(-ISTORIC_MAXIM).filter((e) => esteObiect(e) && STARI_COMANDA.includes(e.stare) && esteDataValida(e.la)).map((e) => ({ stare: e.stare, la: e.la })); // copii, doar cu câmpurile cunoscute
} // sfârșitul funcției

// Starea comenzii. `livrata` (câmpul din tw.json) are ultimul cuvânt, ca bifa și starea să nu se contrazică niciodată:
// lipsă -> livrata ? „livrata” : „plasata”; livrata: true -> „livrata”; „livrata” dar livrata: false -> starea de dinainte
export function stareComanda(comanda) { // primește o comandă (poate fi una veche, fără `stare`)
  if (comanda?.livrata === true) return "livrata"; // bifa spune livrată
  const stare = STARI_COMANDA.includes(comanda?.stare) ? comanda.stare : null; // doar valorile cunoscute
  if (stare === null) return "plasata"; // comandă veche sau valoare greșită
  if (stare === "livrata") return stareInainteDeLivrare(istoricComanda(comanda)); // bifa a fost scoasă din afara aplicației
  return stare; // starea salvată
} // sfârșitul funcției

// Plata comenzii; lipsă -> { numerar, platita dacă e livrată, altfel neplatita }
export function plataComanda(comanda) { // primește o comandă
  const plata = comanda?.plata; // poate lipsi
  if (esteObiect(plata) && METODE_PLATA.includes(plata.metoda) && STARI_PLATA.includes(plata.stare)) return { metoda: plata.metoda, stare: plata.stare }; // copie a plății valide
  return { metoda: "numerar", stare: comanda?.livrata === true ? "platita" : "neplatita" }; // valoarea implicită din spec
} // sfârșitul funcției

// Pasul livrării; null la ridicare; lipsă -> „livrata” dacă e livrată, altfel „neasignata”
export function pasLivrareComanda(comanda) { // primește o comandă
  if (esteRidicare(comanda)) return null; // ridicarea nu are livrare
  if (stareComanda(comanda) === "livrata") return "livrata"; // sincron cu starea comenzii
  const pas = PASI_LIVRARE.includes(comanda?.livrareStare) ? comanda.livrareStare : "neasignata"; // valoarea salvată sau începutul
  return pas === "livrata" ? "spre_client" : pas; // comanda nu e livrată (bifa scoasă): livratorul e încă pe drum
} // sfârșitul funcției

// Comanda cu toate câmpurile noi completate: valorile salvate, dacă sunt valide, altfel cele implicite.
// Paginile citesc doar rezultatul acestei funcții, ca o comandă veche să se afișeze corect.
export function normalizeazaComanda(comanda) { // primește comanda de la server
  const c = esteObiect(comanda) ? comanda : {}; // un răspuns ciudat nu oprește pagina
  const contact = esteObiect(c.contact) && typeof c.contact.nume === "string" && typeof c.contact.telefon === "string" ? { nume: c.contact.nume, telefon: c.contact.telefon } : null; // doar forma cunoscută
  return { // obiect nou; câmpurile vechi rămân cum erau
    ...c, // id, preparat, restaurant, livrare, categorie, pret, livrata, creata, speciala
    livrata: c.livrata === true, // doar true înseamnă livrată
    stare: stareComanda(c), // starea, sincronă cu `livrata`
    plata: plataComanda(c), // plata
    livrareStare: pasLivrareComanda(c), // pasul livrării (null la ridicare)
    istoric: istoricComanda(c), // istoricul curățat
    livratorId: esteIdValid(c.livratorId) ? c.livratorId : null, // livratorul asignat
    timpPreparare: Number.isInteger(c.timpPreparare) && c.timpPreparare >= TIMP_PREPARARE_MIN && c.timpPreparare <= TIMP_PREPARARE_MAX ? c.timpPreparare : null, // minutele cerute de restaurant
    adresa: typeof c.adresa === "string" && c.adresa.trim() !== "" ? c.adresa : null, // adresa de livrare
    contact, // numele și telefonul clientului
    programataLa: esteDataValida(c.programataLa) ? c.programataLa : null, // ora programată
    cupon: typeof c.cupon === "string" && c.cupon !== "" ? c.cupon : null, // codul folosit (pachetul C)
    reducere: typeof c.reducere === "number" && Number.isFinite(c.reducere) && c.reducere > 0 ? c.reducere : 0, // reducerea în lei (pachetul C)
    motiv: curataMotiv(c.motiv), // motivul anulării / respingerii
  }; // sfârșitul obiectului
} // sfârșitul funcției

// true dacă și-a terminat drumul (livrată, anulată sau respinsă)
export function esteFinala(comanda) { // primește o comandă
  return STARI_FINALE.includes(stareComanda(comanda)); // starea derivată
} // sfârșitul funcției

// true dacă e încă în curs
export function esteActiva(comanda) { // primește o comandă
  return !esteFinala(comanda); // opusul
} // sfârșitul funcției

// Textul unui pas, ținând cont de ridicare („Gata de ridicare”, „Ridicată”)
export function etichetaPas(stare, ridicare = false) { // primește starea și tipul comenzii
  if (ridicare && stare === "gata") return "Gata de ridicare"; // clientul vine după ea
  if (ridicare && stare === "livrata") return "Ridicată"; // clientul a luat-o
  return ETICHETE_STARE[stare] ?? stare; // textul obișnuit
} // sfârșitul funcției

// Textul stării curente a unei comenzi, ex. „În preparare”
export function etichetaStare(comanda) { // primește o comandă
  return etichetaPas(stareComanda(comanda), esteRidicare(comanda)); // starea derivată, cu textul potrivit
} // sfârșitul funcției

// --- tranziții ---

// true dacă rolul poate muta comanda în starea nouă (tabelul + regula ridicării)
export function poateTrece(comanda, stareNoua, rol) { // primește comanda, starea dorită și rolul
  if (!ROLURI.includes(rol)) return false; // rol necunoscut
  const din = stareComanda(comanda); // starea curentă, derivată
  const roluri = TRANZITII.get(din)?.get(stareNoua); // cine poate face trecerea (undefined dacă nimeni)
  if (!roluri || !roluri.includes(rol)) return false; // trecere inexistentă sau rol nepermis
  return conditiiIndeplinite(comanda, din, stareNoua); // regula ridicării
} // sfârșitul funcției

// Stările în care poate ajunge comanda acum, pentru un rol (pentru butoanele din pachetul B)
export function tranzitiiPosibile(comanda, rol) { // primește comanda și rolul
  return STARI_COMANDA.filter((stare) => poateTrece(comanda, stare, rol)); // în ordinea drumului
} // sfârșitul funcției

// Corpul PATCH pentru o tranziție: stare, livrata (sincron), plata, istoric (cu momentul), plus ce cere tranziția.
// `detalii` (opțional): motiv (anulare / respingere), timpPreparare și pret (acceptare). Rolul se verifică separat, cu poateTrece.
// Aruncă eroare pentru o trecere care nu există în tabel: interfața nu poate trimite o stare imposibilă.
export function aplicaTranzitie(comanda, stareNoua, acum = new Date(), detalii = {}) { // `acum` e parametru, ca testele să aibă mereu aceeași dată
  const din = stareComanda(comanda); // starea curentă, derivată
  if (!existaTranzitie(din, stareNoua) || !conditiiIndeplinite(comanda, din, stareNoua)) throw new Error(`Comanda nu poate trece din „${etichetaPas(din)}” în „${etichetaPas(stareNoua)}”.`); // trecere nepermisă
  const patch = { // câmpurile schimbate
    stare: stareNoua, // starea nouă
    livrata: stareNoua === "livrata", // regula de sincronizare cu tw.json
    plata: plataDupa(plataComanda(comanda), stareNoua), // încasare sau rambursare
    istoric: [...istoricComanda(comanda), { stare: stareNoua, la: acum.toISOString() }], // istoricul vechi + intrarea nouă
  }; // sfârșitul obiectului
  if (!esteRidicare(comanda)) { // doar comenzile cu livrare au pașii livrării
    const pas = pasLivrareComanda(comanda); // pasul curent
    if (stareNoua === "livrata") patch.livrareStare = "livrata"; // predată
    else if (stareNoua === "in_livrare" && PASI_LIVRARE.indexOf(pas) < PASI_LIVRARE.indexOf("preluata")) patch.livrareStare = "preluata"; // în livrare = preluată de livrator
  } // sfârșitul if
  if (stareNoua === "anulata" || stareNoua === "respinsa") { // ieșirile laterale păstrează motivul
    const motiv = curataMotiv(detalii.motiv); // textul curățat
    if (motiv) patch.motiv = motiv; // doar un motiv valid
  } // sfârșitul if
  if (stareNoua === "acceptata") { // restaurantul spune cât durează și, la comenzile speciale, prețul
    if (Number.isInteger(detalii.timpPreparare) && detalii.timpPreparare >= TIMP_PREPARARE_MIN && detalii.timpPreparare <= TIMP_PREPARARE_MAX) patch.timpPreparare = detalii.timpPreparare; // minutele
    if (!arePretValid(comanda?.pret) && arePretValid(detalii.pret)) patch.pret = detalii.pret; // prețul se pune o singură dată
  } // sfârșitul if
  return patch; // corpul cererii
} // sfârșitul funcției

function arePretValid(pret) { // un preț întreg pozitiv, sub plafon
  return Number.isInteger(pret) && pret > 0 && pret <= PRET_MAXIM; // aceleași reguli ca în db.json
} // sfârșitul funcției

// Bifa „Livrată” de pe „/” (cerința cursului: item-toggle schimbă `livrata`). E o scurtătură manuală, în afara tabelului:
// nelivrată -> „livrata”; livrată -> starea de dinainte din istoric (altfel „plasata”). Starea, plata și istoricul rămân sincrone.
export function comutaLivrata(comanda, acum = new Date()) { // primește comanda și momentul
  const istoric = istoricComanda(comanda); // istoricul curățat
  const plata = plataComanda(comanda); // plata curentă
  const ridicare = esteRidicare(comanda); // fără pașii livrării
  const la = acum.toISOString(); // momentul schimbării
  if (stareComanda(comanda) !== "livrata") { // bifăm
    const patch = { stare: "livrata", livrata: true, plata: plataDupa(plata, "livrata"), istoric: [...istoric, { stare: "livrata", la }] }; // ca la o predare
    if (!ridicare) patch.livrareStare = "livrata"; // și livrarea e încheiată
    return patch; // corpul cererii
  } // sfârșitul if
  const inapoi = stareInainteDeLivrare(istoric); // debifăm: înapoi la starea de dinainte
  const patch = { // corpul cererii
    stare: inapoi, // starea de dinainte
    livrata: false, // bifa scoasă
    plata: plata.metoda === "numerar" && plata.stare === "platita" ? { metoda: "numerar", stare: "neplatita" } : plata, // numerarul se încasează abia la predare
    istoric: [...istoric, { stare: inapoi, la }], // și întoarcerea apare în istoric
  }; // sfârșitul obiectului
  if (!ridicare) patch.livrareStare = inapoi === "in_livrare" ? "spre_client" : esteIdValid(comanda?.livratorId) ? "asignata" : "neasignata"; // pasul livrării, potrivit stării
  return patch; // corpul cererii
} // sfârșitul funcției

// --- pașii livrării (pachetul B: livratorul și adminul) ---

// true dacă livrarea poate trece la pasul nou; leagă pașii de starea comenzii
export function poateAvansaLivrarea(comanda, pasNou) { // primește comanda și pasul dorit
  if (esteRidicare(comanda) || esteFinala(comanda)) return false; // fără livrare sau comandă încheiată
  const stare = stareComanda(comanda); // starea comenzii
  const urmatori = TRANZITII_LIVRARE.get(pasLivrareComanda(comanda)) ?? []; // pașii permiși din pasul curent
  if (!urmatori.includes(pasNou)) return false; // pas nepermis
  if (pasNou === "asignata") return ["acceptata", "in_preparare", "gata"].includes(stare); // cursa se ia după acceptare
  if (pasNou === "preluata") return stare === "gata"; // se ridică doar ce e gata
  if (pasNou === "livrata") return stare === "in_livrare"; // se predă doar ce a fost preluat
  return true; // spre_restaurant, spre_client, neasignata (renunțare)
} // sfârșitul funcției

// Corpul PATCH pentru un pas al livrării; „preluata” și „livrata” schimbă și starea comenzii (prin aplicaTranzitie)
export function aplicaPasLivrare(comanda, pasNou, acum = new Date(), { livratorId } = {}) { // livratorId: doar pentru „asignata”
  if (!poateAvansaLivrarea(comanda, pasNou)) throw new Error(`Livrarea nu poate trece la „${ETICHETE_PAS_LIVRARE[pasNou] ?? pasNou}”.`); // pas nepermis
  if (pasNou === "preluata") return { ...aplicaTranzitie(comanda, "in_livrare", acum), livrareStare: "preluata" }; // comanda pleacă din restaurant
  if (pasNou === "livrata") return aplicaTranzitie(comanda, "livrata", acum); // predată: livrata, plata și istoricul se sincronizează
  if (pasNou === "asignata") { // un livrator ia cursa
    if (!esteIdValid(livratorId)) throw new Error("Alege un livrator."); // fără livrator nu există asignare
    return { livrareStare: "asignata", livratorId }; // cine o duce
  } // sfârșitul if
  if (pasNou === "neasignata") return { livrareStare: "neasignata", livratorId: null }; // livratorul renunță
  return { livrareStare: pasNou }; // spre_restaurant sau spre_client
} // sfârșitul funcției

// --- crearea și afișarea ---

// Câmpurile noi ale unei comenzi abia plasate (din coș): stare, plată, pasul livrării și prima intrare din istoric
export function campuriInitiale({ livrare, metodaPlata }, acum = new Date()) { // primește tipul livrării și metoda de plată
  if (!METODE_PLATA.includes(metodaPlata)) throw new Error("Metodă de plată necunoscută."); // doar valorile fixe
  const campuri = { // obiect nou
    stare: "plasata", // începutul drumului
    plata: { metoda: metodaPlata, stare: metodaPlata === "card_simulat" ? "platita" : "neplatita" }, // cardul simulat e „plătit” la plasare
    livratorId: null, // nimeni încă
    timpPreparare: null, // îl pune restaurantul la acceptare
    istoric: [{ stare: "plasata", la: acum.toISOString() }], // momentul plasării
  }; // sfârșitul obiectului
  if (livrare !== "ridicare") campuri.livrareStare = "neasignata"; // doar comenzile cu livrare
  return campuri; // câmpurile noi
} // sfârșitul funcției

// Pașii afișați pe pagina comenzii, cu momentul real din istoric când există.
// stare: „gata” (încheiat), „acum” (în curs), „urmeaza” sau „oprit” (anulată / respinsă); la = text ISO sau null
export function cronologie(comanda) { // primește o comandă
  const stare = stareComanda(comanda); // starea derivată
  const ridicare = esteRidicare(comanda); // alege drumul
  const drum = ridicare ? DRUM_RIDICARE : DRUM_LIVRARE; // pașii posibili
  const momente = new Map(); // stare -> ultimul moment din istoric
  for (const e of istoricComanda(comanda)) momente.set(e.stare, e.la); // ultima apariție câștigă
  if (!momente.has("plasata") && esteDataValida(comanda?.creata)) momente.set("plasata", comanda.creata); // data plasării din câmpul vechi `creata`
  const pas = (id, stareaPasului, curenta) => ({ id, text: etichetaPas(id, ridicare), stare: stareaPasului, curenta, la: stareaPasului === "urmeaza" ? null : momente.get(id) ?? null }); // un obiect nou pentru fiecare pas
  if (stare === "anulata" || stare === "respinsa") { // drumul s-a oprit
    const atinse = istoricComanda(comanda).map((e) => drum.indexOf(e.stare)); // pozițiile atinse pe drum (-1 pentru cele din afara lui)
    const ultim = Math.max(0, ...atinse); // cel mai departe pas atins („plasata” dacă nu știm)
    return [...drum.slice(0, ultim + 1).map((id) => pas(id, "gata", false)), pas(stare, "oprit", true)]; // pașii parcurși, apoi oprirea
  } // sfârșitul if
  const curent = Math.max(0, drum.indexOf(stare)); // poziția stării curente pe drum
  return drum.map((id, i) => { // un pas pentru fiecare stare a drumului
    if (i < curent) return pas(id, "gata", false); // parcurs
    if (i === curent) return pas(id, stare === "livrata" ? "gata" : "acum", true); // pasul curent („livrata” e încheiat)
    return pas(id, "urmeaza", false); // urmează
  }); // sfârșitul map-ului
} // sfârșitul funcției

// Validarea motivului de anulare / respingere; null dacă e bun, altfel mesajul
export function valideazaMotiv(motiv) { // primește textul
  const text = typeof motiv === "string" ? motiv.trim() : ""; // doar spațiile nu contează
  if (text === "") return "Spune pe scurt motivul."; // obligatoriu
  if (text.length > MOTIV_MAX) return `Motivul are maximum ${MOTIV_MAX} de caractere.`; // prea lung
  return null; // în regulă
} // sfârșitul funcției

// Validarea acceptării (pachetul B): minutele de preparare și, pentru o comandă fără preț, prețul; null sau mesajul
export function valideazaAcceptare({ timpPreparare, pret }, comanda) { // primește valorile din formular (numere) și comanda
  if (!Number.isInteger(timpPreparare) || timpPreparare < TIMP_PREPARARE_MIN || timpPreparare > TIMP_PREPARARE_MAX) return `Timpul de preparare e între ${TIMP_PREPARARE_MIN} și ${TIMP_PREPARARE_MAX} de minute.`; // minutele
  if (!arePretValid(comanda?.pret) && !arePretValid(pret)) return `Pune un preț întreg între 1 și ${PRET_MAXIM} lei.`; // comanda specială are nevoie de preț
  return null; // în regulă
} // sfârșitul funcției
