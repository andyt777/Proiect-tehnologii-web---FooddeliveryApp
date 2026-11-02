// Logica coșului: doar funcții pure (fără React, DOM sau localStorage), ca să poată fi testate cu `node --test`.
// Coșul e o listă de linii { produsId, cantitate }; fiecare funcție întoarce o listă nouă și nu o modifică pe cea primită.

export const CANTITATE_MAXIMA = 20; // limita pe linie: protejează de clicuri în exces și de date ciudate din localStorage

// Adaugă un produs: +1 dacă există deja în coș, altfel o linie nouă cu cantitatea 1
export function adaugaInCos(cos, produsId) { // primește coșul curent și id-ul produsului
  const exista = cos.some((linie) => linie.produsId === produsId); // căutăm produsul în coș
  if (exista) return schimbaCantitate(cos, produsId, 1); // îl avem deja: refolosim regula de +1 (cu plafon)
  return [...cos, { produsId, cantitate: 1 }]; // listă nouă, cu linia adăugată la final
} // sfârșitul funcției

// Schimbă cantitatea cu `delta` (+1 / -1); la 0 sau mai puțin, linia dispare; nu trece de CANTITATE_MAXIMA
export function schimbaCantitate(cos, produsId, delta) { // delta poate fi pozitiv sau negativ
  const linie = cos.find((l) => l.produsId === produsId); // linia de modificat
  if (!linie || !Number.isFinite(delta)) return cos; // nimic de schimbat: întoarcem aceeași listă (React nu mai randează degeaba)
  const noua = Math.min(linie.cantitate + delta, CANTITATE_MAXIMA); // cantitatea nouă, plafonată
  if (noua <= 0) return scoateDinCos(cos, produsId); // a ajuns la zero: scoatem linia
  if (noua === linie.cantitate) return cos; // eram deja la plafon: nicio schimbare
  return cos.map((l) => (l.produsId === produsId ? { ...l, cantitate: noua } : l)); // copie a liniei cu cantitatea nouă; restul rămân la fel
} // sfârșitul funcției

// Scoate complet un produs din coș
export function scoateDinCos(cos, produsId) { // primește coșul și id-ul de scos
  return cos.filter((l) => l.produsId !== produsId); // listă nouă, fără linia respectivă
} // sfârșitul funcției

// Unește coșul cu meniul: fiecare linie primește datele preparatului și subtotalul.
// Id-urile care nu mai există în meniu sunt sărite (nu putem afișa un preparat necunoscut).
export function liniiCos(cos, meniu) { // primește coșul și lista de preparate
  return cos.flatMap(({ produsId, cantitate }) => { // flatMap: 0 sau 1 rezultat pentru fiecare linie
    const produs = meniu.find((p) => p.id === produsId); // preparatul din meniu
    if (!produs) return []; // nu există: linia e sărită
    return [{ ...produs, cantitate, subtotal: produs.pret * cantitate }]; // datele preparatului + cantitatea + subtotalul
  }); // sfârșitul flatMap
} // sfârșitul funcției

// Câte produse sunt în coș (suma cantităților, nu numărul de linii)
export function numarProduse(cos) { // primește coșul
  return cos.reduce((suma, l) => suma + l.cantitate, 0); // adunăm cantitățile
} // sfârșitul funcției

// Totalul de plată, din liniile unite cu meniul (au deja `subtotal`)
export function totalCos(linii) { // primește rezultatul lui liniiCos
  return linii.reduce((suma, l) => suma + l.subtotal, 0); // adunăm subtotalurile
} // sfârșitul funcției

// Plasarea comenzii: o comandă nouă pentru fiecare linie din coș, adăugată la lista existentă.
// Id-ul urmează regula din README: cel mai mare id existent + 1 (pornim de la 1 dacă lista e goală).
export function cosInComenzi(linii, comenzi, livrare) { // primește liniile coșului, comenzile curente și tipul de livrare
  const maxId = comenzi.reduce((max, c) => Math.max(max, c.id), 0); // cel mai mare id existent (0 dacă nu există comenzi)
  const noi = linii.map((l, i) => ({ // o comandă nouă pentru fiecare linie
    id: maxId + 1 + i, // id-uri consecutive după cel mai mare
    preparat: l.cantitate > 1 ? `${l.preparat} × ${l.cantitate}` : l.preparat, // ex. „Pizza Diavola × 2”
    livrata: false, // abia plasată, deci pe drum
    livrare, // tipul de livrare ales în coș
    categorie: l.categorie, // categoria preparatului
    restaurant: l.restaurant, // restaurantul preparatului
    pret: l.subtotal, // prețul comenzii = prețul unitar × cantitatea
  })); // sfârșitul map-ului
  return [...comenzi, ...noi]; // listă nouă: comenzile vechi, apoi cele noi
} // sfârșitul funcției

// Citește coșul salvat în localStorage. Textul vine din afara aplicației (poate fi modificat de oricine),
// deci îl verificăm: la orice problemă întoarcem un coș gol, iar liniile invalide sunt aruncate.
export function citesteCos(text, meniu) { // primește textul brut (sau null) și meniul
  if (typeof text !== "string") return []; // null (nimic salvat) sau alt tip
  let date; // aici va ajunge rezultatul parsării
  try { // JSON.parse aruncă eroare la text invalid
    date = JSON.parse(text); // transformăm textul în valoare JavaScript
  } catch { // JSON invalid
    return []; // coș gol
  } // sfârșitul try/catch
  if (!Array.isArray(date)) return []; // trebuie să fie o listă
  const iduriMeniu = new Set(meniu.map((p) => p.id)); // id-urile valide, pentru verificare rapidă
  return date.reduce((valide, linie) => { // construim o listă nouă doar cu liniile bune
    const ok = // o linie e bună doar dacă trece toate verificările
      linie !== null && typeof linie === "object" && // trebuie să fie un obiect
      typeof linie.produsId === "string" && iduriMeniu.has(linie.produsId) && // produsul există în meniu
      Number.isInteger(linie.cantitate) && linie.cantitate >= 1 && linie.cantitate <= CANTITATE_MAXIMA && // cantitate întreagă, în limite
      !valide.some((v) => v.produsId === linie.produsId); // fără dubluri: păstrăm prima apariție
    return ok ? [...valide, { produsId: linie.produsId, cantitate: linie.cantitate }] : valide; // copiem doar câmpurile cunoscute
  }, []); // pornim de la o listă goală
} // sfârșitul funcției
