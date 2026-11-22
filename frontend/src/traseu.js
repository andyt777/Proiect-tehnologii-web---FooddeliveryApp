// Pachetul B: traseul simulat de pe /livrator, desenat ca SVG în pagină (fără hartă reală, fără GPS, fără bibliotecă).
// Trei puncte fixe pe un plan abstract: unde pornește livratorul, restaurantul și clientul. Poziția livratorului
// depinde de pasul livrării și, pe drum, de un progres (0..1) care crește la fiecare secundă cât e pornit cronometrul.
// Funcții pure, testate cu `node --test`.

export const LATIME_TRASEU = 340; // lățimea planului (unități SVG)
export const INALTIME_TRASEU = 180; // înălțimea planului

// Punctele de pe plan (unități SVG); nu sunt coordonate reale
export const PUNCTE_TRASEU = Object.freeze({ // înghețat: aceleași pentru toată lumea
  start: Object.freeze({ x: 40, y: 140 }), // unde e livratorul când acceptă cursa
  restaurant: Object.freeze({ x: 150, y: 50 }), // restaurantul
  client: Object.freeze({ x: 300, y: 130 }), // clientul
}); // sfârșitul obiectului

export const DURATA_ETAPA_S = 20; // câte secunde ține simularea unui drum (spre restaurant sau spre client)

// true pentru pașii în care livratorul se mișcă
export function etapaInMiscare(pas) { // primește pasul livrării
  return pas === "spre_restaurant" || pas === "spre_client"; // cele două drumuri
} // sfârșitul funcției

// Progresul după încă o bătaie a cronometrului, fără să treacă de 1
export function progresUrmator(progres, secunde = 1, durata = DURATA_ETAPA_S) { // primește progresul curent
  const curent = Number.isFinite(progres) ? Math.min(Math.max(progres, 0), 1) : 0; // valori ciudate -> 0
  return Math.min(1, curent + secunde / durata); // un pas mic înainte
} // sfârșitul funcției

function intre(a, b, p) { // punctul aflat la fracția p pe segmentul a -> b
  const rotunjeste = (v) => Math.round(v * 100) / 100; // două zecimale: fără zgomot de virgulă mobilă
  return { x: rotunjeste(a.x + (b.x - a.x) * p), y: rotunjeste(a.y + (b.y - a.y) * p) }; // interpolare liniară
} // sfârșitul funcției

// Poziția livratorului pe plan, pentru pasul livrării și progresul drumului curent
export function pozitieTraseu(pas, progres) { // primește pasul și progresul (0..1)
  const p = Number.isFinite(progres) ? Math.min(Math.max(progres, 0), 1) : 0; // progresul, între 0 și 1
  const { start, restaurant, client } = PUNCTE_TRASEU; // cele trei puncte
  if (pas === "spre_restaurant") return intre(start, restaurant, p); // pe primul drum
  if (pas === "preluata") return { ...restaurant }; // la restaurant, cu comanda în mână
  if (pas === "spre_client") return intre(restaurant, client, p); // pe al doilea drum
  if (pas === "livrata") return { ...client }; // la client
  return { ...start }; // asignată (sau alt pas): la punctul de plecare
} // sfârșitul funcției
