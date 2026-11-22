// Clienții din /admin, deduși din datele de contact ale comenzilor plasate din coș (nu există conturi de client în demo).
// Funcții pure, testate cu `node --test`. Doi clienți sunt aceeași persoană dacă au același telefon.
import { dePlata } from "./cupoane.js";
import { normalizeazaComanda } from "./stari.js";

// [{ cheie, nume, telefon, numar, totalPlatit }], ordonați după numărul de comenzi, apoi după nume.
// `nume` e cel din cea mai recentă comandă (id-ul cel mai mare); totalPlatit adună doar comenzile cu plata „platita”.
export function clientiDinComenzi(comenzi) {
  if (!Array.isArray(comenzi)) return [];
  const harta = new Map();
  for (const bruta of comenzi) {
    const c = normalizeazaComanda(bruta);
    const contact = c.contact;
    if (!contact || typeof contact.telefon !== "string" || contact.telefon.trim() === "") continue;
    const cheie = contact.telefon.trim();
    const id = Number(c.id) || 0;
    const client = harta.get(cheie) ?? { cheie, nume: "", telefon: cheie, numar: 0, totalPlatit: 0, ultimulId: -1 };
    client.numar += 1;
    if (c.plata.stare === "platita") client.totalPlatit += dePlata(c);
    if (id >= client.ultimulId && typeof contact.nume === "string" && contact.nume.trim() !== "") {
      client.nume = contact.nume.trim();
      client.ultimulId = id;
    }
    harta.set(cheie, client);
  }
  return [...harta.values()]
    .map(({ cheie, nume, telefon, numar, totalPlatit }) => ({ cheie, nume: nume || "Fără nume", telefon, numar, totalPlatit }))
    .sort((a, b) => b.numar - a.numar || a.nume.localeCompare(b.nume, "ro"));
}
