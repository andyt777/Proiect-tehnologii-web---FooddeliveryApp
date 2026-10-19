import ComandaList from "./components/ComandaList.jsx";

const comenzi = [
  { id: 1, preparat: "Pizza Margherita", livrata: false, livrare: "express", categorie: "Pizza", restaurant: "Pizzeria Napoli", pret: 42 },
  { id: 2, preparat: "Burger de vită cu cartofi", livrata: true, livrare: "standard", categorie: "Burgers", restaurant: "Burger Van", pret: 48 },
  { id: 3, preparat: "Platou sushi (12 buc.)", livrata: false, livrare: "ridicare", categorie: "Asian", restaurant: "Sushi Kyo", pret: 65 },
];

export default function App() {
  const peDrum = comenzi.filter((c) => !c.livrata).length;
  const livrate = comenzi.length - peDrum;
  const total = comenzi.reduce((suma, c) => suma + c.pret, 0);

  return (
    <>
      <header className="app-header">
        <div className="header-inner">
          <h1 className="logo"><span className="logo-mark" aria-hidden="true">S</span>savoro</h1>
          <span className="address-pill">📍 Livrare acasă · Acum</span>
          <label className="search">
            <span aria-hidden="true">🔍</span>
            <input type="search" placeholder="Caută preparate sau restaurante" aria-label="Caută" />
          </label>
          <span className="cart-pill">🛒 {peDrum}</span>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div>
            <h2>Toate comenzile tale de mâncare, într-un singur loc.</h2>
            <p className="app-count">
              {comenzi.length} comenzi, dintre care {peDrum} pe drum
            </p>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="stat-value">{total} lei</span>
              <span className="stat-label">cheltuiți luna asta</span>
            </div>
            <div className="stat">
              <span className="stat-value">{livrate} din {comenzi.length}</span>
              <span className="stat-label">comenzi livrate</span>
            </div>
          </div>
        </div>
        <ul className="categories">
          <li><span className="cat-icon" aria-hidden="true">🍕</span>Pizza</li>
          <li><span className="cat-icon" aria-hidden="true">🍔</span>Burgers</li>
          <li><span className="cat-icon" aria-hidden="true">🍣</span>Asian</li>
        </ul>
      </section>

      <main className="container">
        <section className="panel">
          <h2>Comenzile mele</h2>
          <ComandaList comenzi={comenzi} />
        </section>
      </main>

      <footer className="app-footer">Proiect Tehnologii Web</footer>
    </>
  );
}
