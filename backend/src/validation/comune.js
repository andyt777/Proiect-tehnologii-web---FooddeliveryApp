// Validarea prin listă albă: doar câmpurile descrise aici ajung în `date`, curățate. Restul (inclusiv `id`) sunt ignorate.
// Fiecare câmp are o funcție `verifica(valoare)` care întoarce { valoare } (curățată) sau { eroare }.
// `partial: true` (PATCH): verificăm doar câmpurile trimise, fără obligatorii și fără valori implicite.

export function esteObiect(valoare) {
  return valoare !== null && typeof valoare === "object" && !Array.isArray(valoare);
}

// campuri: { nume: { verifica, obligatoriu?: mesaj, implicit?: valoare | (date) => valoare } }, în ordinea în care se verifică
export function valideazaCampuri(corp, campuri, { partial = false } = {}) {
  if (!esteObiect(corp)) return { erori: ["Corpul cererii trebuie să fie un obiect JSON"], date: {} };
  const erori = [];
  const date = {};
  for (const [nume, regula] of Object.entries(campuri)) {
    if (!Object.hasOwn(corp, nume)) {
      if (partial) continue;
      if (regula.obligatoriu) erori.push(regula.obligatoriu);
      else if (Object.hasOwn(regula, "implicit")) date[nume] = typeof regula.implicit === "function" ? regula.implicit(date) : regula.implicit;
      continue;
    }
    const rezultat = regula.verifica(corp[nume], date);
    if (Object.hasOwn(rezultat, "eroare")) erori.push(rezultat.eroare);
    else date[nume] = rezultat.valoare;
  }
  if (partial && erori.length === 0 && Object.keys(date).length === 0) erori.push("Nu ai trimis niciun câmp cunoscut de modificat");
  return { erori, date };
}

export const ok = (valoare) => ({ valoare });
export const gresit = (eroare) => ({ eroare });

export function text({ min = 1, max, eroare, gol = eroare }) {
  return (valoare) => {
    if (typeof valoare !== "string") return gresit(eroare);
    const curat = valoare.trim();
    if (curat === "") return gresit(gol);
    if (curat.length < min || curat.length > max) return gresit(eroare);
    return ok(curat);
  };
}

export function dinLista(lista, eroare) {
  return (valoare) => (lista.includes(valoare) ? ok(valoare) : gresit(eroare));
}

export function boolean(eroare) {
  return (valoare) => (typeof valoare === "boolean" ? ok(valoare) : gresit(eroare));
}

export function intreg({ min, max, eroare }) {
  return (valoare) => (Number.isInteger(valoare) && valoare >= min && valoare <= max ? ok(valoare) : gresit(eroare));
}

export function dataIso(eroare) {
  return (valoare) => (typeof valoare === "string" && valoare !== "" && !Number.isNaN(Date.parse(valoare)) ? ok(valoare) : gresit(eroare));
}

// Acceptă și null (câmp gol), altfel aplică verificarea primită
export function sauNull(verifica) {
  return (valoare, date) => (valoare === null ? ok(null) : verifica(valoare, date));
}

// Mesajul final pentru 400: toate problemele, într-un singur text
export function mesajErori(erori) {
  return erori.join("; ");
}
