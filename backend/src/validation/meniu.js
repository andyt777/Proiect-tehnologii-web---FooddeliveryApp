// Validarea unui preparat din meniu (POST și PATCH /meniu), cu aceleași reguli ca meniuAdmin.js din frontend.
import { CATEGORII, IMAGINE_MAX, NUME_PREPARAT_MAX, NUME_PREPARAT_MIN, PRET_PREPARAT_MAX, RESTAURANTE } from "../constants.js";
import { boolean, dinLista, gresit, intreg, ok, sauNull, text, valideazaCampuri } from "./comune.js";

const NUME_RESTAURANTE = RESTAURANTE.map((r) => r.nume);

// O cale locală („/img/pizza.webp”) sau o adresă http(s); „javascript:” și altele sunt refuzate
export function esteImagineSigura(valoare) {
  if (typeof valoare !== "string" || valoare === "" || valoare.length > IMAGINE_MAX) return false;
  if (valoare.startsWith("/")) return !valoare.startsWith("//") && /^\/[A-Za-z0-9._~\-/]+$/.test(valoare);
  try {
    const url = new URL(valoare);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function numePreparat(valoare) {
  const rezultat = text({ min: NUME_PREPARAT_MIN, max: NUME_PREPARAT_MAX, eroare: `preparat are între ${NUME_PREPARAT_MIN} și ${NUME_PREPARAT_MAX} de caractere`, gol: "preparat nu poate fi gol" })(valoare);
  if (rezultat.valoare && / × \d+$/.test(rezultat.valoare)) return gresit("preparat nu se poate termina cu „× număr” (așa scriem cantitatea în comenzi)");
  return rezultat;
}

function imagine(valoare) {
  const curat = typeof valoare === "string" ? valoare.trim() : valoare;
  if (curat === "") return ok(null);
  return esteImagineSigura(curat) ? ok(curat) : gresit("imagine trebuie să fie o cale care începe cu „/” sau o adresă http(s)");
}

const CAMPURI = {
  preparat: { obligatoriu: "preparat este obligatoriu", verifica: numePreparat },
  restaurant: { obligatoriu: "restaurant este obligatoriu", verifica: dinLista(NUME_RESTAURANTE, `restaurant trebuie să fie unul dintre: ${NUME_RESTAURANTE.join(", ")}`) },
  categorie: { obligatoriu: "categorie este obligatorie", verifica: dinLista(CATEGORII, `categorie trebuie să fie una dintre: ${CATEGORII.join(", ")}`) },
  pret: { obligatoriu: "pret este obligatoriu", verifica: intreg({ min: 1, max: PRET_PREPARAT_MAX, eroare: `pret trebuie să fie un număr întreg între 1 și ${PRET_PREPARAT_MAX}` }) },
  imagine: { implicit: null, verifica: sauNull(imagine) },
  disponibil: { implicit: true, verifica: boolean("disponibil trebuie să fie true sau false") },
};

export function valideazaPreparat(corp, { partial = false } = {}) {
  return valideazaCampuri(corp, CAMPURI, { partial });
}
