// /comenzi: resursa din tw.json. Id-uri numerice, puse de server.
import { Router } from "express";
import { parseId } from "../ids.js";
import { campuriCalculate, potrivireMeniu } from "../reguli/comenzi.js";
import { valideazaComanda } from "../validation.js";
import { dateValide, gasesteSau404 } from "./util.js";

const NU_EXISTA = "Comanda nu există";

export function routerComenzi(store) {
  const router = Router();
  const { comenzi, meniu } = store;

  router.get("/", (req, res) => {
    res.json(comenzi.toate());
  });

  router.get("/:id", (req, res) => {
    res.json(gasesteSau404(comenzi, parseId(req.params.id), NU_EXISTA));
  });

  router.post("/", (req, res) => {
    const date = dateValide(valideazaComanda(req.body));
    const comanda = comenzi.adauga({ ...date, ...campuriCalculate(date, meniu.toate()) });
    res.status(201).json(comanda);
  });

  router.patch("/:id", (req, res) => {
    const id = parseId(req.params.id);
    const existenta = gasesteSau404(comenzi, id, NU_EXISTA);
    const schimbari = dateValide(valideazaComanda(req.body, { partial: true }));
    const rezultat = { ...existenta, ...schimbari };
    if (Object.hasOwn(schimbari, "preparat") || Object.hasOwn(schimbari, "restaurant")) Object.assign(schimbari, campuriCalculate(rezultat, meniu.toate()));
    else if (Object.hasOwn(schimbari, "pret") && potrivireMeniu(rezultat, meniu.toate())) delete schimbari.pret;
    res.json(comenzi.modifica(id, schimbari));
  });

  router.delete("/:id", (req, res) => {
    const id = parseId(req.params.id);
    gasesteSau404(comenzi, id, NU_EXISTA);
    comenzi.sterge(id);
    res.status(204).end();
  });

  return router;
}
