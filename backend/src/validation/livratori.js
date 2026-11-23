// Validarea unui livrator (POST și PATCH /livratori), ca în livrator.js din frontend.
// Frontend-ul trimite numele deja cu sufixul „ (livrator demo)”; serverul îl adaugă dacă lipsește.
import { NUME_LIVRATOR_MAX, NUME_LIVRATOR_MIN, SUFIX_LIVRATOR_DEMO } from "../constants.js";
import { boolean, gresit, ok, valideazaCampuri } from "./comune.js";

function nume(valoare) {
  if (typeof valoare !== "string" || valoare.trim() === "") return gresit("nume este obligatoriu");
  const curat = valoare.trim();
  const sufix = SUFIX_LIVRATOR_DEMO.trim();
  const faraSufix = curat.endsWith(sufix) ? curat.slice(0, -sufix.length).trim() : curat;
  if (faraSufix.length < NUME_LIVRATOR_MIN || faraSufix.length > NUME_LIVRATOR_MAX) return gresit(`nume are între ${NUME_LIVRATOR_MIN} și ${NUME_LIVRATOR_MAX} de caractere`);
  return ok(/demo/i.test(curat) ? curat : `${curat}${SUFIX_LIVRATOR_DEMO}`);
}

const CAMPURI = {
  nume: { obligatoriu: "nume este obligatoriu", verifica: nume },
  online: { implicit: false, verifica: boolean("online trebuie să fie true sau false") },
  activ: { implicit: true, verifica: boolean("activ trebuie să fie true sau false") },
};

export function valideazaLivrator(corp, { partial = false } = {}) {
  return valideazaCampuri(corp, CAMPURI, { partial });
}
