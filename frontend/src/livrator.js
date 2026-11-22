// Pachetul B: logica paginii /livrator. Livratorii demo, cursele disponibile, cursa în lucru și pasul următor.
// Funcții pure, testate cu `node --test`. Pașii livrării se schimbă doar prin stari.js (poateAvansaLivrarea /
// aplicaPasLivrare); aici doar alegem ce arată pagina. Rolul e un comutator demo, deci regulile nu sunt securitate.
import { momenteStari } from "./metrici.js";
import { esteFinala, esteRidicare, normalizeazaComanda, poateAvansaLivrarea } from "./stari.js";

// O cursă se poate lua cât restaurantul o prepară sau după ce e gata (nu înainte să înceapă prepararea)
export const STARI_CURSA_DISPONIBILA = Object.freeze(["in_preparare", "gata"]);

// Un livrator duce o singură cursă o dată (un singur traseu simulat pe ecran)
export const CURSE_ACTIVE_MAX = 1;

// Pasul următor al livratorului, pornind din pasul curent
const PAS_URMATOR = Object.freeze({ asignata: "spre_restaurant", spre_restaurant: "preluata", preluata: "spre_client", spre_client: "livrata" });

export const ETICHETE_ACTIUNE = Object.freeze({
  spre_restaurant: "Pornește spre restaurant",
  preluata: "Am preluat comanda",
  spre_client: "Pornește spre client",
  livrata: "Am predat comanda",
});

function esteId(id) {
  return (Number.isInteger(id) && id > 0) || (typeof id === "string" && id.trim() !== "");
}

// Id-urile vin ca număr de la server și ca text din <select>; le comparăm ca text
export function acelasiId(a, b) {
  return esteId(a) && esteId(b) && String(a) === String(b);
}

// Lista de la GET /livratori, curățată: doar intrările cu forma cunoscută
export function curataLivratori(lista) {
  if (!Array.isArray(lista)) return [];
  return lista
    .filter((l) => l !== null && typeof l === "object" && esteId(l.id) && typeof l.nume === "string" && l.nume.trim() !== "")
    .map((l) => ({ id: l.id, nume: l.nume, online: l.online === true }));
}

function momentPlasare(comanda) {
  const ms = momenteStari(comanda).get("plasata");
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

// Cursele pe care le poate lua un livrator: cu livrare (nu ridicare), fără livrator, în preparare sau gata.
// Cele gata primele, apoi cele mai vechi. Întoarce obiectele primite, nu cele normalizate.
export function curseDisponibile(comenzi) {
  if (!Array.isArray(comenzi)) return [];
  return comenzi
    .filter((bruta) => {
      const c = normalizeazaComanda(bruta);
      return !esteRidicare(c) && c.livrareStare === "neasignata" && STARI_CURSA_DISPONIBILA.includes(c.stare) && poateAvansaLivrarea(c, "asignata");
    })
    .sort((a, b) => {
      const gataA = normalizeazaComanda(a).stare === "gata" ? 0 : 1;
      const gataB = normalizeazaComanda(b).stare === "gata" ? 0 : 1;
      return gataA - gataB || momentPlasare(a) - momentPlasare(b);
    });
}

// Cursele în lucru ale unui livrator: asignate lui, încă neîncheiate
export function curseLivrator(comenzi, livratorId) {
  if (!Array.isArray(comenzi) || !esteId(livratorId)) return [];
  return comenzi.filter((bruta) => {
    const c = normalizeazaComanda(bruta);
    return !esteRidicare(c) && !esteFinala(c) && c.livrareStare !== "neasignata" && acelasiId(c.livratorId, livratorId);
  });
}

// Câte comenzi a predat livratorul (din datele serverului, nu inventate)
export function numarLivrate(comenzi, livratorId) {
  if (!Array.isArray(comenzi) || !esteId(livratorId)) return 0;
  return comenzi.filter((bruta) => {
    const c = normalizeazaComanda(bruta);
    return c.stare === "livrata" && acelasiId(c.livratorId, livratorId);
  }).length;
}

// De ce livratorul nu poate accepta o cursă acum; null dacă poate
export function motivFaraAcceptare(livrator, curseActive) {
  if (!livrator) return "Alege un livrator demo.";
  if (livrator.online !== true) return "Intră online ca să poți accepta curse.";
  if (curseActive >= CURSE_ACTIVE_MAX) return "Termină cursa în lucru înainte să accepți alta.";
  return null;
}

// Butonul principal al unei curse în lucru: { pas, text, permis, motiv }, sau null dacă nu mai urmează nimic
export function actiuneUrmatoare(comanda) {
  const c = normalizeazaComanda(comanda);
  const pas = PAS_URMATOR[c.livrareStare];
  if (!pas) return null;
  const permis = poateAvansaLivrarea(c, pas);
  let motiv = null;
  if (!permis) {
    motiv = pas === "preluata" && c.stare !== "gata"
      ? "Comanda nu e gata încă. O poți prelua după ce restaurantul o marchează gata."
      : "Pasul nu mai e posibil. Lista se actualizează în câteva secunde.";
  }
  return { pas, text: ETICHETE_ACTIUNE[pas], permis, motiv };
}

// Livratorul poate renunța doar înainte să plece spre restaurant
export function poateRenunta(comanda) {
  return poateAvansaLivrarea(comanda, "neasignata");
}

// Numele unui livrator după id (pentru /admin); null dacă nu e în listă
export function numeLivrator(livratori, id) {
  if (!Array.isArray(livratori)) return null;
  return livratori.find((l) => acelasiId(l.id, id))?.nume ?? null;
}
