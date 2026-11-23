// /restaurante: profilul și programul fiecărui restaurant. Id-ul e slug-ul restaurantului („pizzeria-napoli”),
// ales de client la POST; PUT înlocuiește tot profilul, PATCH doar câmpurile trimise.
import { Router } from "express";
import { RESTAURANTE } from "../constants.js";
import { cerereGresita, conflict } from "../erori.js";
import { parseSlug } from "../ids.js";
import { valideazaProfilRestaurant } from "../validation.js";
import { dateValide, gasesteSau404 } from "./util.js";

const NU_EXISTA = "Restaurantul nu există";

// Doar restaurantele aplicației pot avea profil
function slugCunoscut(slug) {
  if (!RESTAURANTE.some((r) => r.slug === slug)) throw cerereGresita(`id trebuie să fie slug-ul unui restaurant: ${RESTAURANTE.map((r) => r.slug).join(", ")}`);
  return slug;
}

export function routerRestaurante(store) {
  const router = Router();
  const { restaurante } = store;

  router.get("/", (req, res) => {
    res.json(restaurante.toate());
  });

  router.get("/:id", (req, res) => {
    res.json(gasesteSau404(restaurante, parseSlug(req.params.id), NU_EXISTA));
  });

  router.post("/", (req, res) => {
    const date = dateValide(valideazaProfilRestaurant(req.body));
    const id = slugCunoscut(parseSlug(req.body.id));
    if (restaurante.exista(id)) throw conflict("Restaurantul are deja un profil; folosește PUT /restaurante/:id");
    res.status(201).json(restaurante.adauga(date, id));
  });

  router.put("/:id", (req, res) => {
    const id = parseSlug(req.params.id);
    gasesteSau404(restaurante, id, NU_EXISTA);
    res.json(restaurante.inlocuieste(id, dateValide(valideazaProfilRestaurant(req.body))));
  });

  router.patch("/:id", (req, res) => {
    const id = parseSlug(req.params.id);
    gasesteSau404(restaurante, id, NU_EXISTA);
    res.json(restaurante.modifica(id, dateValide(valideazaProfilRestaurant(req.body, { partial: true }))));
  });

  router.delete("/:id", (req, res) => {
    const id = parseSlug(req.params.id);
    gasesteSau404(restaurante, id, NU_EXISTA);
    restaurante.sterge(id);
    res.status(204).end();
  });

  return router;
}
