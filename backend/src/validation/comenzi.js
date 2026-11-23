// Validarea unei comenzi (POST și PATCH /comenzi). Câmpurile și valorile fixe sunt cele trimise de frontend
// (validare.js, cos.js, checkout.js, stari.js, cupoane.js). `categorie`, `speciala` și, pentru preparatele din meniu,
// `pret` nu se citesc de la client: le calculează serverul (vezi reguli/comenzi.js).
import {
  ADRESA_MAX, ADRESA_MIN, CODURI_CUPON, FORMAT_TELEFON, ISTORIC_MAXIM, METODE_PLATA, MOTIV_MAX, NUME_MAX, NUME_MIN,
  PASI_LIVRARE, PREPARAT_COMANDA_MAX, PRET_MAXIM, RESTAURANTE, STARI_COMANDA, STARI_PLATA, TIMP_PREPARARE_MAX,
  TIMP_PREPARARE_MIN, TIPURI_LIVRARE,
} from "../constants.js";
import { boolean, dataIso, dinLista, esteObiect, gresit, intreg, ok, sauNull, text, valideazaCampuri } from "./comune.js";

const NUME_RESTAURANTE = RESTAURANTE.map((r) => r.nume);

function plata(valoare) {
  if (!esteObiect(valoare) || !METODE_PLATA.includes(valoare.metoda) || !STARI_PLATA.includes(valoare.stare)) {
    return gresit(`plata trebuie să fie { metoda: ${METODE_PLATA.join(" / ")}, stare: ${STARI_PLATA.join(" / ")} }`);
  }
  return ok({ metoda: valoare.metoda, stare: valoare.stare });
}

function istoric(valoare) {
  const eroare = "istoric trebuie să fie o listă de { stare, la } cu o stare cunoscută și o dată ISO";
  if (!Array.isArray(valoare)) return gresit(eroare);
  const intrari = valoare.slice(-ISTORIC_MAXIM);
  if (!intrari.every((e) => esteObiect(e) && STARI_COMANDA.includes(e.stare) && dataIso("")(e.la).valoare)) return gresit(eroare);
  return ok(intrari.map((e) => ({ stare: e.stare, la: e.la })));
}

function contact(valoare) {
  if (!esteObiect(valoare)) return gresit("contact trebuie să fie { nume, telefon }");
  const nume = text({ min: NUME_MIN, max: NUME_MAX, eroare: `contact.nume are între ${NUME_MIN} și ${NUME_MAX} de caractere` })(valoare.nume);
  if (nume.eroare) return nume;
  const telefon = typeof valoare.telefon === "string" ? valoare.telefon.replace(/[\s.()-]/g, "") : "";
  if (!FORMAT_TELEFON.test(telefon)) return gresit("contact.telefon nu e un număr de telefon valid (ex. 0722 123 456)");
  return ok({ nume: nume.valoare, telefon });
}

function livratorId(valoare) {
  const valid = (Number.isInteger(valoare) && valoare > 0) || (typeof valoare === "string" && valoare.trim() !== "" && valoare.length <= 40);
  return valid ? ok(valoare) : gresit("livratorId trebuie să fie id-ul unui livrator sau null");
}

function campuri(acum) {
  return {
    preparat: {
      obligatoriu: "preparat este obligatoriu",
      verifica: text({ max: PREPARAT_COMANDA_MAX, eroare: `preparat trebuie să fie un text de cel mult ${PREPARAT_COMANDA_MAX} de caractere`, gol: "preparat nu poate fi gol" }),
    },
    restaurant: { obligatoriu: "restaurant este obligatoriu", verifica: dinLista(NUME_RESTAURANTE, `restaurant trebuie să fie unul dintre: ${NUME_RESTAURANTE.join(", ")}`) },
    livrare: { obligatoriu: "livrare este obligatorie", verifica: dinLista(TIPURI_LIVRARE, `livrare trebuie să fie unul dintre: ${TIPURI_LIVRARE.join(", ")}`) },
    livrata: { implicit: false, verifica: boolean("livrata trebuie să fie true sau false") },
    pret: { implicit: null, verifica: sauNull(intreg({ min: 1, max: PRET_MAXIM, eroare: `pret trebuie să fie un număr întreg între 1 și ${PRET_MAXIM} sau null` })) },
    creata: { implicit: () => acum.toISOString(), verifica: dataIso("creata trebuie să fie o dată ISO") },
    stare: { implicit: (d) => (d.livrata ? "livrata" : "plasata"), verifica: dinLista(STARI_COMANDA, `stare trebuie să fie una dintre: ${STARI_COMANDA.join(", ")}`) },
    plata: { implicit: (d) => ({ metoda: "numerar", stare: d.livrata ? "platita" : "neplatita" }), verifica: plata },
    livrareStare: {
      implicit: (d) => (d.livrare === "ridicare" ? null : d.stare === "livrata" ? "livrata" : "neasignata"),
      verifica: sauNull(dinLista(PASI_LIVRARE, `livrareStare trebuie să fie null sau una dintre: ${PASI_LIVRARE.join(", ")}`)),
    },
    livratorId: { implicit: null, verifica: sauNull(livratorId) },
    timpPreparare: { implicit: null, verifica: sauNull(intreg({ min: TIMP_PREPARARE_MIN, max: TIMP_PREPARARE_MAX, eroare: `timpPreparare e între ${TIMP_PREPARARE_MIN} și ${TIMP_PREPARARE_MAX} de minute sau null` })) },
    istoric: { implicit: (d) => [{ stare: d.stare, la: d.creata }], verifica: istoric },
    adresa: { implicit: null, verifica: sauNull(text({ min: ADRESA_MIN, max: ADRESA_MAX, eroare: `adresa are între ${ADRESA_MIN} și ${ADRESA_MAX} de caractere` })) },
    contact: { implicit: null, verifica: sauNull(contact) },
    programataLa: { implicit: null, verifica: sauNull(dataIso("programataLa trebuie să fie o dată ISO sau null")) },
    cupon: { implicit: null, verifica: sauNull(dinLista(CODURI_CUPON, "cupon necunoscut")) },
    reducere: { implicit: 0, verifica: intreg({ min: 0, max: PRET_MAXIM, eroare: "reducere trebuie să fie un număr întreg de lei, pozitiv sau 0" }) },
    motiv: { implicit: null, verifica: sauNull(text({ max: MOTIV_MAX, eroare: `motiv are cel mult ${MOTIV_MAX} de caractere` })) },
  };
}

export function valideazaComanda(corp, { partial = false, acum = new Date() } = {}) {
  return valideazaCampuri(corp, campuri(acum), { partial });
}
