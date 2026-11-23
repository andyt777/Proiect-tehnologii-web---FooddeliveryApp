// Validarea profilului unui restaurant (POST și PUT /restaurante), ca în program.js din frontend.
// PUT înlocuiește tot profilul, deci folosește aceeași validare completă ca POST.
import { DESCRIERE_MAX, FORMAT_ORA, FORMAT_TELEFON, ZILE } from "../constants.js";
import { boolean, esteObiect, gresit, ok, valideazaCampuri } from "./comune.js";

function descriere(valoare) {
  if (typeof valoare !== "string") return gresit("descriere trebuie să fie un text");
  const curat = valoare.trim();
  return curat.length > DESCRIERE_MAX ? gresit(`descriere are cel mult ${DESCRIERE_MAX} de caractere`) : ok(curat);
}

function telefon(valoare) {
  if (typeof valoare !== "string") return gresit("telefon trebuie să fie un text");
  const curat = valoare.replace(/[\s.()-]/g, "");
  if (curat === "") return ok("");
  return FORMAT_TELEFON.test(curat) ? ok(curat) : gresit("telefon nu e un număr valid (ex. 0722 123 456)");
}

// { luni: { deschide, inchide } | null, ... }: toate cele 7 zile, ore „HH:MM” diferite între ele
function program(valoare) {
  if (!esteObiect(valoare)) return gresit(`program trebuie să aibă zilele: ${ZILE.join(", ")}`);
  const curat = {};
  for (const zi of ZILE) {
    const z = valoare[zi];
    if (z === null || z === undefined) {
      curat[zi] = null;
      continue;
    }
    if (!esteObiect(z) || !FORMAT_ORA.test(z.deschide) || !FORMAT_ORA.test(z.inchide) || z.deschide === z.inchide) {
      return gresit(`program.${zi} trebuie să fie null sau { deschide, inchide } cu ore „HH:MM” diferite`);
    }
    curat[zi] = { deschide: z.deschide, inchide: z.inchide };
  }
  return ok(curat);
}

const CAMPURI = {
  descriere: { implicit: "", verifica: descriere },
  telefon: { implicit: "", verifica: telefon },
  pauzat: { implicit: false, verifica: boolean("pauzat trebuie să fie true sau false") },
  program: { obligatoriu: "program este obligatoriu", verifica: program },
};

export function valideazaProfilRestaurant(corp, { partial = false } = {}) {
  return valideazaCampuri(corp, CAMPURI, { partial });
}
