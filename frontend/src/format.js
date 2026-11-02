// Sume în lei, cu separatorul de mii românesc (1.250 lei)
export function formatLei(suma) { // primește un număr și întoarce un text
  return `${suma.toLocaleString("ro-RO")} lei`; // toLocaleString aplică regulile românești (punct pentru mii)
} // sfârșitul funcției

// Regula lui „de” în română: apare de la 20 în sus (20 de comenzi), dar nu la 101–119 (101 comenzi)
function prepozitiaDe(numar) { // funcție internă, folosită de formatComenzi și formatProduse
  const ultimeleDoua = numar % 100; // regula depinde de ultimele două cifre (101 comenzi, dar 120 de comenzi)
  return numar !== 0 && (ultimeleDoua === 0 || ultimeleDoua >= 20) ? "de " : ""; // „de ” doar unde gramatica o cere
} // sfârșitul funcției

// Acordul în română: 1 comandă, 2 comenzi, 20 de comenzi
export function formatComenzi(numar) { // primește numărul de comenzi
  if (numar === 1) return "1 comandă"; // singularul e un caz special
  return `${numar} ${prepozitiaDe(numar)}comenzi`; // ex. „3 comenzi”, „25 de comenzi”
} // sfârșitul funcției

// La fel pentru produsele din coș: 1 produs, 2 produse, 20 de produse
export function formatProduse(numar) { // primește numărul de produse
  if (numar === 1) return "1 produs"; // singularul
  return `${numar} ${prepozitiaDe(numar)}produse`; // ex. „3 produse”, „20 de produse”
} // sfârșitul funcției
