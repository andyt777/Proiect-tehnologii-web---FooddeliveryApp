// Redesign „Pădure”: preparatele favorite, păstrate în localStorage ca listă de id-uri din meniu (ex. ["p2", "p7"]).
// Funcții pure (fără React sau localStorage), ca să poată fi testate cu `node --test`; fiecare întoarce o listă nouă.

export const FAVORITE_MAXIME = 100; // plafon: textul din localStorage nu e de încredere și poate fi oricât de lung

// Citește lista salvată. Textul vine din afara aplicației, deci îl verificăm: la orice problemă, listă goală;
// păstrăm doar id-urile text nevide, fiecare o singură dată, cel mult FAVORITE_MAXIME
export function citesteFavorite(text) { // primește textul brut (sau null)
  if (typeof text !== "string") return []; // null (nimic salvat) sau alt tip
  let date; // aici ajunge rezultatul parsării
  try { // JSON.parse aruncă eroare la text invalid
    date = JSON.parse(text); // textul transformat în valoare JavaScript
  } catch { // JSON invalid
    return []; // nicio favorită
  } // sfârșitul try/catch
  if (!Array.isArray(date)) return []; // trebuie să fie o listă
  const valide = []; // id-urile bune, în ordinea din listă
  for (const id of date) { // fiecare element o dată
    if (typeof id !== "string" || id === "" || valide.includes(id)) continue; // fără alte tipuri, texte goale sau dubluri
    valide.push(id); // id bun
    if (valide.length === FAVORITE_MAXIME) break; // am atins plafonul
  } // sfârșitul buclei
  return valide; // lista curățată
} // sfârșitul funcției

// true dacă preparatul e printre favorite
export function esteFavorit(favorite, id) { // primește lista și id-ul preparatului
  return favorite.includes(id); // comparație exactă
} // sfârșitul funcției

// Inima de pe card: scoate preparatul dacă era favorit, altfel îl adaugă la final
export function comutaFavorit(favorite, id) { // primește lista și id-ul preparatului
  if (typeof id !== "string" || id === "") return favorite; // id invalid: aceeași listă (React nu mai randează)
  if (favorite.includes(id)) return favorite.filter((f) => f !== id); // era favorit: listă nouă, fără el
  if (favorite.length >= FAVORITE_MAXIME) return favorite; // plafonul atins: nu mai adăugăm
  return [...favorite, id]; // listă nouă, cu id-ul la final
} // sfârșitul funcției

// Păstrează doar favoritele care există în meniul primit de la server; aceeași listă dacă nu dispare nimic
export function pastreazaFavoriteDinMeniu(favorite, meniu) { // primește lista și meniul
  const iduri = new Set(meniu.map((p) => p.id)); // id-urile valide, pentru verificare rapidă
  const ramase = favorite.filter((id) => iduri.has(id)); // listă nouă, doar cu preparatele cunoscute
  return ramase.length === favorite.length ? favorite : ramase; // aceeași referință când nu s-a scos nimic
} // sfârșitul funcției

// Preparatele favorite, cu datele din meniu, în ordinea în care au fost adăugate
export function preparateFavorite(favorite, meniu) { // primește lista de id-uri și meniul
  return favorite.flatMap((id) => { // 0 sau 1 rezultat pentru fiecare id
    const produs = meniu.find((p) => p.id === id); // preparatul din meniu
    return produs ? [produs] : []; // un id care nu mai e în meniu e sărit
  }); // sfârșitul flatMap
} // sfârșitul funcției
