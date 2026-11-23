// /meniu: preparatele restaurantelor. Id-uri text („p1”), puse de server la POST.
import { Router } from "express";
import { cerereGresita } from "../erori.js";
import { parseIdText } from "../ids.js";
import { valideazaPreparat } from "../validation.js";
import { dateValide, gasesteSau404 } from "./util.js";

const NU_EXISTA = "Preparatul nu există";

// Comenzile se leagă de meniu prin nume, deci un restaurant nu poate avea două preparate cu același nume
function verificaDublura(lista, { preparat, restaurant }, idEditat = null) {
  const nume = preparat.toLowerCase();
  if (lista.some((p) => p.id !== idEditat && p.restaurant === restaurant && typeof p.preparat === "string" && p.preparat.trim().toLowerCase() === nume)) {
    throw cerereGresita("Restaurantul are deja un preparat cu acest nume");
  }
}

export function routerMeniu(store) {
  const router = Router();
  const { meniu } = store;

  router.get("/", (req, res) => {
    res.json(meniu.toate());
  });

  router.get("/:id", (req, res) => {
    res.json(gasesteSau404(meniu, parseIdText(req.params.id), NU_EXISTA));
  });

  router.post("/", (req, res) => {
    const date = dateValide(valideazaPreparat(req.body));
    verificaDublura(meniu.toate(), date);
    res.status(201).json(meniu.adauga(date));
  });

  router.patch("/:id", (req, res) => {
    const id = parseIdText(req.params.id);
    const existent = gasesteSau404(meniu, id, NU_EXISTA);
    const schimbari = dateValide(valideazaPreparat(req.body, { partial: true }));
    if (Object.hasOwn(schimbari, "preparat") || Object.hasOwn(schimbari, "restaurant")) verificaDublura(meniu.toate(), { ...existent, ...schimbari }, id);
    res.json(meniu.modifica(id, schimbari));
  });

  router.delete("/:id", (req, res) => {
    const id = parseIdText(req.params.id);
    gasesteSau404(meniu, id, NU_EXISTA);
    meniu.sterge(id);
    res.status(204).end();
  });

  return router;
}
