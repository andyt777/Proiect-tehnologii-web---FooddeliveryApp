// Sume în lei, cu separatorul de mii românesc (1.250 lei)
export function formatLei(suma) { // primește un număr și întoarce un text
  return `${suma.toLocaleString("ro-RO")} lei`; // toLocaleString aplică regulile românești (punct pentru mii)
} // sfârșitul funcției

// Regula lui „de” în română: apare de la 20 în sus (20 de comenzi), dar nu la 101–119 (101 comenzi)
function prepozitiaDe(numar) { // funcție internă, folosită de formatComenzi și formatProduse
  const ultimeleDoua = numar % 100; // regula depinde de ultimele două cifre (101 comenzi, dar 120 de comenzi)
  return numar !== 0 && (ultimeleDoua === 0 || ultimeleDoua >= 20) ? "de " : ""; // „de ” doar unde gramatica o cere
} // sfârșitul funcției

// O sumă în lei într-o propoziție, cu regula lui „de”: „1 leu”, „19 lei”, „52 de lei”, „100 de lei”, „101 lei”
export function formatLeiDe(suma) {
  if (suma === 1) return "1 leu";
  const text = formatLei(suma);
  return Number.isInteger(suma) && prepozitiaDe(Math.abs(suma)) !== "" ? text.replace(/ lei$/, " de lei") : text;
}

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

// Etapa 8: data plasării unei comenzi (câmpul opțional `creata`, text ISO), în format românesc: „16 noiembrie 2026 la 12:00”.
// null dacă lipsește sau nu e o dată validă, ca pagina să nu afișeze „Invalid Date”.
export function formatData(iso) { // primește textul ISO salvat de formular sau de coș
  if (typeof iso !== "string" || iso === "") return null; // lipsă (comenzile din db.json nu au `creata`)
  const data = new Date(iso); // textul ISO transformat în dată
  if (Number.isNaN(data.getTime())) return null; // text care nu e o dată
  return data.toLocaleString("ro-RO", { dateStyle: "long", timeStyle: "short" }); // regulile românești, în fusul orar al browserului
} // sfârșitul funcției

// Fluxul complet: doar ora unui moment din istoric („18:30”); null pentru un text care nu e o dată
export function formatOra(iso) { // primește textul ISO
  if (typeof iso !== "string" || iso === "") return null; // lipsă
  const data = new Date(iso); // textul transformat în dată
  if (Number.isNaN(data.getTime())) return null; // text care nu e o dată
  return data.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" }); // ora românească, în fusul orar al browserului
} // sfârșitul funcției
