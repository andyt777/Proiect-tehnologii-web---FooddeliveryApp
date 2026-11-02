// Meniul: preparatele care se pot pune în coș. Date simple (fără React), ca să poată fi testate și din Node.
// Id-urile sunt texte („p1”), nu numere, ca să nu se confunde niciodată cu id-urile comenzilor (1, 2, 3...).
export const MENIU = [ // listă exportată, folosită de App, Meniu și coș
  { id: "p1", preparat: "Pizza Margherita", restaurant: "Pizzeria Napoli", categorie: "Pizza", pret: 42 }, // același preparat ca în comanda 1
  { id: "p2", preparat: "Pizza Diavola", restaurant: "Pizzeria Napoli", categorie: "Pizza", pret: 48 }, // pizza picantă
  { id: "p3", preparat: "Pizza Quattro Formaggi", restaurant: "Pizzeria Napoli", categorie: "Pizza", pret: 52 }, // pizza cu patru brânzeturi
  { id: "p4", preparat: "Burger de vită cu cartofi", restaurant: "Burger Van", categorie: "Burgers", pret: 48 }, // același preparat ca în comanda 2
  { id: "p5", preparat: "Burger cu pui crocant", restaurant: "Burger Van", categorie: "Burgers", pret: 39 }, // variantă cu pui
  { id: "p6", preparat: "Burger vegetarian", restaurant: "Burger Van", categorie: "Burgers", pret: 36 }, // variantă fără carne
  { id: "p7", preparat: "Platou sushi (12 buc.)", restaurant: "Sushi Kyo", categorie: "Asian", pret: 65 }, // același preparat ca în comanda 3
  { id: "p8", preparat: "Ramen cu porc", restaurant: "Sushi Kyo", categorie: "Asian", pret: 44 }, // supă japoneză
  { id: "p9", preparat: "Gyoza cu legume (6 buc.)", restaurant: "Sushi Kyo", categorie: "Asian", pret: 28 }, // găluște la tigaie
]; // sfârșitul listei
