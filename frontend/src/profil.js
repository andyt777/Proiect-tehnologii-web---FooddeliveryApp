// Contul clientului (/cont): nume, telefon și adresele salvate, păstrate în localStorage (cheia „profil”).
// Nu e un cont real: fără parolă și fără server, datele stau doar în acest browser.
// Funcții pure (fără React sau localStorage), testate cu `node --test`; fiecare întoarce un profil nou.

export const NUME_MIN = 2; // numele are cel puțin 2 caractere
export const NUME_MAX = 60; // și cel mult 60
export const ADRESA_MIN = 5; // o adresă are cel puțin 5 caractere
export const ADRESA_MAX = 160; // și cel mult 160
export const ETICHETA_MAX = 30; // eticheta adresei („Acasă”, „Birou”), opțională
export const ADRESE_MAXIME = 10; // câte adrese se pot salva
const TELEFON_MAX = 20; // lungimea maximă a textului salvat pentru telefon

export const PROFIL_GOL = Object.freeze({ nume: "", telefon: "", adrese: Object.freeze([]), implicita: null }); // profilul de pornire

// Telefonul fără spații, puncte, cratime și paranteze: „0722 123 456” -> „0722123456”
export function curataTelefon(telefon) { // primește textul din câmp
  return typeof telefon === "string" ? telefon.replace(/[\s.()-]/g, "") : ""; // doar cifrele și „+”
} // sfârșitul funcției

// Numele: obligatoriu, între NUME_MIN și NUME_MAX caractere; null sau mesajul
export function valideazaNume(nume) { // primește textul
  const text = typeof nume === "string" ? nume.trim() : ""; // fără spațiile de la margini
  if (text === "") return "Scrie numele tău."; // obligatoriu
  if (text.length < NUME_MIN || text.length > NUME_MAX) return `Numele are între ${NUME_MIN} și ${NUME_MAX} de caractere.`; // lungimea
  return null; // în regulă
} // sfârșitul funcției

// Telefonul: număr românesc, 0 + 9 cifre sau +40 / 0040 + 9 cifre; null sau mesajul
export function valideazaTelefon(telefon) { // primește textul
  const curat = curataTelefon(telefon); // fără separatoare
  if (curat === "") return "Scrie un număr de telefon, ca restaurantul și livratorul să te poată suna."; // obligatoriu
  if (!/^(\+40|0040|0)\d{9}$/.test(curat)) return "Numărul de telefon nu e valid. Exemplu: 0722 123 456."; // forma
  return null; // în regulă
} // sfârșitul funcției

// Textul adresei: obligatoriu, între ADRESA_MIN și ADRESA_MAX caractere; null sau mesajul
export function valideazaTextAdresa(text) { // primește textul
  const curat = typeof text === "string" ? text.trim() : ""; // fără spațiile de la margini
  if (curat === "") return "Scrie adresa de livrare."; // obligatoriu
  if (curat.length < ADRESA_MIN) return "Adresa e prea scurtă. Scrie strada, numărul și orașul."; // prea scurtă
  if (curat.length > ADRESA_MAX) return `Adresa are maximum ${ADRESA_MAX} de caractere.`; // prea lungă
  return null; // în regulă
} // sfârșitul funcției

// O adresă din formularul contului: { camp, mesaj } pentru primul câmp greșit sau null
export function valideazaAdresa({ eticheta, text }) { // primește valorile din formular
  const e = typeof eticheta === "string" ? eticheta.trim() : ""; // eticheta e opțională
  if (e.length > ETICHETA_MAX) return { camp: "eticheta", mesaj: `Eticheta are maximum ${ETICHETA_MAX} de caractere.` }; // prea lungă
  const mesaj = valideazaTextAdresa(text); // textul adresei
  return mesaj ? { camp: "text", mesaj } : null; // primul câmp greșit sau nimic
} // sfârșitul funcției

// Datele de contact din formular: { camp, mesaj } sau null
export function valideazaContact({ nume, telefon }) { // primește valorile din formular
  const mesajNume = valideazaNume(nume); // numele
  if (mesajNume) return { camp: "nume", mesaj: mesajNume }; // primul câmp greșit
  const mesajTelefon = valideazaTelefon(telefon); // telefonul
  return mesajTelefon ? { camp: "telefon", mesaj: mesajTelefon } : null; // al doilea câmp sau nimic
} // sfârșitul funcției

// Citește profilul salvat. Textul vine din afara aplicației, deci verificăm forma (ca citesteCos):
// la orice problemă, profilul gol; câmpurile și adresele greșite sunt aruncate, iar implicita trebuie să existe
export function citesteProfil(text) { // primește textul brut (sau null)
  if (typeof text !== "string") return PROFIL_GOL; // nimic salvat
  let date; // rezultatul parsării
  try { // JSON.parse aruncă eroare la text invalid
    date = JSON.parse(text); // textul transformat în valoare JavaScript
  } catch { // JSON invalid
    return PROFIL_GOL; // profilul gol
  } // sfârșitul try/catch
  if (date === null || typeof date !== "object" || Array.isArray(date)) return PROFIL_GOL; // trebuie să fie un obiect
  const adrese = []; // adresele bune, în ordine
  for (const a of Array.isArray(date.adrese) ? date.adrese : []) { // fiecare adresă salvată
    const ok = // o adresă e bună doar dacă trece toate verificările
      a !== null && typeof a === "object" && // obiect
      typeof a.id === "string" && a.id !== "" && !adrese.some((x) => x.id === a.id) && // id text, nevid, unic
      (a.eticheta === undefined || (typeof a.eticheta === "string" && a.eticheta.length <= ETICHETA_MAX)) && // eticheta opțională
      typeof a.text === "string" && valideazaTextAdresa(a.text) === null; // text valid
    if (ok) adrese.push({ id: a.id, eticheta: a.eticheta ?? "", text: a.text.trim() }); // copiem doar câmpurile cunoscute
    if (adrese.length === ADRESE_MAXIME) break; // plafonul
  } // sfârșitul buclei
  const implicita = adrese.some((a) => a.id === date.implicita) ? date.implicita : adrese[0]?.id ?? null; // o implicită care chiar există
  return { // profil nou
    nume: typeof date.nume === "string" && date.nume.length <= NUME_MAX ? date.nume : "", // numele (forma, nu și lungimea minimă)
    telefon: typeof date.telefon === "string" && date.telefon.length <= TELEFON_MAX ? date.telefon : "", // telefonul
    adrese, // adresele valide
    implicita, // id-ul adresei implicite
  }; // sfârșitul obiectului
} // sfârșitul funcției

// Numele și telefonul salvate (deja validate de apelant), curățate
export function salveazaContact(profil, { nume, telefon }) { // primește profilul și valorile noi
  return { ...profil, nume: nume.trim(), telefon: curataTelefon(telefon) }; // profil nou
} // sfârșitul funcției

// Adaugă o adresă (deja validată); prima adresă devine implicită. Aceeași adresă de două ori sau plafonul atins: același profil
export function adaugaAdresa(profil, { eticheta = "", text }, id) { // id-ul vine de la apelant, ca funcția să rămână pură
  const curat = text.trim(); // fără spațiile de la margini
  if (profil.adrese.length >= ADRESE_MAXIME || profil.adrese.some((a) => a.id === id || a.text === curat)) return profil; // plafon, id dublu sau adresă dublă
  return { ...profil, adrese: [...profil.adrese, { id, eticheta: eticheta.trim(), text: curat }], implicita: profil.implicita ?? id }; // profil nou
} // sfârșitul funcției

// Schimbă eticheta și textul unei adrese (deja validate)
export function editeazaAdresa(profil, id, { eticheta = "", text }) { // primește profilul, id-ul și valorile noi
  if (!profil.adrese.some((a) => a.id === id)) return profil; // id necunoscut: același profil
  return { ...profil, adrese: profil.adrese.map((a) => (a.id === id ? { id, eticheta: eticheta.trim(), text: text.trim() } : a)) }; // copie cu adresa nouă
} // sfârșitul funcției

// Șterge o adresă; dacă era implicită, prima rămasă devine implicită
export function stergeAdresa(profil, id) { // primește profilul și id-ul
  const adrese = profil.adrese.filter((a) => a.id !== id); // fără adresa ștearsă
  if (adrese.length === profil.adrese.length) return profil; // nimic șters: același profil
  return { ...profil, adrese, implicita: profil.implicita === id ? adrese[0]?.id ?? null : profil.implicita }; // implicita rămâne una existentă
} // sfârșitul funcției

// Alege adresa implicită
export function alegeImplicita(profil, id) { // primește profilul și id-ul
  if (!profil.adrese.some((a) => a.id === id)) return profil; // id necunoscut: același profil
  return { ...profil, implicita: id }; // profil nou
} // sfârșitul funcției

// Adresa implicită, ca obiect; null dacă nu există adrese
export function adresaImplicita(profil) { // primește profilul
  return profil.adrese.find((a) => a.id === profil.implicita) ?? null; // căutare exactă
} // sfârșitul funcției
