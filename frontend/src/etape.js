// Redesign „Pădure”: pașii unei comenzi pe pagina de detaliu (plasată -> pe drum -> livrată).
// Derivați doar din câmpul `livrata`: datele nu au alte stări, deci nu inventăm ore sau etape în plus.
// Funcție pură (fără React), ca să poată fi testată cu `node --test`.

// stare: „gata” (pas încheiat), „acum” (pasul în curs) sau „urmeaza”; curenta = pasul la care e comanda acum
export function etapeComanda(livrata) { // primește valoarea câmpului `livrata`
  const gata = livrata === true; // doar true înseamnă livrată (un text sau un număr nu)
  return [ // obiecte noi la fiecare apel
    { id: "plasata", text: "Plasată", stare: "gata", curenta: false }, // orice comandă din listă a fost plasată
    { id: "pe-drum", text: "Pe drum", stare: gata ? "gata" : "acum", curenta: !gata }, // în curs până la livrare
    { id: "livrata", text: "Livrată", stare: gata ? "gata" : "urmeaza", curenta: gata }, // ultimul pas
  ]; // sfârșitul listei
} // sfârșitul funcției
