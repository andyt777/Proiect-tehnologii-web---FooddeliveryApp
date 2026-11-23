// Validarea unei recenzii (POST /recenzii), ca în recenzii.js din frontend: nota 1–5, text opțional.
// Legătura cu o comandă livrată, „o singură recenzie pe comandă” și restaurantul (luat din comandă) se stabilesc în router.
import { NOTA_MAX, NOTA_MIN, TEXT_RECENZIE_MAX } from "../constants.js";
import { dataIso, gresit, intreg, ok, valideazaCampuri } from "./comune.js";

function comandaId(valoare) {
  return Number.isInteger(valoare) && valoare > 0 ? ok(valoare) : gresit("comandaId trebuie să fie id-ul (număr întreg) unei comenzi");
}

function textRecenzie(valoare) {
  if (typeof valoare !== "string") return gresit("text trebuie să fie un text");
  const curat = valoare.trim();
  return curat.length > TEXT_RECENZIE_MAX ? gresit(`text are cel mult ${TEXT_RECENZIE_MAX} de caractere`) : ok(curat);
}

function campuri(acum) {
  return {
    comandaId: { obligatoriu: "comandaId este obligatoriu", verifica: comandaId },
    nota: { obligatoriu: "nota este obligatorie", verifica: intreg({ min: NOTA_MIN, max: NOTA_MAX, eroare: `nota trebuie să fie un număr întreg între ${NOTA_MIN} și ${NOTA_MAX}` }) },
    text: { implicit: "", verifica: textRecenzie },
    creata: { implicit: () => acum.toISOString(), verifica: dataIso("creata trebuie să fie o dată ISO") },
  };
}

export function valideazaRecenzie(corp, { partial = false, acum = new Date() } = {}) {
  return valideazaCampuri(corp, campuri(acum), { partial });
}
