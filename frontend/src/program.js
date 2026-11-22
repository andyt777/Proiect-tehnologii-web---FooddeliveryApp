// Profilul și programul restaurantelor (resursa json-server „restaurante”, id = slug-ul restaurantului).
// Un profil: { id, descriere, telefon, pauzat, program: { luni: { deschide, inchide } | null, ... } }.
// Un restaurant fără profil (sau fără program) e considerat deschis: datele vechi din db.json merg ca înainte.
// Orele sunt în fusul orar al browserului. Un interval cu închiderea mai devreme decât deschiderea
// (ex. 18:00–02:00) trece de miezul nopții și continuă în ziua următoare.
// Funcții pure (fără React), testate cu `node --test`. Verificările rulează doar în browser: nu sunt securitate.
import { slugDin } from "./restaurante.js";
import { curataTelefon, valideazaTelefon } from "./profil.js";
import { momentProgramat } from "./checkout.js";

export const ZILE = Object.freeze(["luni", "marti", "miercuri", "joi", "vineri", "sambata", "duminica"]);
export const ETICHETE_ZI = Object.freeze({
  luni: "Luni",
  marti: "Marți",
  miercuri: "Miercuri",
  joi: "Joi",
  vineri: "Vineri",
  sambata: "Sâmbătă",
  duminica: "Duminică",
});
const ZI_DUPA_GETDAY = Object.freeze(["duminica", "luni", "marti", "miercuri", "joi", "vineri", "sambata"]);
const FORMAT_ORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const DESCRIERE_MAX = 200;

function minuteDin(ora) {
  const p = typeof ora === "string" ? ora.match(FORMAT_ORA) : null;
  return p ? Number(p[1]) * 60 + Number(p[2]) : null;
}

export function esteOra(text) {
  return minuteDin(text) !== null;
}

// Intervalul unei zile, curățat: { deschide, inchide } sau null (închis / date greșite)
function intervalZi(valoare) {
  if (valoare === null || typeof valoare !== "object") return null;
  const d = minuteDin(valoare.deschide);
  const i = minuteDin(valoare.inchide);
  if (d === null || i === null || d === i) return null;
  return { deschide: valoare.deschide, inchide: valoare.inchide, d, i };
}

function inMilisecunde(acum) {
  if (acum instanceof Date) return acum.getTime();
  return typeof acum === "number" ? acum : NaN;
}

// Deschis la momentul `acum` (Date sau milisecunde)? Fără profil, fără program sau fără ceas: deschis.
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

// Starea afișată pe carduri: { deschis, motiv: null | "pauza" | "inchis", eticheta }
export function stareRestaurant(profil, acum) {
  if (profil?.pauzat === true) return { deschis: false, motiv: "pauza", eticheta: "În pauză" };
  if (!esteDeschis(profil, acum)) return { deschis: false, motiv: "inchis", eticheta: "Închis acum" };
  return { deschis: true, motiv: null, eticheta: "Deschis" };
}

// Profilul unui restaurant după numele lui (din meniu sau din comandă); null dacă nu există
export function profilRestaurant(profiluri, nume) {
  if (!(profiluri instanceof Map)) return null;
  return profiluri.get(slugDin(nume)) ?? null;
}

// Un preparat e disponibil dacă nu are `disponibil: false` (preparatele vechi nu au câmpul)
export function estePreparatDisponibil(produs) {
  return produs?.disponibil !== false;
}

// De ce nu se poate adăuga un preparat în coș acum: null sau textul scurt de pe card
export function motivIndisponibil(produs, profil, acum) {
  if (!estePreparatDisponibil(produs)) return "Indisponibil";
  const stare = stareRestaurant(profil, acum);
  return stare.deschis ? null : stare.eticheta;
}

// Programul curățat: fiecare zi are { deschide, inchide } sau null; null dacă nu e un obiect
function curataProgram(program) {
  if (program === null || typeof program !== "object" || Array.isArray(program)) return null;
  const curat = {};
  for (const zi of ZILE) {
    const interval = intervalZi(program[zi]);
    curat[zi] = interval ? { deschide: interval.deschide, inchide: interval.inchide } : null;
  }
  return curat;
}

// Lista de la GET /restaurante -> Map slug -> profil curățat. Intrările stricate sunt sărite.
export function curataProfiluri(lista) {
  const harta = new Map();
  if (!Array.isArray(lista)) return harta;
  for (const p of lista) {
    if (p === null || typeof p !== "object" || typeof p.id !== "string" || p.id.trim() === "" || harta.has(p.id)) continue;
    harta.set(p.id, {
      id: p.id,
      descriere: typeof p.descriere === "string" ? p.descriere.slice(0, DESCRIERE_MAX) : "",
      telefon: typeof p.telefon === "string" ? p.telefon : "",
      pauzat: p.pauzat === true,
      program: curataProgram(p.program),
    });
  }
  return harta;
}

// Valorile de pornire ale formularului de profil, dintr-un profil (sau null)
export function valoriFormularProfil(profil) {
  const program = {};
  for (const zi of ZILE) {
    const interval = profil?.program ? intervalZi(profil.program[zi]) : null;
    program[zi] = interval
      ? { deschis: true, deschide: interval.deschide, inchide: interval.inchide }
      : { deschis: !profil?.program, deschide: "10:00", inchide: "22:00" };
  }
  return { descriere: profil?.descriere ?? "", telefon: profil?.telefon ?? "", pauzat: profil?.pauzat === true, program };
}

// Validarea formularului: null sau { camp, mesaj } pentru primul câmp greșit (camp = „descriere”, „telefon” sau „program-<zi>”)
export function valideazaProfil({ descriere, telefon, program }) {
  const text = typeof descriere === "string" ? descriere.trim() : "";
  if (text.length > DESCRIERE_MAX) return { camp: "descriere", mesaj: `Descrierea are maximum ${DESCRIERE_MAX} de caractere.` };
  if (typeof telefon === "string" && telefon.trim() !== "") {
    if (valideazaTelefon(telefon)) return { camp: "telefon", mesaj: "Numărul de telefon nu e valid. Exemplu: 0722 123 456." };
  }
  if (program === null || typeof program !== "object") return { camp: `program-${ZILE[0]}`, mesaj: "Completează programul." };
  for (const zi of ZILE) {
    const z = program[zi];
    if (!z || z.deschis !== true) continue;
    if (!esteOra(z.deschide) || !esteOra(z.inchide)) return { camp: `program-${zi}`, mesaj: `${ETICHETE_ZI[zi]}: scrie ora de deschidere și de închidere.` };
    if (z.deschide === z.inchide) return { camp: `program-${zi}`, mesaj: `${ETICHETE_ZI[zi]}: ora de închidere trebuie să fie diferită de cea de deschidere.` };
  }
  return null;
}

// Corpul trimis la server (valorile sunt deja validate)
export function profilDinFormular(slug, { descriere, telefon, pauzat, program }) {
  const p = {};
  for (const zi of ZILE) {
    const z = program[zi];
    p[zi] = z?.deschis ? { deschide: z.deschide, inchide: z.inchide } : null;
  }
  return {
    id: slug,
    descriere: descriere.trim(),
    telefon: telefon.trim() === "" ? "" : curataTelefon(telefon),
    pauzat: pauzat === true,
    program: p,
  };
}

// Rândurile programului pentru afișare: [{ zi, eticheta, text }]; [] fără program
export function randuriProgram(profil) {
  if (!profil?.program) return [];
  return ZILE.map((zi) => {
    const interval = intervalZi(profil.program[zi]);
    const text = interval
      ? `${interval.deschide}–${interval.inchide}${interval.i < interval.d ? " (a doua zi)" : ""}`
      : "Închis";
    return { zi, eticheta: ETICHETE_ZI[zi], text };
  });
}

// Liniile coșului care blochează plasarea: [{ produsId, motiv, mesaj }]. `motiv` e textul scurt de pe linie,
// `mesaj` explicația completă (aceeași pentru toate liniile unui restaurant închis, ca pagina să o arate o singură dată).
// `moment` = când trebuie pregătită comanda (acum sau ora programată), în ms sau Date.
export function problemeCos(linii, profiluri, moment) {
  if (!Array.isArray(linii)) return [];
  const probleme = [];
  for (const l of linii) {
    const profil = profilRestaurant(profiluri, l.restaurant);
    if (!estePreparatDisponibil(l)) {
      probleme.push({ produsId: l.id, motiv: "Indisponibil", mesaj: `„${l.preparat}” nu mai e disponibil. Scoate-l din coș ca să poți plasa comanda.` });
    } else if (profil?.pauzat === true) {
      probleme.push({ produsId: l.id, motiv: "Restaurant în pauză", mesaj: `${l.restaurant} nu primește comenzi acum (pauză). Scoate preparatele lui din coș.` });
    } else if (!esteDeschis(profil, moment)) {
      probleme.push({ produsId: l.id, motiv: "Restaurant închis", mesaj: `${l.restaurant} e închis la ora aleasă. Programează comanda în orele lui sau scoate preparatele lui din coș.` });
    }
  }
  return probleme;
}

// Mesajele distincte ale problemelor, în ordine
export function mesajeProbleme(probleme) {
  return [...new Set((Array.isArray(probleme) ? probleme : []).map((p) => p.mesaj))];
}

// Momentul pentru care se verifică programul la plasare: ora programată (azi) sau acum. null fără ceas.
export function momentVerificare(programare, ora, acumMs) {
  if (!Number.isFinite(acumMs)) return null;
  if (programare === "programat") {
    const data = momentProgramat(ora, new Date(acumMs));
    return data ? data.getTime() : acumMs;
  }
  return acumMs;
}
