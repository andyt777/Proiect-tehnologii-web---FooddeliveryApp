// /livratori: livratorii demo. Id-uri numerice, puse de server.
import { Router } from "express";
import { cerereGresita, conflict } from "../erori.js";
import { parseId } from "../ids.js";
import { areCursaInLucru } from "../reguli/comenzi.js";
import { valideazaLivrator } from "../validation.js";
import { dateValide, gasesteSau404 } from "./util.js";

const NU_EXISTA = "Livratorul nu există";

function verificaNumeUnic(lista, nume, idEditat = null) {
  if (lista.some((l) => l.id !== idEditat && typeof l.nume === "string" && l.nume.toLowerCase() === nume.toLowerCase())) {
    throw cerereGresita("Există deja un livrator cu acest nume");
  }
}

export function routerLivratori(store) {
  const router = Router();
  const { livratori, comenzi } = store;

  router.get("/", (req, res) => {
    res.json(livratori.toate());
  });

  router.get("/:id", (req, res) => {
    res.json(gasesteSau404(livratori, parseId(req.params.id), NU_EXISTA));
  });

  router.post("/", (req, res) => {
    const date = dateValide(valideazaLivrator(req.body));
    verificaNumeUnic(livratori.toate(), date.nume);
    res.status(201).json(livratori.adauga(date));
  });

  router.patch("/:id", (req, res) => {
    const id = parseId(req.params.id);
    gasesteSau404(livratori, id, NU_EXISTA);
    const schimbari = dateValide(valideazaLivrator(req.body, { partial: true }));
    if (Object.hasOwn(schimbari, "nume")) verificaNumeUnic(livratori.toate(), schimbari.nume, id);
    res.json(livratori.modifica(id, schimbari));
  });

  router.delete("/:id", (req, res) => {
    const id = parseId(req.params.id);
    gasesteSau404(livratori, id, NU_EXISTA);
    if (areCursaInLucru(comenzi.toate(), id)) throw conflict("Livratorul are o cursă în lucru și nu poate fi șters");
    livratori.sterge(id);
    res.status(204).end();
  });

  return router;
}
