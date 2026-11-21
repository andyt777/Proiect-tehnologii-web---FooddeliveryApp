// Notificările din aplicație: ce comenzi și-au schimbat starea între două citiri ale listei /comenzi.
// Funcții pure (fără React sau fetch), testate cu `node --test`; hook-ul care citește periodic e în urmarireComenzi.js.
import { STARI_FINALE, etichetaStare, stareComanda } from "./stari.js"; // starea derivată și textul ei

export const NOTIFICARI_MAXIME = 3; // câte mesaje stau pe ecran deodată

// „Fotografia” listei: id -> starea derivată (comenzile fără id sunt sărite)
export function hartaStari(comenzi) { // primește lista de la server
  const harta = new Map(); // Map: id-urile pot fi numere sau text
  if (!Array.isArray(comenzi)) return harta; // un răspuns ciudat dă o hartă goală
  for (const c of comenzi) { // fiecare comandă o dată
    if (c && (typeof c.id === "number" || typeof c.id === "string")) harta.set(c.id, stareComanda(c)); // doar comenzile cu id
  } // sfârșitul buclei
  return harta; // harta nouă
} // sfârșitul funcției

// true dacă harta are măcar o comandă în curs (atunci merită să întrebăm serverul)
export function areComenziActive(harta) { // primește rezultatul lui hartaStari
  for (const stare of harta.values()) if (!STARI_FINALE.includes(stare)) return true; // prima activă ajunge
  return false; // toate sunt încheiate (sau lista e goală)
} // sfârșitul funcției

// Comenzile care existau și înainte și au acum altă stare; cele noi sau șterse nu sunt schimbări
export function schimbariStare(inainte, comenzi) { // primește harta veche și lista nouă
  if (!Array.isArray(comenzi)) return []; // nimic de comparat
  return comenzi.flatMap((c) => { // 0 sau 1 schimbare pentru fiecare comandă
    if (!c || !inainte.has(c.id)) return []; // comandă nouă (sau fără id): nu o anunțăm
    const deLa = inainte.get(c.id); // starea veche
    const la = stareComanda(c); // starea nouă
    return deLa === la ? [] : [{ id: c.id, preparat: c.preparat, deLa, la, comanda: c }]; // doar schimbările
  }); // sfârșitul flatMap
} // sfârșitul funcției

// Textul mesajului, ex. „Pizza Margherita: În preparare”
export function mesajNotificare(schimbare) { // primește un element din schimbariStare
  const nume = typeof schimbare.preparat === "string" && schimbare.preparat !== "" ? schimbare.preparat : `Comanda ${schimbare.id}`; // numele preparatului (sau numărul comenzii)
  return `${nume}: ${etichetaStare(schimbare.comanda)}`; // starea nouă, cu textul potrivit (ex. „Gata de ridicare”)
} // sfârșitul funcției

// Lista de pe ecran după un lot nou: cele vechi, apoi cele noi, cel mult NOTIFICARI_MAXIME (cele mai noi rămân)
export function adaugaNotificari(lista, schimbari, momentul) { // momentul (număr) face cheile unice
  const noi = schimbari.map((s, i) => ({ cheie: `${s.id}-${s.la}-${momentul}-${i}`, id: s.id, text: mesajNotificare(s) })); // un mesaj pentru fiecare schimbare
  return [...lista, ...noi].slice(-NOTIFICARI_MAXIME); // listă nouă
} // sfârșitul funcției
