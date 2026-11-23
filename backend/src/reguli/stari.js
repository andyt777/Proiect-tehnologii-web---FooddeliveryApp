// Modulul Order Management: ciclul de viață al comenzii (câmpul `stare`) și istoricul ei.
// Copie a regulilor din frontend/src/stari.js (aceleași stări, aceleași tranziții, aceleași efecte), fiindcă backend-ul
// nu importă din frontend. Testul frontend/tests/backendReguli.test.js compară cele două copii pe toate combinațiile.
// Serverul nu are încă utilizatori (vin într-o etapă viitoare), deci nu știe rolul: acceptă o tranziție dacă
// tabelul o permite pentru cel puțin un rol. Rolurile rămân în tabel ca documentație și pentru test.
import { ISTORIC_MAXIM, MOTIV_MAX, PASI_LIVRARE, PRET_MAXIM, STARI_COMANDA, TIMP_PREPARARE_MAX, TIMP_PREPARARE_MIN } from "../constants.js";
import { conflict } from "../erori.js";
import { plataComanda, plataDupa, plataLaDebifare } from "./plata.js";

export const STARI_FINALE = Object.freeze(["livrata", "anulata", "respinsa"]);
export const ROLURI = Object.freeze(["client", "restaurant", "livrator", "admin"]);

export const ETICHETE_STARE = Object.freeze({
  plasata: "Plasată",
  acceptata: "Acceptată",
  in_preparare: "În preparare",
  gata: "Gata",
  in_livrare: "În livrare",
  livrata: "Livrată",
  anulata: "Anulată",
  respinsa: "Respinsă",
});

// Din starea curentă -> starea nouă -> rolurile care o pot face (ca în stari.js)
export const TRANZITII = new Map([
  ["plasata", new Map([["acceptata", ["restaurant", "admin"]], ["respinsa", ["restaurant", "admin"]], ["anulata", ["client", "admin"]]])],
  ["acceptata", new Map([["in_preparare", ["restaurant", "admin"]], ["anulata", ["client", "admin"]]])],
  ["in_preparare", new Map([["gata", ["restaurant", "admin"]], ["anulata", ["admin"]]])],
  ["gata", new Map([["in_livrare", ["livrator", "admin"]], ["livrata", ["restaurant", "admin"]], ["anulata", ["admin"]]])],
  ["in_livrare", new Map([["livrata", ["livrator", "admin"]], ["anulata", ["admin"]]])],
  ["livrata", new Map()],
  ["anulata", new Map()],
  ["respinsa", new Map()],
]);

function esteObiect(valoare) {
  return valoare !== null && typeof valoare === "object" && !Array.isArray(valoare);
}

function esteDataValida(text) {
  return typeof text === "string" && text !== "" && !Number.isNaN(Date.parse(text));
}

export function esteIdValid(id) {
  return (Number.isInteger(id) && id > 0) || (typeof id === "string" && id.trim() !== "");
}

export function arePretValid(pret) {
  return Number.isInteger(pret) && pret > 0 && pret <= PRET_MAXIM;
}

export function curataMotiv(motiv) {
  if (typeof motiv !== "string") return null;
  const text = motiv.trim();
  return text !== "" && text.length <= MOTIV_MAX ? text : null;
}

export function esteTimpPreparareValid(minute) {
  return Number.isInteger(minute) && minute >= TIMP_PREPARARE_MIN && minute <= TIMP_PREPARARE_MAX;
}

export function etichetaPas(stare, ridicare = false) {
  if (ridicare && stare === "gata") return "Gata de ridicare";
  if (ridicare && stare === "livrata") return "Ridicată";
  return ETICHETE_STARE[stare] ?? stare;
}

// --- citirea unei comenzi (cu valorile implicite pentru comenzile vechi din seed) ---

export function esteRidicare(comanda) {
  return comanda?.livrare === "ridicare";
}

export function istoricComanda(comanda) {
  const istoric = comanda?.istoric;
  if (!Array.isArray(istoric)) return [];
  return istoric.slice(-ISTORIC_MAXIM).filter((e) => esteObiect(e) && STARI_COMANDA.includes(e.stare) && esteDataValida(e.la)).map((e) => ({ stare: e.stare, la: e.la }));
}

// Starea de dinaintea ultimei livrări (pentru debifarea lui „Livrată”); „plasata” dacă istoricul nu spune
export function stareInainteDeLivrare(istoric) {
  const ultimaLivrare = istoric.map((e) => e.stare).lastIndexOf("livrata");
  const inainte = ultimaLivrare === -1 ? istoric : istoric.slice(0, ultimaLivrare);
  for (let i = inainte.length - 1; i >= 0; i -= 1) {
    if (inainte[i].stare !== "livrata") return inainte[i].stare;
  }
  return "plasata";
}

// `livrata` (câmpul din tw.json) are ultimul cuvânt, ca în frontend
export function stareComanda(comanda) {
  if (comanda?.livrata === true) return "livrata";
  const stare = STARI_COMANDA.includes(comanda?.stare) ? comanda.stare : null;
  if (stare === null) return "plasata";
  if (stare === "livrata") return stareInainteDeLivrare(istoricComanda(comanda));
  return stare;
}

export function pasLivrareComanda(comanda) {
  if (esteRidicare(comanda)) return null;
  if (stareComanda(comanda) === "livrata") return "livrata";
  const pas = PASI_LIVRARE.includes(comanda?.livrareStare) ? comanda.livrareStare : "neasignata";
  return pas === "livrata" ? "spre_client" : pas;
}

export function livratorComanda(comanda) {
  return esteIdValid(comanda?.livratorId) ? comanda.livratorId : null;
}

export function esteFinala(comanda) {
  return STARI_FINALE.includes(stareComanda(comanda));
}

// --- tranziții ---

export function existaTranzitie(din, spre) {
  return TRANZITII.get(din)?.has(spre) ?? false;
}

function conditiiIndeplinite(comanda, din, spre) {
  if (din === "gata" && spre === "in_livrare") return !esteRidicare(comanda);
  if (din === "gata" && spre === "livrata") return esteRidicare(comanda);
  return true;
}

// Fără `rol`: serverul acceptă trecerea dacă o poate face măcar un rol
export function poateTrece(comanda, stareNoua, rol) {
  if (rol !== undefined && !ROLURI.includes(rol)) return false;
  const din = stareComanda(comanda);
  const roluri = TRANZITII.get(din)?.get(stareNoua);
  if (!roluri || (rol !== undefined && !roluri.includes(rol))) return false;
  return conditiiIndeplinite(comanda, din, stareNoua);
}

export function mesajTranzitie(comanda, stareNoua) {
  const ridicare = esteRidicare(comanda);
  return `Comanda nu poate trece din „${etichetaPas(stareComanda(comanda), ridicare)}” în „${etichetaPas(stareNoua, ridicare)}”.`;
}

// Câmpurile schimbate de o tranziție: stare, livrata, plata, istoric (+ livrareStare, motiv, timpPreparare, pret)
export function aplicaTranzitie(comanda, stareNoua, acum = new Date(), detalii = {}) {
  const din = stareComanda(comanda);
  if (!existaTranzitie(din, stareNoua) || !conditiiIndeplinite(comanda, din, stareNoua)) throw conflict(mesajTranzitie(comanda, stareNoua));
  const patch = {
    stare: stareNoua,
    livrata: stareNoua === "livrata",
    plata: plataDupa(plataComanda(comanda), stareNoua),
    istoric: [...istoricComanda(comanda), { stare: stareNoua, la: acum.toISOString() }],
  };
  if (!esteRidicare(comanda)) {
    const pas = pasLivrareComanda(comanda);
    if (stareNoua === "livrata") patch.livrareStare = "livrata";
    else if (stareNoua === "in_livrare" && PASI_LIVRARE.indexOf(pas) < PASI_LIVRARE.indexOf("preluata")) patch.livrareStare = "preluata";
  }
  if (stareNoua === "anulata" || stareNoua === "respinsa") {
    const motiv = curataMotiv(detalii.motiv);
    if (motiv) patch.motiv = motiv;
  }
  if (stareNoua === "acceptata") {
    if (esteTimpPreparareValid(detalii.timpPreparare)) patch.timpPreparare = detalii.timpPreparare;
    if (!arePretValid(comanda?.pret) && arePretValid(detalii.pret)) patch.pret = detalii.pret;
  }
  return patch;
}

// Bifa „Livrată” de pe „/” (cerința cursului): scurtătură manuală în afara tabelului, ca în frontend.
// Nelivrată -> „livrata”; livrată -> starea de dinainte din istoric.
export function comutaLivrata(comanda, acum = new Date()) {
  const istoric = istoricComanda(comanda);
  const plata = plataComanda(comanda);
  const ridicare = esteRidicare(comanda);
  const la = acum.toISOString();
  if (stareComanda(comanda) !== "livrata") {
    const patch = { stare: "livrata", livrata: true, plata: plataDupa(plata, "livrata"), istoric: [...istoric, { stare: "livrata", la }] };
    if (!ridicare) patch.livrareStare = "livrata";
    return patch;
  }
  const inapoi = stareInainteDeLivrare(istoric);
  const patch = { stare: inapoi, livrata: false, plata: plataLaDebifare(plata), istoric: [...istoric, { stare: inapoi, la }] };
  if (!ridicare) patch.livrareStare = inapoi === "in_livrare" ? "spre_client" : esteIdValid(comanda?.livratorId) ? "asignata" : "neasignata";
  return patch;
}
