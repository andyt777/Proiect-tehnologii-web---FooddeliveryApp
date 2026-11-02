import { Fish, Hamburger, Pizza } from "lucide-react"; // iconițe SVG ca și componente React

// Categoriile, cu câte o iconiță SVG (aceeași în chips și pe card)
export const CATEGORII = [ // listă exportată, folosită de App pentru „chips”-urile de categorii
  { nume: "Pizza", Icon: Pizza }, // Icon e chiar componenta (nu un string), deci se poate randa ca <cat.Icon />
  { nume: "Burgers", Icon: Hamburger }, // aceeași structură pentru fiecare categorie
  { nume: "Asian", Icon: Fish }, // numele trebuie să coincidă cu câmpul `categorie` din comenzi
]; // sfârșitul listei

export const ICONITE_CATEGORIE = Object.fromEntries(CATEGORII.map((c) => [c.nume, c.Icon])); // transformă lista în obiect { Pizza: Pizza, ... } pentru căutare rapidă după nume
