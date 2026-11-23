// Teste pentru src/api.js, rulate cu `node --test`, fără server și fără dependențe:
// înlocuim globalThis.fetch cu o funcție falsă și o punem la loc după fiecare test.
// Sub Node, import.meta.env nu există; api.js folosește `import.meta.env?.VITE_API_URL`, deci cade pe adresa implicită.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { API_URL, TIMP_MAXIM_MS, createComanda, createLivrator, createPreparat, deleteLivrator, deletePreparat, fetchRestaurante, salveazaProfilRestaurant, updatePreparat, createRecenzie, deleteComanda, fetchComanda, fetchComenzi, fetchLivratori, fetchMeniu, fetchRecenzii, request, updateComanda, updateLivrator } from "../src/api.js";

const fetchOriginal = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = fetchOriginal;
});

// Un răspuns fals, cu doar ce folosește api.js: ok, status, json()
function raspuns(date, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => date };
}

test("API_URL e adresa json-server implicită când nu există .env (sub Node)", () => {
  assert.equal(API_URL, "http://localhost:3001");
});

test("TIMP_MAXIM_MS e 8 secunde", () => {
  assert.equal(TIMP_MAXIM_MS, 8000);
});

test("fetchComenzi cere /comenzi cu un AbortSignal și întoarce lista", async () => {
  const lista = [{ id: 1, preparat: "Pizza Margherita" }];
  const apeluri = [];
  globalThis.fetch = async (url, optiuni) => {
    apeluri.push({ url, optiuni });
    return raspuns(lista);
  };
  assert.deepEqual(await fetchComenzi(), lista);
  assert.equal(apeluri.length, 1);
  assert.equal(apeluri[0].url, "http://localhost:3001/comenzi");
  assert.ok(apeluri[0].optiuni.signal instanceof AbortSignal);
});

test("fetchMeniu cere /meniu și întoarce lista", async () => {
  let urlCerut;
  globalThis.fetch = async (url) => {
    urlCerut = url;
    return raspuns([{ id: "p1" }]);
  };
  assert.deepEqual(await fetchMeniu(), [{ id: "p1" }]);
  assert.equal(urlCerut, "http://localhost:3001/meniu");
});

test("o listă goală e un răspuns valid", async () => {
  globalThis.fetch = async () => raspuns([]);
  assert.deepEqual(await fetchComenzi(), []);
});

test("res.ok false aruncă „Eroare server: 500”", async () => {
  globalThis.fetch = async () => raspuns({ eroare: "x" }, 500);
  await assert.rejects(fetchComenzi(), { message: "Eroare server: 500" });
});

test("res.ok false aruncă și pentru 404", async () => {
  globalThis.fetch = async () => raspuns({}, 404);
  await assert.rejects(fetchMeniu(), { message: "Eroare server: 404" });
});

test("Etapa 9: res.ok false cu { error } aruncă mesajul serverului", async () => {
  globalThis.fetch = async () => raspuns({ error: "Comanda nu există" }, 404);
  await assert.rejects(fetchComanda(999), { message: "Comanda nu există" });
  globalThis.fetch = async () => raspuns({ error: "preparat nu poate fi gol" }, 400);
  await assert.rejects(createComanda({ preparat: "" }), { message: "preparat nu poate fi gol" });
});

test("Etapa 9: un corp de eroare care nu e JSON păstrează „Eroare server: <cod>”", async () => {
  globalThis.fetch = async () => ({ ok: false, status: 502, json: async () => JSON.parse("<html>") });
  await assert.rejects(fetchComenzi(), { message: "Eroare server: 502" });
});

test("un răspuns care nu e listă aruncă „Răspuns neașteptat de la server”", async () => {
  for (const date of [{ comenzi: [] }, null, "text", 5]) {
    globalThis.fetch = async () => raspuns(date);
    await assert.rejects(fetchComenzi(), { message: "Răspuns neașteptat de la server" });
  }
});

test("un corp care nu e JSON valid aruncă „Răspuns neașteptat de la server”", async () => {
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => JSON.parse("<html>") });
  await assert.rejects(fetchComenzi(), { message: "Răspuns neașteptat de la server" });
});

test("eroarea de rețea (TypeError „Failed to fetch”) devine un mesaj românesc", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(fetchComenzi(), { message: "Serverul nu poate fi contactat" });
});

test("timeout: cererea e anulată prin AbortSignal și aruncă mesajul cu secundele", async () => {
  let semnal;
  // fetch fals care nu răspunde niciodată, dar respectă semnalul, ca fetch-ul real
  globalThis.fetch = (url, { signal }) =>
    new Promise((resolve, reject) => {
      semnal = signal;
      signal.addEventListener("abort", () => reject(signal.reason));
    });
  const inceput = Date.now();
  await assert.rejects(fetchComenzi(20), { message: "Serverul nu a răspuns în 0 secunde" }); // 20 ms rotunjit la secunde
  assert.ok(semnal.aborted);
  assert.ok(Date.now() - inceput < 2000, "testul trebuie să dureze milisecunde, nu secunde");
});

test("timeout: mesajul pentru valoarea implicită spune 8 secunde", async () => {
  // fetch fals care aruncă direct un AbortError, ca după 8 secunde (fără să așteptăm 8 secunde)
  globalThis.fetch = async () => {
    throw new DOMException("This operation was aborted", "AbortError");
  };
  await assert.rejects(fetchMeniu(), { message: "Serverul nu a răspuns în 8 secunde" });
});

test("după un răspuns reușit, cronometrul e oprit (cererea nu mai e anulată)", async () => {
  let semnal;
  globalThis.fetch = async (url, { signal }) => {
    semnal = signal;
    return raspuns([]);
  };
  await fetchComenzi(30);
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(semnal.aborted, false);
});

// --- Etapa 7: request, funcția comună ---

// Înregistrează fiecare apel la fetch și răspunde cu `rezultat` (sau cu ce întoarce funcția primită)
function fetchInregistrat(rezultat) {
  const apeluri = [];
  globalThis.fetch = async (url, optiuni) => {
    apeluri.push({ url, optiuni });
    return typeof rezultat === "function" ? rezultat(url, optiuni) : rezultat;
  };
  return apeluri;
}

test("request întoarce corpul JSON al unui răspuns reușit, pentru orice tip de valoare", async () => {
  for (const corp of [{ id: 7 }, [1, 2], {}, "text", 0]) {
    fetchInregistrat(raspuns(corp));
    assert.deepEqual(await request("/orice"), corp);
  }
});

test("request pune antetul JSON și semnalul de timeout, și păstrează metoda și corpul primite", async () => {
  const apeluri = fetchInregistrat(raspuns({}));
  await request("/comenzi", { method: "POST", body: "{}" });
  const { url, optiuni } = apeluri[0];
  assert.equal(url, "http://localhost:3001/comenzi");
  assert.equal(optiuni.method, "POST");
  assert.equal(optiuni.body, "{}");
  assert.equal(optiuni.headers["Content-Type"], "application/json");
  assert.ok(optiuni.signal instanceof AbortSignal);
});

test("request adaugă antetele apelantului peste antetul JSON", async () => {
  const apeluri = fetchInregistrat(raspuns({}));
  await request("/x", { headers: { Accept: "application/json", "Content-Type": "text/plain" } });
  assert.deepEqual(apeluri[0].optiuni.headers, { "Content-Type": "text/plain", Accept: "application/json" });
});

test("request întoarce null la 204 No Content, fără să citească corpul", async () => {
  let citit = false;
  fetchInregistrat({ ok: true, status: 204, json: async () => { citit = true; throw new SyntaxError("Unexpected end of JSON input"); } });
  assert.equal(await request("/comenzi/1", { method: "DELETE" }), null);
  assert.equal(citit, false);
});

test("request aruncă „Eroare server: <cod>” când res.ok e false, fără să citească corpul", async () => {
  for (const cod of [400, 404, 500, 503]) {
    fetchInregistrat(raspuns({ eroare: "x" }, cod));
    await assert.rejects(request("/comenzi/1"), { message: `Eroare server: ${cod}` });
  }
});

test("request traduce eroarea de rețea în „Serverul nu poate fi contactat”", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(request("/comenzi", { method: "POST", body: "{}" }), { message: "Serverul nu poate fi contactat" });
});

test("request traduce timeout-ul și corpul invalid, ca fetchComenzi", async () => {
  globalThis.fetch = (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener("abort", () => reject(signal.reason)));
  await assert.rejects(request("/comenzi", {}, 20), { message: "Serverul nu a răspuns în 0 secunde" });
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => JSON.parse("<html>") });
  await assert.rejects(request("/comenzi"), { message: "Răspuns neașteptat de la server" });
});

// --- Etapa 7: createComanda / updateComanda / deleteComanda ---

test("createComanda trimite POST /comenzi cu comanda ca JSON și întoarce obiectul de la server", async () => {
  const comanda = { preparat: "Pizza cu trufe", restaurant: "Pizzeria Napoli", livrare: "standard", categorie: "Pizza", livrata: false, pret: null, speciala: true, creata: "2026-11-16T10:00:00.000Z" };
  const apeluri = fetchInregistrat((url, optiuni) => raspuns({ ...JSON.parse(optiuni.body), id: 7 }, 201));
  const salvata = await createComanda(comanda);
  assert.equal(apeluri.length, 1);
  assert.equal(apeluri[0].url, "http://localhost:3001/comenzi");
  assert.equal(apeluri[0].optiuni.method, "POST");
  assert.deepEqual(JSON.parse(apeluri[0].optiuni.body), comanda);
  assert.deepEqual(salvata, { ...comanda, id: 7 });
});

test("createComanda nu adaugă id: trimite exact câmpurile primite (cu id doar dacă îl are deja; serverul din Etapa 9 îl ignoră)", async () => {
  const apeluri = fetchInregistrat(raspuns({}, 201));
  await createComanda({ preparat: "X" });
  assert.equal("id" in JSON.parse(apeluri[0].optiuni.body), false);
  await createComanda({ id: 3, preparat: "Y" });
  assert.equal(JSON.parse(apeluri[1].optiuni.body).id, 3);
});

test("updateComanda trimite PATCH /comenzi/:id doar cu câmpurile schimbate", async () => {
  const apeluri = fetchInregistrat(raspuns({ id: 3, livrata: true }));
  const actualizata = await updateComanda(3, { livrata: true });
  assert.equal(apeluri[0].url, "http://localhost:3001/comenzi/3");
  assert.equal(apeluri[0].optiuni.method, "PATCH");
  assert.deepEqual(JSON.parse(apeluri[0].optiuni.body), { livrata: true });
  assert.deepEqual(actualizata, { id: 3, livrata: true });
});

test("deleteComanda trimite DELETE /comenzi/:id fără corp; 200 cu {} (json-server) și 204 (null) sunt ambele succes", async () => {
  const apeluri = fetchInregistrat(raspuns({}));
  assert.deepEqual(await deleteComanda(5), {});
  assert.equal(apeluri[0].url, "http://localhost:3001/comenzi/5");
  assert.equal(apeluri[0].optiuni.method, "DELETE");
  assert.equal(apeluri[0].optiuni.body, undefined);
  fetchInregistrat({ ok: true, status: 204, json: async () => null });
  assert.equal(await deleteComanda(5), null);
});

test("id-ul e codificat în adresă, deci nu poate schimba ruta", async () => {
  const apeluri = fetchInregistrat(raspuns({}));
  await deleteComanda("../meniu");
  assert.equal(apeluri[0].url, "http://localhost:3001/comenzi/..%2Fmeniu");
});

test("update și delete propagă erorile serverului (ex. 404 pentru o comandă deja ștearsă)", async () => {
  fetchInregistrat(raspuns({}, 404));
  await assert.rejects(updateComanda(99, { livrata: true }), { message: "Eroare server: 404" });
  await assert.rejects(deleteComanda(99), { message: "Eroare server: 404" });
});

// --- Etapa 8: fetchComanda (pagina de detaliu) ---

test("fetchComanda cere GET /comenzi/:id și întoarce obiectul comenzii", async () => {
  const comanda = { id: 3, preparat: "Platou sushi (12 buc.)", livrata: false };
  const apeluri = fetchInregistrat(raspuns(comanda));
  assert.deepEqual(await fetchComanda("3"), comanda);
  assert.equal(apeluri.length, 1);
  assert.equal(apeluri[0].url, "http://localhost:3001/comenzi/3");
  assert.equal(apeluri[0].optiuni.method, undefined);
  assert.ok(apeluri[0].optiuni.signal instanceof AbortSignal);
});

test("fetchComanda codifică id-ul din adresă, deci nu poate schimba ruta", async () => {
  const apeluri = fetchInregistrat(raspuns({ id: 1 }));
  await fetchComanda("../meniu");
  assert.equal(apeluri[0].url, "http://localhost:3001/comenzi/..%2Fmeniu");
});

test("fetchComanda aruncă „Eroare server: 404” pentru o comandă care nu există (ex. /comenzi/999)", async () => {
  fetchInregistrat(raspuns({}, 404));
  await assert.rejects(fetchComanda("999"), { message: "Eroare server: 404" });
});

test("fetchComanda aruncă „Răspuns neașteptat de la server” dacă răspunsul nu e un singur obiect", async () => {
  for (const date of [[{ id: 1 }], null, "text", 5]) {
    fetchInregistrat(raspuns(date));
    await assert.rejects(fetchComanda("1"), { message: "Răspuns neașteptat de la server" });
  }
});

test("fetchComanda traduce erorile de rețea, ca restul cererilor", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await assert.rejects(fetchComanda("1"), { message: "Serverul nu poate fi contactat" });
});

// --- fluxul complet: livratori și recenzii ---

test("fetchLivratori și fetchRecenzii cer resursele lor și resping un răspuns care nu e listă", async () => {
  const apeluri = fetchInregistrat(raspuns([{ id: 1, nume: "Andrei (livrator demo)", online: false }]));
  assert.equal((await fetchLivratori()).length, 1);
  assert.equal(apeluri[0].url, "http://localhost:3001/livratori");
  fetchInregistrat(raspuns([]));
  assert.deepEqual(await fetchRecenzii(), []);
  fetchInregistrat(raspuns({ nu: "listă" }));
  await assert.rejects(fetchRecenzii(), /Răspuns neașteptat/);
});

test("updateLivrator trimite PATCH /livratori/:id, iar createRecenzie POST /recenzii", async () => {
  const apeluri = fetchInregistrat(raspuns({ id: 2, online: true }));
  await updateLivrator(2, { online: true });
  assert.equal(apeluri[0].url, "http://localhost:3001/livratori/2");
  assert.equal(apeluri[0].optiuni.method, "PATCH");
  assert.deepEqual(JSON.parse(apeluri[0].optiuni.body), { online: true });
  const recenzie = { comandaId: 2, restaurant: "Burger Van", nota: 5, text: "", creata: "2026-11-22T18:00:00.000Z" };
  const apeluriPost = fetchInregistrat(raspuns({ id: 1, ...recenzie }, 201));
  await createRecenzie(recenzie);
  assert.equal(apeluriPost[0].url, "http://localhost:3001/recenzii");
  assert.equal(apeluriPost[0].optiuni.method, "POST");
  assert.deepEqual(JSON.parse(apeluriPost[0].optiuni.body), recenzie);
});

test("meniul: createPreparat POST /meniu, updatePreparat PATCH și deletePreparat DELETE pe /meniu/:id (id codificat)", async () => {
  const preparat = { preparat: "Pizza Prosciutto", restaurant: "Pizzeria Napoli", categorie: "Pizza", pret: 50, imagine: null, disponibil: true };
  let apeluri = fetchInregistrat(raspuns({ id: "abc1234", ...preparat }, 201));
  assert.equal((await createPreparat(preparat)).id, "abc1234");
  assert.equal(apeluri[0].url, "http://localhost:3001/meniu");
  assert.equal(apeluri[0].optiuni.method, "POST");
  assert.deepEqual(JSON.parse(apeluri[0].optiuni.body), preparat);
  apeluri = fetchInregistrat(raspuns({ id: "p1", disponibil: false }));
  await updatePreparat("p1", { disponibil: false });
  assert.equal(apeluri[0].url, "http://localhost:3001/meniu/p1");
  assert.equal(apeluri[0].optiuni.method, "PATCH");
  apeluri = fetchInregistrat(raspuns({}));
  await deletePreparat("../comenzi");
  assert.equal(apeluri[0].url, "http://localhost:3001/meniu/..%2Fcomenzi");
  assert.equal(apeluri[0].optiuni.method, "DELETE");
});

test("restaurantele: fetchRestaurante cere lista; salveazaProfilRestaurant face POST pentru unul nou și PUT pentru unul existent", async () => {
  let apeluri = fetchInregistrat(raspuns([]));
  assert.deepEqual(await fetchRestaurante(), []);
  assert.equal(apeluri[0].url, "http://localhost:3001/restaurante");
  const profil = { id: "sushi-kyo", descriere: "", telefon: "", pauzat: false, program: null };
  apeluri = fetchInregistrat(raspuns(profil, 201));
  await salveazaProfilRestaurant(profil, false);
  assert.equal(apeluri[0].url, "http://localhost:3001/restaurante");
  assert.equal(apeluri[0].optiuni.method, "POST");
  apeluri = fetchInregistrat(raspuns(profil));
  await salveazaProfilRestaurant(profil, true);
  assert.equal(apeluri[0].url, "http://localhost:3001/restaurante/sushi-kyo");
  assert.equal(apeluri[0].optiuni.method, "PUT");
  assert.deepEqual(JSON.parse(apeluri[0].optiuni.body), profil);
});

test("livratorii: createLivrator POST /livratori, deleteLivrator DELETE /livratori/:id", async () => {
  let apeluri = fetchInregistrat(raspuns({ id: 4, nume: "Ana (livrator demo)", online: false, activ: true }, 201));
  await createLivrator({ nume: "Ana (livrator demo)", online: false, activ: true });
  assert.equal(apeluri[0].url, "http://localhost:3001/livratori");
  assert.equal(apeluri[0].optiuni.method, "POST");
  apeluri = fetchInregistrat(raspuns({}));
  await deleteLivrator(4);
  assert.equal(apeluri[0].url, "http://localhost:3001/livratori/4");
  assert.equal(apeluri[0].optiuni.method, "DELETE");
});
