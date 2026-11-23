// Etapa 6: toate cererile către server trec prin acest fișier; e singurul loc din aplicație cu `fetch`.
// Componentele nu știu adresa serverului și nici cum arată un răspuns HTTP: primesc doar date sau o eroare.
// Adresa vine din .env (VITE_API_URL, vezi .env.example); fără .env folosim serverul Express din backend/ (Etapa 9), pornit local.
// Etapa 7: o funcție comună, request, pentru toate cele patru operații (GET, POST, PATCH, DELETE).

// `?.`: sub Node (testele cu `node --test`) import.meta.env nu există; în Vite e înlocuit la build cu valorile din .env
export const API_URL = (import.meta.env?.VITE_API_URL || "http://localhost:3001").replace(/\/+$/, ""); // adresa de bază; `||` (nu `??`) prinde și VITE_API_URL= gol, iar replace scoate „/” de la final (altfel ar ieși „//comenzi”)

export const TIMP_MAXIM_MS = 8000; // după atâtea milisecunde renunțăm la cerere (serverul blocat nu ține pagina în „Se încarcă” la nesfârșit)

// Etapa 7: funcția comună. Trimite JSON, verifică răspunsul și întoarce corpul lui (null la 204 No Content).
// options = ce primește fetch (method, body, headers); timpMaxim e opțional: testele îl scurtează.
export async function request(path, options = {}, timpMaxim = TIMP_MAXIM_MS) { // path = „/comenzi”, „/comenzi/3” etc.
  const controller = new AbortController(); // ne permite să oprim cererea din afară
  const timer = setTimeout(() => controller.abort(), timpMaxim); // după timpMaxim, cererea e anulată
  try { // orice eroare de mai jos ajunge în catch, unde o traducem pentru utilizator
    const res = await fetch(`${API_URL}${path}`, { // singurul `fetch` din aplicație
      ...options, // copiem ce a cerut apelantul: metoda și corpul cererii
      headers: { "Content-Type": "application/json", ...options.headers }, // corpul e JSON; apelantul poate adăuga alte antete
      signal: controller.signal, // semnalul leagă cererea de controller (timeout)
    }); // sfârșitul opțiunilor
    if (!res.ok) { // fetch nu aruncă la 404/500: verificăm noi codul HTTP
      const body = await res.json().catch(() => ({})); // Etapa 9: serverul trimite { error: "..." }; un corp care nu e JSON nu ne oprește
      throw new Error(body.error || `Eroare server: ${res.status}`); // mesajul serverului, altfel codul
    } // sfârșitul if
    return res.status === 204 ? null : await res.json(); // 204 nu are corp (res.json() ar arunca); altfel corpul, din JSON în valoare JavaScript
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

// GET pentru o listă: în plus față de request, verificăm că răspunsul chiar e o listă
async function cereLista(path, timpMaxim) { // folosită de fetchComenzi, fetchMeniu, fetchLivratori și fetchRecenzii
  const date = await request(path, {}, timpMaxim); // GET e metoda implicită a lui fetch
  if (!Array.isArray(date)) throw new Error("Răspuns neașteptat de la server"); // așteptăm o listă; altceva nu poate fi afișat
  return date; // lista validă
} // sfârșitul funcției

// GET /comenzi: lista de comenzi de pe server
export function fetchComenzi(timpMaxim) { // timpMaxim opțional (doar pentru teste)
  return cereLista("/comenzi", timpMaxim); // promisiune cu lista de comenzi
} // sfârșitul funcției

// GET /meniu: preparatele care se pot pune în coș
export function fetchMeniu(timpMaxim) { // timpMaxim opțional (doar pentru teste)
  return cereLista("/meniu", timpMaxim); // promisiune cu lista de preparate
} // sfârșitul funcției

// Etapa 8: GET /comenzi/:id, o singură comandă (pagina de detaliu). serverul răspunde 404 pentru un id inexistent,
// iar request aruncă atunci mesajul lui („Comanda nu există”), afișat de pagină.
export async function fetchComanda(id, timpMaxim) { // id-ul vine din adresă (useParams îl dă ca text); timpMaxim opțional (doar pentru teste)
  const date = await request(`/comenzi/${encodeURIComponent(id)}`, {}, timpMaxim); // encodeURIComponent: „../meniu” din adresă nu poate schimba ruta
  if (date === null || typeof date !== "object" || Array.isArray(date)) throw new Error("Răspuns neașteptat de la server"); // așteptăm un singur obiect, nu o listă sau un text
  return date; // comanda, ca obiect
} // sfârșitul funcției

// Etapa 7: POST /comenzi. Serverul pune id-ul și întoarce comanda salvată; pe ecran ajunge obiectul întors.
// Etapa 9: serverul ignoră orice id trimis de client, deci „Anulează” primește comanda readusă cu un id nou.
export function createComanda(comanda) { // primește comanda de salvat
  return request("/comenzi", { method: "POST", body: JSON.stringify(comanda) }); // corpul cererii, ca text JSON
} // sfârșitul funcției

// Etapa 7: PATCH /comenzi/:id, doar cu câmpurile schimbate (ex. { livrata: true }); întoarce comanda actualizată
export function updateComanda(id, changes) { // id-ul comenzii și câmpurile noi
  return request(`/comenzi/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(changes) }); // encodeURIComponent: id-ul nu poate strica adresa
} // sfârșitul funcției

// Etapa 7: DELETE /comenzi/:id; serverul din Etapa 9 răspunde 204 (request întoarce null), json-server răspundea 200 cu {}
export function deleteComanda(id) { // id-ul comenzii de șters
  return request(`/comenzi/${encodeURIComponent(id)}`, { method: "DELETE" }); // fără corp
} // sfârșitul funcției

// Fluxul complet: GET /livratori, livratorii demo ({ id, nume, online })
export function fetchLivratori(timpMaxim) { // timpMaxim opțional (doar pentru teste)
  return cereLista("/livratori", timpMaxim); // promisiune cu lista de livratori
} // sfârșitul funcției

// PATCH /livratori/:id, ex. { online: true } când livratorul demo intră în tură
export function updateLivrator(id, changes) { // id-ul livratorului și câmpurile noi
  return request(`/livratori/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(changes) }); // întoarce livratorul actualizat
} // sfârșitul funcției

// GET /recenzii, recenziile lăsate după livrare ({ id, comandaId, restaurant, nota, text, creata })
export function fetchRecenzii(timpMaxim) { // timpMaxim opțional (doar pentru teste)
  return cereLista("/recenzii", timpMaxim); // promisiune cu lista de recenzii
} // sfârșitul funcției

// POST /recenzii; serverul pune id-ul și întoarce recenzia salvată
export function createRecenzie(recenzie) { // primește recenzia deja validată
  return request("/recenzii", { method: "POST", body: JSON.stringify(recenzie) }); // corpul cererii, ca text JSON
} // sfârșitul funcției

// Administrarea meniului (/restaurant): POST, PATCH și DELETE pe /meniu. La POST serverul pune id-ul (text, pentru meniu).
export function createPreparat(preparat) {
  return request("/meniu", { method: "POST", body: JSON.stringify(preparat) });
}

export function updatePreparat(id, changes) {
  return request(`/meniu/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(changes) });
}

export function deletePreparat(id) {
  return request(`/meniu/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// Profilurile restaurantelor (id = slug-ul restaurantului): GET, apoi POST pentru unul nou sau PUT pentru unul existent
export function fetchRestaurante(timpMaxim) {
  return cereLista("/restaurante", timpMaxim);
}

export function salveazaProfilRestaurant(profil, exista) {
  return exista
    ? request(`/restaurante/${encodeURIComponent(profil.id)}`, { method: "PUT", body: JSON.stringify(profil) })
    : request("/restaurante", { method: "POST", body: JSON.stringify(profil) });
}

// Administrarea livratorilor (/admin): POST un livrator nou, DELETE unul fără cursă în lucru
export function createLivrator(livrator) {
  return request("/livratori", { method: "POST", body: JSON.stringify(livrator) });
}

export function deleteLivrator(id) {
  return request(`/livratori/${encodeURIComponent(id)}`, { method: "DELETE" });
}
