// Regulile serverului pentru comenzi: câmpurile pe care clientul nu le decide.
// Un preparat din meniu („Pizza Diavola” sau „Pizza Diavola × 2”, ca în cos.js) primește prețul și categoria din meniu;
// orice altceva e o comandă specială: categoria vine din restaurant, iar prețul îl pune restaurantul la acceptare.
import { RESTAURANTE } from "../constants.js";

export function potrivireMeniu({ preparat, restaurant }, meniu) {
  const cuCantitate = /^(.*) × (\d+)$/.exec(preparat);
  const baza = cuCantitate ? cuCantitate[1] : preparat;
  const cantitate = cuCantitate ? Number(cuCantitate[2]) : 1;
  if (cantitate < 1) return null;
  const produs = meniu.find((p) => p.restaurant === restaurant && p.preparat === baza);
  return produs ? { produs, cantitate } : null;
}

// Câmpurile calculate de server; `pret` lipsește pentru o comandă specială (rămâne cel validat)
export function campuriCalculate(comanda, meniu) {
  const potrivire = potrivireMeniu(comanda, meniu);
  if (potrivire) return { categorie: potrivire.produs.categorie, pret: potrivire.produs.pret * potrivire.cantitate, speciala: false };
  return { categorie: RESTAURANTE.find((r) => r.nume === comanda.restaurant)?.categorie ?? null, speciala: true };
}

// Livratorul are o cursă în lucru (comandă cu el, încă nefinalizată)?
export function areCursaInLucru(comenzi, livratorId) {
  return comenzi.some((c) => String(c.livratorId) === String(livratorId) && c.livrata !== true && !["livrata", "anulata", "respinsa"].includes(c.stare));
}
