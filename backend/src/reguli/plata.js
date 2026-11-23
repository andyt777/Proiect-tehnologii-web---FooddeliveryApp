// Modulul Payment: starea plății (plata.stare), separată de starea comenzii și de cea a livrării.
// Aceleași reguli ca plataComanda / plataDupa / comutaLivrata din frontend/src/stari.js.
// Plata e simulată: „card_simulat” e plătit la plasare, numerarul se încasează la predare.
import { METODE_PLATA, STARI_PLATA } from "../constants.js";

function esteObiect(valoare) {
  return valoare !== null && typeof valoare === "object" && !Array.isArray(valoare);
}

// Plata unei comenzi; lipsă (comenzile vechi) -> numerar, plătită doar dacă e livrată
export function plataComanda(comanda) {
  const plata = comanda?.plata;
  if (esteObiect(plata) && METODE_PLATA.includes(plata.metoda) && STARI_PLATA.includes(plata.stare)) return { metoda: plata.metoda, stare: plata.stare };
  return { metoda: "numerar", stare: comanda?.livrata === true ? "platita" : "neplatita" };
}

// Plata unei comenzi noi: serverul decide starea, clientul alege doar metoda
export function plataInitiala(metoda, livrata = false) {
  const m = METODE_PLATA.includes(metoda) ? metoda : "numerar";
  return { metoda: m, stare: m === "card_simulat" || livrata ? "platita" : "neplatita" };
}

// După o tranziție a comenzii: încasare la predare, rambursare la anulare / respingere
export function plataDupa(plata, stareNoua) {
  if (stareNoua === "livrata" && plata.metoda === "numerar" && plata.stare === "neplatita") return { metoda: "numerar", stare: "platita" };
  if ((stareNoua === "anulata" || stareNoua === "respinsa") && plata.stare === "platita") return { metoda: plata.metoda, stare: "rambursata" };
  return { metoda: plata.metoda, stare: plata.stare };
}

// Debifarea lui „Livrată”: numerarul nu mai e încasat; cardul rămâne cum era
export function plataLaDebifare(plata) {
  return plata.metoda === "numerar" && plata.stare === "platita" ? { metoda: "numerar", stare: "neplatita" } : plata;
}

export function aceeasiPlata(a, b) {
  return a.metoda === b.metoda && a.stare === b.stare;
}
