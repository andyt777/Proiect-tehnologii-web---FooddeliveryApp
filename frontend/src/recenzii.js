// Pachetul C: recenziile lăsate după livrare (resursa `recenzii` din db.json: { id, comandaId, restaurant, nota, text, creata }).
// O singură recenzie pentru fiecare comandă livrată; nota e de la 1 la 5, textul e opțional.
// Nu afișăm nicio notă care nu vine dintr-o recenzie reală: fără recenzii, pagina restaurantului nu arată nimic.
// Verificările rulează doar în browser (json-server acceptă orice POST), deci nu sunt securitate.
// Funcții pure (fără React sau fetch), testate cu `node --test`.
import { stareComanda } from "./stari.js"; // doar comenzile livrate pot primi recenzie

export const NOTA_MIN = 1; // cea mai mică notă
export const NOTA_MAX = 5; // cea mai mare notă
export const TEXT_RECENZIE_MAX = 500; // lungimea maximă a textului

// Textul fiecărei note, citit lângă stele
export const ETICHETE_NOTA = Object.freeze({ 1: "Slab", 2: "Acceptabil", 3: "Bun", 4: "Foarte bun", 5: "Excelent" }); // cheia = nota

function esteId(id) { // id de la json-server: număr întreg pozitiv sau text nevid
  return (Number.isInteger(id) && id > 0) || (typeof id === "string" && id.trim() !== ""); // ambele forme sunt acceptate
} // sfârșitul funcției

function esteNota(nota) { // un întreg între NOTA_MIN și NOTA_MAX
  return Number.isInteger(nota) && nota >= NOTA_MIN && nota <= NOTA_MAX; // cele trei condiții
} // sfârșitul funcției

// Verifică formularul: null dacă e bun, altfel { camp, mesaj } pentru primul câmp greșit
export function valideazaRecenzie({ nota, text }) { // primește nota (număr) și textul (opțional)
  if (!esteNota(nota)) return { camp: "nota", mesaj: `Alege o notă de la ${NOTA_MIN} la ${NOTA_MAX}.` }; // nota e obligatorie
  const curat = typeof text === "string" ? text.trim() : ""; // textul lipsă e gol
  if (curat.length > TEXT_RECENZIE_MAX) return { camp: "text", mesaj: `Recenzia are maximum ${TEXT_RECENZIE_MAX} de caractere.` }; // prea lung
  return null; // în regulă
} // sfârșitul funcției

// Recenzia de trimis prin POST (fără id: îl pune serverul); datele sunt deja validate
export function recenzieNoua({ comanda, nota, text }, acum = new Date()) { // primește comanda, nota, textul și momentul
  return { // obiect nou
    comandaId: comanda.id, // legătura cu comanda
    restaurant: comanda.restaurant, // pentru pagina restaurantului
    nota, // 1–5
    text: typeof text === "string" ? text.trim() : "", // textul, fără spațiile de la margini
    creata: acum.toISOString(), // momentul trimiterii
  }; // sfârșitul obiectului
} // sfârșitul funcției

// Lista de la server, curățată: doar recenziile cu forma cunoscută (datele nu sunt de încredere)
export function curataRecenzii(lista) { // primește răspunsul GET /recenzii
  if (!Array.isArray(lista)) return []; // răspuns ciudat
  return lista.filter((r) => r !== null && typeof r === "object" && esteId(r.id) && esteId(r.comandaId) && typeof r.restaurant === "string" && r.restaurant !== "" && esteNota(r.nota)) // forma minimă
    .map((r) => ({ // copii, doar cu câmpurile cunoscute
      id: r.id, // id-ul de la server
      comandaId: r.comandaId, // comanda recenzată
      restaurant: r.restaurant, // restaurantul
      nota: r.nota, // nota
      text: typeof r.text === "string" ? r.text.slice(0, TEXT_RECENZIE_MAX) : "", // textul, cel mult lungimea maximă
      creata: typeof r.creata === "string" && !Number.isNaN(Date.parse(r.creata)) ? r.creata : null, // data, dacă e validă
    })); // sfârșitul map-ului
} // sfârșitul funcției

// Recenzia unei comenzi (id-ul poate fi număr sau text); null dacă nu există
export function recenziaComenzii(recenzii, comandaId) { // primește lista curățată și id-ul comenzii
  return recenzii.find((r) => String(r.comandaId) === String(comandaId)) ?? null; // comparăm ca text: adresa dă text, serverul număr
} // sfârșitul funcției

// true dacă se poate lăsa o recenzie: comanda e livrată și nu are încă una
export function poateLasaRecenzie(comanda, recenzii) { // primește comanda și lista curățată
  return stareComanda(comanda) === "livrata" && recenziaComenzii(recenzii, comanda?.id) === null; // ambele condiții
} // sfârșitul funcției

// Recenziile unui restaurant, cele mai noi primele (cele fără dată la final)
export function recenziiRestaurant(recenzii, nume) { // primește lista curățată și numele exact
  return recenzii.filter((r) => r.restaurant === nume).sort((a, b) => (Date.parse(b.creata ?? "") || 0) - (Date.parse(a.creata ?? "") || 0)); // NaN devine 0
} // sfârșitul funcției

// Media notelor, cu o zecimală, și numărul lor; null pentru o listă goală (nu inventăm o notă)
export function medieRecenzii(recenzii) { // primește recenziile unui restaurant
  if (!Array.isArray(recenzii) || recenzii.length === 0) return null; // fără recenzii, fără medie
  const suma = recenzii.reduce((s, r) => s + r.nota, 0); // suma notelor
  return { medie: Math.round((suma / recenzii.length) * 10) / 10, numar: recenzii.length }; // o zecimală
} // sfârșitul funcției

// Nota cu virgulă românească, mereu cu o zecimală: 4.5 -> „4,5”, 4 -> „4,0”
export function formatNota(nota) { // primește media
  return nota.toLocaleString("ro-RO", { minimumFractionDigits: 1, maximumFractionDigits: 1 }); // regulile românești
} // sfârșitul funcției

// „1 recenzie”, „3 recenzii”, „20 de recenzii”
export function formatRecenzii(numar) { // primește numărul
  if (numar === 1) return "1 recenzie"; // singularul
  const rest = numar % 100; // regula lui „de” depinde de ultimele două cifre
  return `${numar} ${numar !== 0 && (rest === 0 || rest >= 20) ? "de " : ""}recenzii`; // aceeași regulă ca în format.js
} // sfârșitul funcției
