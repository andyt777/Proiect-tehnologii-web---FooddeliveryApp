// Pornește o aplicație nouă (cu datele ei, din seed) pe un port liber; serverul se oprește la finalul testului.
import { createApp } from "../src/app.js";

export async function porneste(t) {
  const server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const baza = `http://localhost:${server.address().port}`;

  // cerere(metoda, cale, corp?, { brut, antete }) -> { status, headers, body }
  async function cerere(metoda, cale, corp, { brut, antete = {} } = {}) {
    const res = await fetch(`${baza}${cale}`, {
      method: metoda,
      headers: { "Content-Type": "application/json", ...antete },
      body: brut ?? (corp === undefined ? undefined : JSON.stringify(corp)),
    });
    const text = await res.text();
    return { status: res.status, headers: res.headers, body: text === "" ? null : JSON.parse(text) };
  }

  return { baza, cerere };
}
