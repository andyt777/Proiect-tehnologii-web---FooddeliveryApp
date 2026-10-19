import { MapPin, PackageCheck, Search, ShoppingBag, Truck, Wallet } from "lucide-react";
import ComandaList from "./components/ComandaList.jsx";

const comenzi = [
  { id: 1, preparat: "Pizza Margherita", livrata: false, livrare: "express", categorie: "Pizza", restaurant: "Pizzeria Napoli", pret: 42 },
  { id: 2, preparat: "Burger de vită cu cartofi", livrata: true, livrare: "standard", categorie: "Burgers", restaurant: "Burger Van", pret: 48 },
  { id: 3, preparat: "Platou sushi (12 buc.)", livrata: false, livrare: "ridicare", categorie: "Asian", restaurant: "Sushi Kyo", pret: 65 },
];

const CATEGORII = [
  { nume: "Pizza", icon: "🍕" },
  { nume: "Burgers", icon: "🍔" },
  { nume: "Asian", icon: "🍣" },
];

export default function App() {
  const peDrum = comenzi.filter((c) => !c.livrata).length;
  const livrate = comenzi.length - peDrum;
  const total = comenzi.reduce((suma, c) => suma + c.pret, 0);

  return (
    <>
      <header className="app-header">
        <div className="wrap header-inner">
          <h1 className="logo"><span className="logo-mark" aria-hidden="true">S</span>savoro</h1>
          <span className="address-pill"><MapPin size={16} aria-hidden="true" />Livrare acasă · Acum</span>
          <label className="search">
            <Search size={18} aria-hidden="true" />
            <input type="search" placeholder="Caută preparate sau restaurante" aria-label="Caută" />
          </label>
          <span className="cart-pill" aria-label={`${peDrum} comenzi pe drum`}>
            <ShoppingBag size={18} aria-hidden="true" />
            <span className="cart-count">{peDrum}</span>
          </span>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-text">
            <span className="eyebrow"><span className="eyebrow-dot" aria-hidden="true" />Comenzile tale</span>
            <h2>Toate comenzile tale de mâncare, într-un singur loc.</h2>
            <p className="app-count">
              {comenzi.length} comenzi, dintre care {peDrum} pe drum
            </p>
          </div>
          <div className="stats">
            <div className="stat">
              <span className="stat-icon"><Wallet size={20} aria-hidden="true" /></span>
              <span className="stat-value">{total} lei</span>
              <span className="stat-label">cheltuiți luna asta</span>
            </div>
            <div className="stat">
              <span className="stat-icon"><Truck size={20} aria-hidden="true" /></span>
              <span className="stat-value">{peDrum}</span>
              <span className="stat-label">comenzi pe drum</span>
            </div>
            <div className="stat">
              <span className="stat-icon"><PackageCheck size={20} aria-hidden="true" /></span>
              <span className="stat-value">{livrate} din {comenzi.length}</span>
              <span className="stat-label">comenzi livrate</span>
            </div>
          </div>
        </div>
      </section>

      <main className="wrap main">
        <section className="section">
          <div className="section-header">
            <h2>Categorii</h2>
            <span className="section-meta">{CATEGORII.length} categorii</span>
          </div>
          <ul className="categories">
            {CATEGORII.map((cat) => (
              <li key={cat.nume}>
                <span className="cat-icon" aria-hidden="true">{cat.icon}</span>
                {cat.nume}
                <span className="cat-count">{comenzi.filter((c) => c.categorie === cat.nume).length}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Comenzile mele</h2>
            <span className="section-meta">{comenzi.length} comenzi</span>
          </div>
          <ComandaList comenzi={comenzi} />
        </section>
      </main>

      <footer className="app-footer">
        <div className="wrap footer-inner">
          <div className="footer-brand">
            <span className="logo-mark" aria-hidden="true">S</span>
            <div>
              <strong>savoro</strong>
              <p>Proiect Tehnologii Web · UNSTPB 2026–2027</p>
            </div>
          </div>
          <p className="footer-credit">
            Design inspirat din{" "}
            <a href="https://www.figma.com/community" target="_blank" rel="noreferrer">
              „Food app delivery – Mobile App” (Figma Community)
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
