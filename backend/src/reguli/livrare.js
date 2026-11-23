// Modulul Delivery & Dispatch: pașii livrării (`livrareStare`), livratorul comenzii și alocarea automată.
// Pașii sunt copia regulilor din frontend/src/stari.js (poateAvansaLivrarea / aplicaPasLivrare), verificată de
// frontend/tests/backendReguli.test.js. Doar „preluata” și „livrata” schimbă și starea comenzii, prin aplicaTranzitie.
import { conflict } from "../erori.js";
import { aplicaTranzitie, esteFinala, esteIdValid, esteRidicare, etichetaPas, livratorComanda, pasLivrareComanda, stareComanda } from "./stari.js";

export const ETICHETE_PAS_LIVRARE = Object.freeze({
  neasignata: "Fără livrator",
  asignata: "Livrator asignat",
  spre_restaurant: "Livratorul merge la restaurant",
  preluata: "Preluată de livrator",
  spre_client: "Livratorul vine spre tine",
  livrata: "Livrată",
});

export const TRANZITII_LIVRARE = new Map([
  ["neasignata", ["asignata"]],
  ["asignata", ["spre_restaurant", "neasignata"]],
  ["spre_restaurant", ["preluata"]],
  ["preluata", ["spre_client"]],
  ["spre_client", ["livrata"]],
  ["livrata", []],
]);

// O cursă se ia după ce restaurantul a acceptat comanda (ca în frontend)
export const STARI_ASIGNARE = Object.freeze(["acceptata", "in_preparare", "gata"]);

// Un livrator duce o singură cursă o dată (CURSE_ACTIVE_MAX din frontend/src/livrator.js)
export const CURSE_ACTIVE_MAX = 1;

export function poateAvansaLivrarea(comanda, pasNou) {
  if (esteRidicare(comanda) || esteFinala(comanda)) return false;
  const stare = stareComanda(comanda);
  const urmatori = TRANZITII_LIVRARE.get(pasLivrareComanda(comanda)) ?? [];
  if (!urmatori.includes(pasNou)) return false;
  if (pasNou === "asignata") return STARI_ASIGNARE.includes(stare);
  if (pasNou === "preluata") return stare === "gata";
  if (pasNou === "livrata") return stare === "in_livrare";
  return true;
}

export function mesajPasLivrare(comanda, pasNou) {
  if (esteRidicare(comanda)) return "La ridicarea personală nu există livrator și nici pași de livrare.";
  const pas = pasLivrareComanda(comanda);
  if (pas === pasNou) return `Livrarea e deja „${ETICHETE_PAS_LIVRARE[pas] ?? pas}”.`;
  return `Livrarea nu poate trece din „${ETICHETE_PAS_LIVRARE[pas] ?? pas}” în „${ETICHETE_PAS_LIVRARE[pasNou] ?? pasNou}” cât comanda e „${etichetaPas(stareComanda(comanda))}”.`;
}

export function aplicaPasLivrare(comanda, pasNou, acum = new Date(), { livratorId } = {}) {
  if (!poateAvansaLivrarea(comanda, pasNou)) throw conflict(mesajPasLivrare(comanda, pasNou));
  if (pasNou === "preluata") return { ...aplicaTranzitie(comanda, "in_livrare", acum), livrareStare: "preluata" };
  if (pasNou === "livrata") return aplicaTranzitie(comanda, "livrata", acum);
  if (pasNou === "asignata") {
    if (!esteIdValid(livratorId)) throw conflict("Alege un livrator: asignarea are nevoie de livratorId.");
    return { livrareStare: "asignata", livratorId };
  }
  if (pasNou === "neasignata") return { livrareStare: "neasignata", livratorId: null };
  return { livrareStare: pasNou };
}

function acelasiId(a, b) {
  return esteIdValid(a) && esteIdValid(b) && String(a) === String(b);
}

// Cursele în lucru ale unui livrator: comenzi cu livrare, neîncheiate, asignate lui
export function curseInLucru(comenzi, livratorId) {
  return comenzi.filter((c) => !esteRidicare(c) && !esteFinala(c) && pasLivrareComanda(c) !== "neasignata" && acelasiId(livratorComanda(c), livratorId));
}

function numarLivrate(comenzi, livratorId) {
  return comenzi.filter((c) => stareComanda(c) === "livrata" && acelasiId(livratorComanda(c), livratorId)).length;
}

// Livratorul ales la alocarea automată: activ, online, fără cursă în lucru; dintre ei, cel cu cele mai puține
// livrări încheiate (împarte munca), apoi cel cu id-ul cel mai mic. null dacă nu e niciunul.
export function alegeLivrator(livratori, comenzi) {
  const disponibili = livratori.filter((l) => l.activ !== false && l.online === true && curseInLucru(comenzi, l.id).length < CURSE_ACTIVE_MAX);
  disponibili.sort((a, b) => numarLivrate(comenzi, a.id) - numarLivrate(comenzi, b.id) || String(a.id).localeCompare(String(b.id), "en", { numeric: true }));
  return disponibili[0] ?? null;
}

// Asignarea manuală (din /admin sau de livrator) cere un livrator existent și activ, ca lista din interfață
export function verificaLivratorAsignabil(livrator) {
  if (!livrator) throw conflict("Livratorul ales nu există.");
  if (livrator.activ === false) throw conflict(`${livrator.nume} e dezactivat și nu poate primi curse.`);
}
