import { Fish, Hamburger, Pizza } from "lucide-react";

// Categoriile, cu câte o iconiță SVG (aceeași în chips și pe card)
export const CATEGORII = [
  { nume: "Pizza", Icon: Pizza },
  { nume: "Burgers", Icon: Hamburger },
  { nume: "Asian", Icon: Fish },
];

export const ICONITE_CATEGORIE = Object.fromEntries(CATEGORII.map((c) => [c.nume, c.Icon]));
