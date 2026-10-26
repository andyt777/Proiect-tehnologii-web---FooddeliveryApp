import { useEffect, useState } from "react";
import { MapPin, Moon, Search, ShoppingBag, Sun } from "lucide-react";
import BonComanda from "./components/BonComanda.jsx";
import ComandaList from "./components/ComandaList.jsx";
import ConfirmDialog from "./components/ConfirmDialog.jsx";
import Logo from "./components/Logo.jsx";
import UndoToast from "./components/UndoToast.jsx";
import { CATEGORII } from "./categorii.js";
import { formatComenzi, formatLei } from "./format.js";
import { cuTranzitie } from "./tranzitie.js";

// Datele temei, aceleași ca în README (doar valoarea inițială)
const COMENZI_INITIALE = [
  { id: 1, preparat: "Pizza Margherita", livrata: false, livrare: "express", categorie: "Pizza", restaurant: "Pizzeria Napoli", pret: 42 },
  { id: 2, preparat: "Burger de vită cu cartofi", livrata: true, livrare: "standard", categorie: "Burgers", restaurant: "Burger Van", pret: 48 },
  { id: 3, preparat: "Platou sushi (12 buc.)", livrata: false, livrare: "ridicare", categorie: "Asian", restaurant: "Sushi Kyo", pret: 65 },
];

// Tema de pornire: cea aleasă data trecută, altfel cea a sistemului de operare.
// Scriptul din index.html pune aceeași temă pe <html> înainte de React, ca pagina să nu clipească.
function temaInitiala() {
  try {
    const salvata = localStorage.getItem("tema");
    if (salvata === "light" || salvata === "dark") return salvata;
  } catch {
    // fără acces la localStorage (mod privat): rămâne tema sistemului
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function App() {
  const [comenzi, setComenzi] = useState(COMENZI_INITIALE);
  const [tema, setTema] = useState(temaInitiala);
  // id-ul comenzii care așteaptă confirmarea ștergerii (null = dialog închis)
  const [deSters, setDeSters] = useState(null);
  // ultima comandă ștearsă și locul ei în listă, pentru „Anulează” (null = mesaj ascuns)
  const [ultimaStearsa, setUltimaStearsa] = useState(null);

  // Mesajul cu „Anulează” dispare singur după 5 secunde
  useEffect(() => {
    if (!ultimaStearsa) return;
    const timer = setTimeout(() => setUltimaStearsa(null), 5000);
    return () => clearTimeout(timer);
  }, [ultimaStearsa]);

  // Actualizare imutabilă: listă nouă, obiect nou pentru comanda schimbată
  function handleToggleLivrata(id) {
    cuTranzitie(() =>
      setComenzi((prev) =>
        prev.map((c) => (c.id === id ? { ...c, livrata: !c.livrata } : c))
      )
    );
  }

  function handleDelete(id) {
    const index = comenzi.findIndex((c) => c.id === id);
    setDeSters(null);
    setUltimaStearsa({ comanda: comenzi[index], index });
    cuTranzitie(() => setComenzi((prev) => prev.filter((c) => c.id !== id)));
  }

  // „Anulează”: comanda revine pe locul ei, tot într-o listă nouă
  function handleUndo() {
    const { comanda, index } = ultimaStearsa;
    setUltimaStearsa(null);
    cuTranzitie(() =>
      setComenzi((prev) => [...prev.slice(0, index), comanda, ...prev.slice(index)])
    );
  }

  // Comutarea temei: state-ul pentru buton, atributul data-theme pentru CSS
  function handleTema() {
    const noua = tema === "dark" ? "light" : "dark";
    cuTranzitie(() => {
      setTema(noua);
      document.documentElement.dataset.theme = noua;
    });
    try {
      localStorage.setItem("tema", noua);
    } catch {
      // alegerea nu se poate păstra; tema se schimbă oricum
    }
  }

  // Valori derivate: se recalculează la fiecare randare
  const peDrum = comenzi.filter((c) => !c.livrata).length;
  const livrate = comenzi.length - peDrum;
  const total = comenzi.reduce((suma, c) => suma + c.pret, 0);
  const comandaDeSters = comenzi.find((c) => c.id === deSters) ?? null;

  return (
    <>
      <header className="app-header">
        <div className="wrap header-inner">
          <h1 className="logo">
            <Logo />
            Savoro
          </h1>
          <span className="address-pill"><MapPin size={16} aria-hidden="true" />Livrare acasă · Acum</span>
          <label className="search">
            <Search size={18} aria-hidden="true" />
            <input type="search" placeholder="Caută preparate sau restaurante" aria-label="Caută" />
          </label>
          <button
            className="theme-toggle"
            onClick={handleTema}
            aria-pressed={tema === "dark"}
          >
            {tema === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
            <span className="theme-label">{tema === "dark" ? "Mod luminos" : "Mod întunecat"}</span>
          </button>
          <span className="cart-pill" aria-label={`${formatComenzi(peDrum)} pe drum`}>
            <ShoppingBag size={18} aria-hidden="true" />
            <span className="cart-count">{peDrum}</span>
          </span>
        </div>
      </header>

      <section className="hero">
        <div className="wrap hero-inner">
          <div>
            <span className="eyebrow">Comenzile tale</span>
            <h2 className="display">Toate comenzile tale de mâncare, <em>într-un singur loc</em>.</h2>
            <p className="app-count">
              {formatComenzi(comenzi.length)}, dintre care {peDrum} pe drum
            </p>
          </div>
          <BonComanda comenzi={comenzi} />
        </div>
      </section>

      {/* key = valoarea: când cifra se schimbă, elementul e randat din nou și animația pornește */}
      <section className="proof" aria-label="Rezumat">
        <div className="wrap proof-inner">
          <div className="proof-stat"><strong key={total} className="tick">{formatLei(total)}</strong><span>cheltuiți luna asta</span></div>
          <span className="proof-sep" aria-hidden="true" />
          <div className="proof-stat"><strong key={peDrum} className="tick">{peDrum}</strong><span>pe drum</span></div>
          <span className="proof-sep" aria-hidden="true" />
          <div className="proof-stat"><strong key={`${livrate}/${comenzi.length}`} className="tick">{livrate} din {comenzi.length}</strong><span>livrate</span></div>
        </div>
      </section>

      <main className="wrap main">
        <div className="section-header">
          <h2>Comenzile mele</h2>
          <span className="section-meta">{formatComenzi(comenzi.length)}</span>
        </div>
        <ul className="categories" aria-label="Categorii">
          {CATEGORII.map((cat) => (
            <li key={cat.nume}>
              <cat.Icon size={16} aria-hidden="true" />
              {cat.nume}
              <span className="cat-count">{comenzi.filter((c) => c.categorie === cat.nume).length}</span>
            </li>
          ))}
        </ul>
        <ComandaList
          comenzi={comenzi}
          onToggle={handleToggleLivrata}
          onDelete={setDeSters}
        />
      </main>

      <ConfirmDialog
        comanda={comandaDeSters}
        onConfirm={handleDelete}
        onCancel={() => setDeSters(null)}
      />
      <UndoToast stearsa={ultimaStearsa} onUndo={handleUndo} />

      <footer className="app-footer">
        <div className="wrap footer-inner">
          <p>© Savoro · Proiect Tehnologii Web · UNSTPB 2026–2027</p>
        </div>
      </footer>
    </>
  );
}
