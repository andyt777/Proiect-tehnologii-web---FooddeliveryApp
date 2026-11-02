// Căutarea din antet: funcții pure (fără React), ca să poată fi testate cu `node --test`.
// Același text filtrează și meniul, și lista de comenzi.

// Aduce un text la forma de comparat: litere mici, fără diacritice, fără spații în plus
export function normalizeaza(text) { // primește orice valoare (de obicei un text)
  return String(text ?? "") // null / undefined devin text gol
    .normalize("NFD") // „ș” devine „s” + virgula de dedesubt ca semn separat (la fel ă, â, î, ț)
    .replace(/[̀-ͯ]/g, "") // ștergem semnele separate (blocul Unicode al semnelor diacritice), deci rămân literele de bază
    .toLowerCase() // „Pizza” și „pizza” devin la fel
    .replace(/\s+/g, " ") // mai multe spații la rând devin unul singur
    .trim(); // fără spații la început și la sfârșit
} // sfârșitul funcției

// true dacă preparatul sau restaurantul conțin textul căutat; o căutare goală potrivește orice
export function potrivesteCautarea(item, cautare) { // item = preparat din meniu sau comandă (ambele au preparat și restaurant)
  const cerut = normalizeaza(cautare); // textul căutat, normalizat
  if (cerut === "") return true; // nu se caută nimic: arătăm tot
  return [item.preparat, item.restaurant].some((camp) => normalizeaza(camp).includes(cerut)); // ajunge să se potrivească un singur câmp
} // sfârșitul funcției
