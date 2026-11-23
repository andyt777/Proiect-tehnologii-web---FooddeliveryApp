// /recenzii: o recenzie pentru fiecare comandă livrată. Id-uri numerice, puse de server.
import { Router } from "express";
import { cerereGresita, conflict } from "../erori.js";
import { parseId } from "../ids.js";
import { valideazaRecenzie } from "../validation.js";
import { dateValide, gasesteSau404 } from "./util.js";

const NU_EXISTA = "Recenzia nu există";

export function routerRecenzii(store) {
  const router = Router();
  const { recenzii, comenzi } = store;

  router.get("/", (req, res) => {
    res.json(recenzii.toate());
  });

  router.get("/:id", (req, res) => {
    res.json(gasesteSau404(recenzii, parseId(req.params.id), NU_EXISTA));
  });

  router.post("/", (req, res) => {
    const date = dateValide(valideazaRecenzie(req.body));
    const comanda = comenzi.gaseste(date.comandaId);
    if (!comanda) throw cerereGresita("Comanda recenzată nu există");
    if (comanda.livrata !== true) throw cerereGresita("Doar o comandă livrată poate primi o recenzie");
    if (recenzii.toate().some((r) => String(r.comandaId) === String(date.comandaId))) throw conflict("Comanda are deja o recenzie");
    const { comandaId, ...rest } = date;
    res.status(201).json(recenzii.adauga({ comandaId, restaurant: comanda.restaurant, ...rest }));
  });

  // Se pot schimba doar nota și textul; comanda și restaurantul rămân cele de la creare
  router.patch("/:id", (req, res) => {
    const id = parseId(req.params.id);
    gasesteSau404(recenzii, id, NU_EXISTA);
    const date = dateValide(valideazaRecenzie(req.body, { partial: true }));
    const schimbari = {};
    if (Object.hasOwn(date, "nota")) schimbari.nota = date.nota;
    if (Object.hasOwn(date, "text")) schimbari.text = date.text;
    if (Object.keys(schimbari).length === 0) throw cerereGresita("Se pot modifica doar nota și text");
    res.json(recenzii.modifica(id, schimbari));
  });

  router.delete("/:id", (req, res) => {
    const id = parseId(req.params.id);
    gasesteSau404(recenzii, id, NU_EXISTA);
    recenzii.sterge(id);
    res.status(204).end();
  });

  return router;
}
