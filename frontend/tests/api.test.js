// Teste pentru src/api.js, rulate cu `node --test`, fără server și fără dependențe:
// înlocuim globalThis.fetch cu o funcție falsă și o punem la loc după fiecare test.
// Sub Node, import.meta.env nu există; api.js folosește `import.meta.env?.VITE_API_URL`, deci cade pe adresa implicită.
import { test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { API_URL, TIMP_MAXIM_MS, fetchComenzi, fetchMeniu } from "../src/api.js";

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
