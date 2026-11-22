// Pachetul B: logica paginii /livrator. Livratorii demo, cursele disponibile, cursa în lucru și pasul următor.
// Funcții pure, testate cu `node --test`. Pașii livrării se schimbă doar prin stari.js (poateAvansaLivrarea /
// aplicaPasLivrare); aici doar alegem ce arată pagina. Rolul e un comutator demo, deci regulile nu sunt securitate.
import { dePlata } from "./cupoane.js";
import { minuteIntre, momenteStari } from "./metrici.js";
import { esteFinala, esteRidicare, normalizeazaComanda, poateAvansaLivrarea } from "./stari.js";

// O cursă se poate lua cât restaurantul o prepară sau după ce e gata (nu înainte să înceapă prepararea)
export const STARI_CURSA_DISPONIBILA = Object.freeze(["in_preparare", "gata"]);

// Un livrator duce o singură cursă o dată (un singur traseu simulat pe ecran)
export const CURSE_ACTIVE_MAX = 1;

// Confirmarea afișată după un pas (nu textul butonului)
export const CONFIRMARI_ACTIUNE = Object.freeze({
  spre_restaurant: "Ai pornit spre restaurant",
  preluata: "Ai preluat comanda",
  spre_client: "Ai pornit spre client",
  livrata: "Ai predat comanda",
});

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
    .map((l) => ({ id: l.id, nume: l.nume, online: l.online === true, activ: l.activ !== false }));
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
  if (livrator.activ === false) return "Contul e dezactivat de admin: nu poți intra online și nu poți accepta curse.";
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

// Mesajul de confirmare după un pas: „Ai pornit spre restaurant: „Pizza”.”
export function mesajPas(pas, preparat) {
  const text = CONFIRMARI_ACTIUNE[pas] ?? "Pasul a fost salvat";
  return `${text}: „${preparat}”.`;
}

// --- cursele refuzate (localStorage, cheia „curseRefuzate”): { "<livratorId>": [comandaId, ...] } ---

export const REFUZATE_MAX = 200;

function esteIdComanda(id) {
  return (Number.isInteger(id) && id > 0) || (typeof id === "string" && id.trim() !== "" && id.length <= 40);
}

// Citește textul salvat; la orice problemă, un obiect gol. Doar intrările cu forma cunoscută rămân.
export function citesteRefuzate(text) {
  if (typeof text !== "string") return {};
  let date;
  try {
    date = JSON.parse(text);
  } catch {
    return {};
  }
  if (date === null || typeof date !== "object" || Array.isArray(date)) return {};
  const curat = {};
  for (const [cheie, lista] of Object.entries(date)) {
    if (!esteId(cheie) || !Array.isArray(lista)) continue;
    const iduri = [...new Set(lista.filter(esteIdComanda).map(String))].slice(-REFUZATE_MAX);
    if (iduri.length > 0) curat[String(cheie)] = iduri;
  }
  return curat;
}

// Starea nouă, cu cursa refuzată de acest livrator (fără dubluri, cel mult REFUZATE_MAX per livrator)
export function adaugaRefuz(refuzate, livratorId, comandaId) {
  if (!esteId(livratorId) || !esteIdComanda(comandaId)) return refuzate;
  const cheie = String(livratorId);
  const lista = refuzate?.[cheie] ?? [];
  if (lista.includes(String(comandaId))) return refuzate;
  return { ...refuzate, [cheie]: [...lista, String(comandaId)].slice(-REFUZATE_MAX) };
}

// Cursele disponibile pe care acest livrator nu le-a refuzat
export function faraRefuzate(curse, refuzate, livratorId) {
  if (!Array.isArray(curse)) return [];
  const lista = esteId(livratorId) ? refuzate?.[String(livratorId)] ?? [] : [];
  return curse.filter((c) => !lista.includes(String(c?.id)));
}

// --- „În curând”: comenzi cu livrare, încă neîncepute, fără livrator (doar de văzut) ---

export function curseInCurand(comenzi) {
  if (!Array.isArray(comenzi)) return [];
  return comenzi.filter((bruta) => {
    const c = normalizeazaComanda(bruta);
    return !esteRidicare(c) && (c.stare === "plasata" || c.stare === "acceptata") && c.livrareStare === "neasignata" && c.livratorId === null;
  });
}

// --- istoricul și indicatorii unui livrator ---

// Comenzile predate de livrator, cele mai noi primele
export function istoricLivrator(comenzi, livratorId) {
  if (!Array.isArray(comenzi) || !esteId(livratorId)) return [];
  const moment = (c) => {
    const m = momenteStari(c);
    const ms = m.get("livrata") ?? m.get("plasata");
    return Number.isFinite(ms) ? ms : 0;
  };
  return comenzi
    .filter((bruta) => {
      const c = normalizeazaComanda(bruta);
      return c.stare === "livrata" && !esteRidicare(c) && acelasiId(c.livratorId, livratorId);
    })
    .sort((a, b) => moment(b) - moment(a));
}

// { numar, medieLivrareMin, valoare }: media vine din istoric („În livrare” -> „Livrată”); null fără date
export function indicatoriLivrator(comenzi, livratorId) {
  const livrate = istoricLivrator(comenzi, livratorId);
  const durate = [];
  let valoare = 0;
  for (const bruta of livrate) {
    valoare += dePlata(bruta);
    const m = momenteStari(bruta);
    const minute = minuteIntre(m.get("in_livrare"), m.get("livrata"));
    if (minute !== null) durate.push(minute);
  }
  const medie = durate.length === 0 ? null : Math.round((durate.reduce((s, v) => s + v, 0) / durate.length) * 10) / 10;
  return { numar: livrate.length, medieLivrareMin: medie, valoare };
}

// --- administrarea livratorilor (/admin) ---

export const NUME_LIVRATOR_MIN = 2;
export const NUME_LIVRATOR_MAX = 40;

// null sau mesajul de eroare
export function valideazaNumeLivrator(nume, livratori = [], idEditat = null) {
  const text = typeof nume === "string" ? nume.trim() : "";
  if (text === "") return "Scrie numele livratorului.";
  if (text.length < NUME_LIVRATOR_MIN || text.length > NUME_LIVRATOR_MAX) return `Numele are între ${NUME_LIVRATOR_MIN} și ${NUME_LIVRATOR_MAX} de caractere.`;
  const final = numeLivratorDemo(text).toLowerCase();
  if (Array.isArray(livratori) && livratori.some((l) => !acelasiId(l.id, idEditat) && l.nume.toLowerCase() === final)) return "Există deja un livrator cu acest nume.";
  return null;
}

// Livratorii sunt conturi demo: numele spune asta („Ana” -> „Ana (livrator demo)”)
export function numeLivratorDemo(nume) {
  const text = typeof nume === "string" ? nume.trim() : "";
  return /demo/i.test(text) ? text : `${text} (livrator demo)`;
}

// Un livrator se poate șterge doar dacă nu are o cursă în lucru
export function poateStergeLivrator(comenzi, livratorId) {
  return curseLivrator(comenzi, livratorId).length === 0;
}

// Doar livratorii activi pot primi curse (lista pentru asignarea manuală)
export function livratoriActivi(livratori) {
  return Array.isArray(livratori) ? livratori.filter((l) => l.activ !== false) : [];
}
