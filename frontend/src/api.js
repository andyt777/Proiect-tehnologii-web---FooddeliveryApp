// Etapa 6: toate cererile către server trec prin acest fișier; e singurul loc din aplicație cu `fetch`.
// Componentele nu știu adresa serverului și nici cum arată un răspuns HTTP: primesc doar date sau o eroare.
// Adresa vine din .env (VITE_API_URL, vezi .env.example); fără .env folosim json-server pornit local.

// `?.`: sub Node (testele cu `node --test`) import.meta.env nu există; în Vite e înlocuit la build cu valorile din .env
export const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, ""); // adresa de bază; `||` (nu `??`) prinde și VITE_API_URL= gol, iar replace scoate „/” de la final (altfel ar ieși „//comenzi”)

export const TIMP_MAXIM_MS = 8000; // după atâtea milisecunde renunțăm la cerere (serverul blocat nu ține pagina în „Se încarcă” la nesfârșit)

// Cere o rută și întoarce lista din răspuns. Singurul `fetch` din aplicație; fetchComenzi și fetchMeniu doar îl refolosesc.
// timpMaxim e opțional: testele îl scurtează, ca verificarea timeout-ului să nu dureze 8 secunde.
async function cereJson(ruta, timpMaxim = TIMP_MAXIM_MS) { // ruta = „/comenzi” sau „/meniu”
  const controller = new AbortController(); // ne permite să oprim cererea din afară
  const timer = setTimeout(() => controller.abort(), timpMaxim); // după timpMaxim, cererea e anulată
  try { // orice eroare de mai jos ajunge în catch, unde o traducem pentru utilizator
    const res = await fetch(`${API_URL}${ruta}`, { signal: controller.signal }); // cererea GET; semnalul o leagă de controller
    if (!res.ok) throw new Error(`Eroare server: ${res.status}`); // fetch nu aruncă la 404/500: verificăm noi codul HTTP
    const date = await res.json(); // transformăm corpul răspunsului din JSON în valoare JavaScript
    if (!Array.isArray(date)) throw new Error("Răspuns neașteptat de la server"); // așteptăm o listă; altceva nu poate fi afișat
    return date; // lista validă
  } catch (err) { // cererea a eșuat
    throw traduceEroarea(err, timpMaxim); // aruncăm mai departe o eroare cu mesaj românesc, pe înțelesul utilizatorului
  } finally { // rulează și la succes, și la eroare
    clearTimeout(timer); // oprim cronometrul, ca să nu anuleze o cerere deja terminată
  } // sfârșitul try/catch/finally
} // sfârșitul funcției

// Transformă erorile tehnice ale browserului în mesaje clare; mesajele noastre (Error simplu) trec neschimbate
function traduceEroarea(err, timpMaxim) { // primește eroarea prinsă și durata maximă
  if (err?.name === "AbortError") return new Error(`Serverul nu a răspuns în ${Math.round(timpMaxim / 1000)} secunde`); // controller.abort() de mai sus = timeout
  if (err instanceof TypeError) return new Error("Serverul nu poate fi contactat"); // „Failed to fetch”: serverul e oprit sau adresa e greșită
  if (err instanceof SyntaxError) return new Error("Răspuns neașteptat de la server"); // corpul răspunsului nu e JSON valid
  return err; // „Eroare server: 500” sau „Răspuns neașteptat de la server”: sunt deja clare
} // sfârșitul funcției

// GET /comenzi: lista de comenzi din db.json
export function fetchComenzi(timpMaxim) { // timpMaxim opțional (doar pentru teste)
  return cereJson("/comenzi", timpMaxim); // promisiune cu lista de comenzi
} // sfârșitul funcției

// GET /meniu: preparatele care se pot pune în coș
export function fetchMeniu(timpMaxim) { // timpMaxim opțional (doar pentru teste)
  return cereJson("/meniu", timpMaxim); // promisiune cu lista de preparate
} // sfârșitul funcției
