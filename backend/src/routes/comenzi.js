// /comenzi: resursa din tw.json. Id-uri numerice, puse de server.
// Regulile (stări, plată, livrare, program, alocare) sunt în src/reguli/; routerul doar le leagă de HTTP.
import { Router } from "express";
import { conflict } from "../erori.js";
import { cheieDinCerere } from "../idempotenta.js";
import { parseId } from "../ids.js";
import { campuriCalculate, campuriPlasare, modificareComanda, potrivireMeniu } from "../reguli/comenzi.js";
import { alegeLivrator, aplicaPasLivrare, mesajPasLivrare, poateAvansaLivrarea } from "../reguli/livrare.js";
import { slugRestaurant, verificaPlasare } from "../reguli/restaurant.js";
import { valideazaComanda } from "../validation.js";
import { dateValide, gasesteSau404 } from "./util.js";

const NU_EXISTA = "Comanda nu există";

export function routerComenzi(store) {
  const router = Router();
  const { comenzi, meniu, livratori, restaurante, cheiComenzi } = store;

  router.get("/", (req, res) => {
    res.json(comenzi.toate());
  });

  router.get("/:id", (req, res) => {
    res.json(gasesteSau404(comenzi, parseId(req.params.id), NU_EXISTA));
  });

  // 201 și la o cerere repetată cu aceeași Idempotency-Key (același răspuns, fără o comandă nouă)
  router.post("/", (req, res) => {
    const cheie = cheieDinCerere(req);
    const anterioara = cheie ? cheiComenzi.cauta(cheie, req.body) : null;
    if (anterioara) return res.status(201).set("Idempotent-Replayed", "true").json(anterioara);

    const acum = new Date();
    const date = dateValide(valideazaComanda(req.body, { acum }));
    const ciclu = campuriPlasare(date, acum);
    if (ciclu.stare === "plasata") {
      const profil = restaurante.gaseste(slugRestaurant(date.restaurant));
      verificaPlasare(date, { produs: potrivireMeniu(date, meniu.toate())?.produs ?? null, profil, acum });
    }
    const comanda = comenzi.adauga({ ...date, ...ciclu, ...campuriCalculate(date, meniu.toate()) });
    if (cheie) cheiComenzi.salveaza(cheie, req.body, comanda);
    res.status(201).json(comanda);
  });

  router.patch("/:id", (req, res) => {
    const id = parseId(req.params.id);
    const existenta = gasesteSau404(comenzi, id, NU_EXISTA);
    const schimbari = modificareComanda(existenta, dateValide(valideazaComanda(req.body, { partial: true })), { livratori: livratori.toate() });
    const rezultat = { ...existenta, ...schimbari };
    if (Object.hasOwn(schimbari, "preparat") || Object.hasOwn(schimbari, "restaurant")) Object.assign(schimbari, campuriCalculate(rezultat, meniu.toate()));
    else if (Object.hasOwn(schimbari, "pret") && potrivireMeniu(rezultat, meniu.toate())) delete schimbari.pret;
    res.json(comenzi.modifica(id, schimbari));
  });

  // Alocarea automată (Dispatch): primul livrator disponibil, după regulile din reguli/livrare.js
  router.post("/:id/dispatch", (req, res) => {
    const id = parseId(req.params.id);
    const comanda = gasesteSau404(comenzi, id, NU_EXISTA);
    if (!poateAvansaLivrarea(comanda, "asignata")) throw conflict(mesajPasLivrare(comanda, "asignata"));
    const livrator = alegeLivrator(livratori.toate(), comenzi.toate());
    if (!livrator) throw conflict("Niciun livrator disponibil acum: toți sunt offline, dezactivați sau au deja o cursă în lucru.");
    res.json(comenzi.modifica(id, aplicaPasLivrare(comanda, "asignata", new Date(), { livratorId: livrator.id })));
  });

  router.delete("/:id", (req, res) => {
    const id = parseId(req.params.id);
    gasesteSau404(comenzi, id, NU_EXISTA);
    comenzi.sterge(id);
    res.status(204).end();
  });

  return router;
}
