// Modulul Restaurant / Catalog: dacă un restaurant primește comenzi (pauză, program) și dacă un preparat e disponibil.
// esteDeschis e copia funcției din frontend/src/program.js (verificată de frontend/tests/backendReguli.test.js).
// Un restaurant fără profil sau fără program e mereu deschis (cum e în seed), deci comenzile cursului merg la orice oră.
// Orele se citesc în fusul orar al serverului (în dezvoltare, același calculator ca browserul).
import { FORMAT_ORA, RESTAURANTE } from "../constants.js";
import { conflict } from "../erori.js";

const ZI_DUPA_GETDAY = Object.freeze(["duminica", "luni", "marti", "miercuri", "joi", "vineri", "sambata"]);

function minuteDin(ora) {
  const p = typeof ora === "string" ? ora.match(FORMAT_ORA) : null;
  return p ? Number(p[1]) * 60 + Number(p[2]) : null;
}

function intervalZi(valoare) {
  if (valoare === null || typeof valoare !== "object") return null;
  const d = minuteDin(valoare.deschide);
  const i = minuteDin(valoare.inchide);
  if (d === null || i === null || d === i) return null;
  return { d, i };
}

function inMilisecunde(acum) {
  if (acum instanceof Date) return acum.getTime();
  return typeof acum === "number" ? acum : NaN;
}

// Deschis la momentul `acum` (Date sau ms)? Un interval cu închiderea înaintea deschiderii trece de miezul nopții.
export function esteDeschis(profil, acum) {
  if (profil === null || typeof profil !== "object") return true;
  if (profil.pauzat === true) return false;
  const program = profil.program;
  if (program === null || typeof program !== "object") return true;
  const ms = inMilisecunde(acum);
  if (!Number.isFinite(ms)) return true;
  const data = new Date(ms);
  const minut = data.getHours() * 60 + data.getMinutes();
  const zi = data.getDay();
  const azi = intervalZi(program[ZI_DUPA_GETDAY[zi]]);
  const ieri = intervalZi(program[ZI_DUPA_GETDAY[(zi + 6) % 7]]);
  if (azi) {
    const pesteMiezulNoptii = azi.i < azi.d;
    if (!pesteMiezulNoptii && minut >= azi.d && minut < azi.i) return true;
    if (pesteMiezulNoptii && minut >= azi.d) return true;
  }
  if (ieri && ieri.i < ieri.d && minut < ieri.i) return true;
  return false;
}

export function estePreparatDisponibil(produs) {
  return produs?.disponibil !== false;
}

export function slugRestaurant(nume) {
  return RESTAURANTE.find((r) => r.nume === nume)?.slug ?? null;
}

// Momentul pentru care se verifică programul: ora programată sau acum (ca momentVerificare din frontend)
export function momentPlasare({ programataLa }, acum) {
  const ms = typeof programataLa === "string" ? Date.parse(programataLa) : NaN;
  return Number.isFinite(ms) ? ms : acum.getTime();
}

// Regulile plasării (aceleași mesaje ca problemeCos din frontend). `produs` = preparatul din meniu sau null (comandă specială).
// Aruncă 409 dacă preparatul e indisponibil sau restaurantul e în pauză / închis la ora comenzii.
export function verificaPlasare(comanda, { produs, profil, acum }) {
  if (produs && !estePreparatDisponibil(produs)) throw conflict(`„${produs.preparat}” nu mai e disponibil. Scoate-l din coș ca să poți plasa comanda.`);
  if (profil?.pauzat === true) throw conflict(`${comanda.restaurant} nu primește comenzi acum (pauză).`);
  if (!esteDeschis(profil, momentPlasare(comanda, acum))) {
    throw conflict(`${comanda.restaurant} e închis la ora aleasă. Programează comanda în orele lui sau alege alt restaurant.`);
  }
}
