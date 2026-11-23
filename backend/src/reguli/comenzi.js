// Regulile serverului pentru comenzi: câmpurile pe care clientul nu le decide.
// Un preparat din meniu („Pizza Diavola” sau „Pizza Diavola × 2”, ca în cos.js) primește prețul și categoria din meniu;
// orice altceva e o comandă specială: categoria vine din restaurant, iar prețul îl pune restaurantul la acceptare.
// Tot aici, Order Management coordonează cele trei stări (comandă, plată, livrare) la plasare și la PATCH:
// serverul calculează singur rezultatul unei schimbări, cu regulile din stari.js, plata.js și livrare.js,
// iar valorile trimise de client trebuie să se potrivească cu el (altfel 409). Istoricul îl scrie doar serverul.
import { ISTORIC_MAXIM, RESTAURANTE } from "../constants.js";
import { cerereGresita, conflict } from "../erori.js";
import { aplicaPasLivrare, mesajPasLivrare, verificaLivratorAsignabil } from "./livrare.js";
import { aceeasiPlata, plataComanda, plataInitiala } from "./plata.js";
import {
  arePretValid, aplicaTranzitie, comutaLivrata, curataMotiv, esteRidicare, esteTimpPreparareValid, etichetaPas, istoricComanda,
  livratorComanda, mesajTranzitie, pasLivrareComanda, poateTrece, stareComanda, stareInainteDeLivrare,
} from "./stari.js";

export function potrivireMeniu({ preparat, restaurant }, meniu) {
  const cuCantitate = /^(.*) × (\d+)$/.exec(preparat);
  const baza = cuCantitate ? cuCantitate[1] : preparat;
  const cantitate = cuCantitate ? Number(cuCantitate[2]) : 1;
  if (cantitate < 1) return null;
  const produs = meniu.find((p) => p.restaurant === restaurant && p.preparat === baza);
  return produs ? { produs, cantitate } : null;
}

// Câmpurile calculate de server; `pret` lipsește pentru o comandă specială (rămâne cel validat)
export function campuriCalculate(comanda, meniu) {
  const potrivire = potrivireMeniu(comanda, meniu);
  if (potrivire) return { categorie: potrivire.produs.categorie, pret: potrivire.produs.pret * potrivire.cantitate, speciala: false };
  return { categorie: RESTAURANTE.find((r) => r.nume === comanda.restaurant)?.categorie ?? null, speciala: true };
}

// Livratorul are o cursă în lucru (comandă cu el, încă nefinalizată)?
export function areCursaInLucru(comenzi, livratorId) {
  return comenzi.some((c) => String(c.livratorId) === String(livratorId) && c.livrata !== true && !["livrata", "anulata", "respinsa"].includes(c.stare));
}

// --- plasarea (POST) ---

// Câmpurile ciclului de viață ale unei comenzi noi, decise de server. Clientul alege doar metoda de plată.
// O comandă nouă pornește din „plasata” (sau „livrata”, cu livrata: true, ca formularul din Etapa 7); altă stare -> 409.
export function campuriPlasare(date, acum = new Date()) {
  const stare = date.livrata ? "livrata" : "plasata";
  if (date.stare !== stare) {
    throw conflict(`O comandă nouă pornește din „${etichetaPas(stare)}”, nu din „${etichetaPas(date.stare)}”. Starea se schimbă apoi cu PATCH /comenzi/:id.`);
  }
  return {
    stare,
    plata: plataInitiala(date.plata?.metoda, date.livrata),
    livrareStare: date.livrare === "ridicare" ? null : stare === "livrata" ? "livrata" : "neasignata",
    livratorId: null,
    timpPreparare: null,
    motiv: null,
    istoric: [{ stare, la: acum.toISOString() }],
  };
}

// --- modificarea (PATCH) ---

const CAMPURI_CICLU = Object.freeze(["stare", "livrata", "plata", "livrareStare", "livratorId", "timpPreparare", "motiv", "istoric"]);

function acelasiLivrator(a, b) {
  if (a === null || b === null) return a === b;
  return String(a) === String(b);
}

// Starea cerută: `stare` dacă e trimisă; altfel bifa `livrata` (true -> livrată, false -> starea de dinainte)
function stareCeruta(cerere, comanda, din) {
  if (Object.hasOwn(cerere, "stare")) {
    if (Object.hasOwn(cerere, "livrata") && cerere.livrata !== (cerere.stare === "livrata")) {
      throw conflict("livrata și stare se contrazic: livrata e true doar pentru starea „livrata”.");
    }
    return cerere.stare;
  }
  if (!Object.hasOwn(cerere, "livrata")) return din;
  if (cerere.livrata) return "livrata";
  return din === "livrata" ? stareInainteDeLivrare(istoricComanda(comanda)) : din;
}

function tranzitie(comanda, din, tinta, cerere, acum) {
  if (din === "livrata") {
    const inapoi = stareInainteDeLivrare(istoricComanda(comanda));
    if (tinta !== inapoi) throw conflict(`Comanda e livrată: se poate doar debifa „Livrată”, iar atunci revine în „${etichetaPas(inapoi, esteRidicare(comanda))}”.`);
    return comutaLivrata(comanda, acum);
  }
  // Bifa „Livrată” de pe „/” e o scurtătură manuală permisă din orice stare nelivrată, exact ca în interfață
  if (tinta === "livrata") return comutaLivrata(comanda, acum);
  if (!poateTrece(comanda, tinta)) throw conflict(mesajTranzitie(comanda, tinta));
  if ((tinta === "anulata" || tinta === "respinsa") && !curataMotiv(cerere.motiv)) {
    throw cerereGresita(`motiv este obligatoriu când comanda e ${tinta === "anulata" ? "anulată" : "respinsă"}: spune pe scurt de ce.`);
  }
  if (tinta === "acceptata") {
    if (!esteTimpPreparareValid(cerere.timpPreparare)) throw cerereGresita("timpPreparare este obligatoriu la acceptare: minutele de preparare, între 5 și 180.");
    if (!arePretValid(comanda.pret) && !arePretValid(cerere.pret)) throw cerereGresita("pret este obligatoriu la acceptarea unei comenzi speciale (un număr întreg de lei).");
  }
  return aplicaTranzitie(comanda, tinta, acum, { motiv: cerere.motiv, timpPreparare: cerere.timpPreparare, pret: cerere.pret });
}

// Valorile trimise pentru câmpurile ciclului trebuie să fie exact cele calculate de server
function verificaPotrivire(cerere, finala) {
  if (Object.hasOwn(cerere, "stare") && cerere.stare !== stareComanda(finala)) throw conflict(`stare nu se potrivește cu pasul cerut: comanda ajunge în „${etichetaPas(stareComanda(finala))}”.`);
  if (Object.hasOwn(cerere, "livrata") && cerere.livrata !== (stareComanda(finala) === "livrata")) throw conflict("livrata nu se potrivește cu starea comenzii.");
  if (Object.hasOwn(cerere, "plata") && !aceeasiPlata(cerere.plata, plataComanda(finala))) {
    const p = plataComanda(finala);
    throw conflict(`Plata nu se schimbă direct: rămâne ${p.metoda} / ${p.stare}. Serverul o încasează la predare (numerar) și o rambursează la anulare sau respingere.`);
  }
  if (Object.hasOwn(cerere, "livratorId") && !acelasiLivrator(cerere.livratorId, livratorComanda(finala))) {
    throw conflict("Livratorul se schimbă doar prin asignare (livrareStare „asignata”) sau retragere (livrareStare „neasignata”).");
  }
  const timp = esteTimpPreparareValid(finala.timpPreparare) ? finala.timpPreparare : null;
  if (Object.hasOwn(cerere, "timpPreparare") && cerere.timpPreparare !== timp) throw conflict("timpPreparare se stabilește o singură dată, la acceptarea comenzii.");
  if (Object.hasOwn(cerere, "motiv") && curataMotiv(cerere.motiv) !== curataMotiv(finala.motiv)) throw conflict("motiv se trimite doar la anulare sau respingere.");
}

// Schimbările unui PATCH, după regulile serverului. `schimbari` = câmpurile validate (lista albă).
// `istoric` trimis de client e ignorat: serverul adaugă singur o intrare { stare, la } la fiecare schimbare de stare.
// Întoarce câmpurile de salvat; aruncă 409 pentru o tranziție nepermisă și 400 pentru un detaliu lipsă (motiv, timp, preț).
export function modificareComanda(existenta, schimbari, { acum = new Date(), livratori = [] } = {}) {
  const cerere = { ...schimbari };
  delete cerere.istoric;
  const libere = Object.fromEntries(Object.entries(cerere).filter(([camp]) => !CAMPURI_CICLU.includes(camp)));
  const din = stareComanda(existenta);
  const tinta = stareCeruta(cerere, existenta, din);
  let rezultat = {};

  if (Object.hasOwn(libere, "livrare") && esteRidicare(existenta) !== (libere.livrare === "ridicare")) {
    if (din !== "plasata" || tinta !== din) throw conflict("Tipul livrării (ridicare sau cu livrator) se schimbă doar cât comanda e „Plasată”.");
    rezultat = { livrareStare: libere.livrare === "ridicare" ? null : "neasignata", livratorId: null };
  }
  const baza = { ...existenta, ...libere, ...rezultat };

  if (tinta !== din) rezultat = { ...rezultat, ...tranzitie(baza, din, tinta, cerere, acum) };

  if (Object.hasOwn(cerere, "livrareStare") && cerere.livrareStare !== pasLivrareComanda({ ...baza, ...rezultat })) {
    if (tinta !== din) throw conflict(mesajPasLivrare(baza, cerere.livrareStare));
    rezultat = { ...rezultat, ...aplicaPasLivrare(baza, cerere.livrareStare, acum, { livratorId: cerere.livratorId }) };
    if (rezultat.livrareStare === "asignata") verificaLivratorAsignabil(livratori.find((l) => String(l.id) === String(rezultat.livratorId)));
  }

  verificaPotrivire(cerere, { ...baza, ...rezultat });
  if (rezultat.istoric) rezultat.istoric = rezultat.istoric.slice(-ISTORIC_MAXIM);
  return { ...libere, ...rezultat };
}
