import { useEffect, useRef, useState } from "react"; // hook-urile React: useState pentru date care se schimbă, useEffect pentru efecte secundare, useRef pentru titlul meniului
import { MapPin, Moon, Search, ShoppingBag, Sun } from "lucide-react"; // iconițele din header
import BonComanda from "./components/BonComanda.jsx"; // „bonul” din zona hero
import ComandaList from "./components/ComandaList.jsx"; // lista de comenzi
import ConfirmDialog from "./components/ConfirmDialog.jsx"; // dialogul de confirmare a ștergerii
import CosDrawer from "./components/CosDrawer.jsx"; // panoul lateral al coșului
import Logo from "./components/Logo.jsx"; // logo-ul Savoro
import Meniu from "./components/Meniu.jsx"; // grila de preparate
import UndoToast from "./components/UndoToast.jsx"; // mesajul cu „Anulează” și confirmarea comenzii
import { CATEGORII } from "./categorii.js"; // lista de categorii
import { adaugaInCos, citesteCos, cosInComenzi, liniiCos, numarProduse, schimbaCantitate, scoateDinCos, totalCos } from "./cos.js"; // logica pură a coșului
import { formatComenzi, formatLei, formatProduse } from "./format.js"; // funcții de formatare a textelor
import { MENIU } from "./meniu.js"; // preparatele care se pot comanda
import { cuTranzitie } from "./tranzitie.js"; // învelește actualizările de state într-o animație

// Datele temei, aceleași ca în README (doar valoarea inițială)
const COMENZI_INITIALE = [ // definită în afara componentei, ca să nu fie recreată la fiecare randare
  { id: 1, preparat: "Pizza Margherita", livrata: false, livrare: "express", categorie: "Pizza", restaurant: "Pizzeria Napoli", pret: 42 }, // prima comandă
  { id: 2, preparat: "Burger de vită cu cartofi", livrata: true, livrare: "standard", categorie: "Burgers", restaurant: "Burger Van", pret: 48 }, // a doua comandă (deja livrată)
  { id: 3, preparat: "Platou sushi (12 buc.)", livrata: false, livrare: "ridicare", categorie: "Asian", restaurant: "Sushi Kyo", pret: 65 }, // a treia comandă
]; // sfârșitul listei

// Tema de pornire: cea aleasă data trecută, altfel cea a sistemului de operare.
// Scriptul din index.html pune aceeași temă pe <html> înainte de React, ca pagina să nu clipească.
function temaInitiala() { // funcție apelată o singură dată, la prima randare
  try { // localStorage poate arunca eroare în unele browsere
    const salvata = localStorage.getItem("tema"); // citim tema salvată anterior
    if (salvata === "light" || salvata === "dark") return salvata; // o folosim doar dacă e o valoare validă
  } catch { // prindem eroarea
    // fără acces la localStorage (mod privat): rămâne tema sistemului
  } // sfârșitul try/catch
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; // altfel, preferința sistemului de operare
} // sfârșitul funcției

// Coșul de pornire: cel salvat data trecută, verificat de citesteCos (textul din localStorage nu e de încredere)
function cosInitial() { // funcție apelată o singură dată, la prima randare
  try { // localStorage poate arunca eroare în unele browsere
    return citesteCos(localStorage.getItem("cos"), MENIU); // coșul salvat, doar cu liniile valide
  } catch { // fără acces la localStorage
    return []; // pornim cu un coș gol
  } // sfârșitul try/catch
} // sfârșitul funcției

export default function App() { // componenta principală; deține tot state-ul
  const [comenzi, setComenzi] = useState(COMENZI_INITIALE); // lista de comenzi + funcția care o înlocuiește
  const [tema, setTema] = useState(temaInitiala); // pasăm funcția (nu rezultatul): React o apelează doar la prima randare
  // id-ul comenzii care așteaptă confirmarea ștergerii (null = dialog închis)
  const [deSters, setDeSters] = useState(null); // state pentru dialogul de confirmare
  // ultima comandă ștearsă și locul ei în listă, pentru „Anulează” (null = mesaj ascuns)
  const [ultimaStearsa, setUltimaStearsa] = useState(null); // state pentru toast-ul de undo
  const [cos, setCos] = useState(cosInitial); // liniile coșului: [{ produsId, cantitate }]; inițializare leneșă, ca la temă
  const [cosDeschis, setCosDeschis] = useState(false); // panoul coșului e deschis?
  // ultima comandă plasată, pentru mesajul de confirmare (null = ascuns); obiect nou la fiecare plasare, ca timer-ul să repornească
  const [confirmare, setConfirmare] = useState(null); // state pentru toast-ul de confirmare
  const meniuTitluRef = useRef(null); // titlul secțiunii „Meniu”, ca să-i putem da focus din coșul gol

  // Mesajul cu „Anulează” dispare singur după 5 secunde
  useEffect(() => { // rulează după fiecare randare în care `ultimaStearsa` s-a schimbat
    if (!ultimaStearsa) return; // nu e nimic de ascuns
    const timer = setTimeout(() => setUltimaStearsa(null), 5000); // ascundem mesajul după 5 secunde
    return () => clearTimeout(timer); // cleanup: anulăm timer-ul dacă se șterge altă comandă între timp
  }, [ultimaStearsa]); // lista de dependențe

  // Confirmarea comenzii dispare tot după 5 secunde
  useEffect(() => { // rulează când apare o confirmare nouă
    if (!confirmare) return; // nu e nimic de ascuns
    const timer = setTimeout(() => setConfirmare(null), 5000); // ascundem mesajul după 5 secunde
    return () => clearTimeout(timer); // cleanup: o plasare nouă repornește numărătoarea
  }, [confirmare]); // lista de dependențe

  // Coșul se păstrează între vizite: îl scriem în localStorage după fiecare schimbare
  useEffect(() => { // efect secundar: sincronizăm state-ul cu un sistem din afara React
    try { // scrierea poate eșua (mod privat, spațiu plin)
      localStorage.setItem("cos", JSON.stringify(cos)); // salvăm lista ca text JSON
    } catch { // prindem eroarea
      // coșul nu se poate păstra; aplicația merge în continuare
    } // sfârșitul try/catch
  }, [cos]); // doar când se schimbă coșul

  // Actualizare imutabilă: listă nouă, obiect nou pentru comanda schimbată
  function handleToggleLivrata(id) { // primește id-ul comenzii bifate
    cuTranzitie(() => // animăm schimbarea
      setComenzi((prev) => // forma cu funcție: primim valoarea cea mai recentă a state-ului
        prev.map((c) => (c.id === id ? { ...c, livrata: !c.livrata } : c)) // copie a comenzii cu `livrata` inversat; restul rămân la fel
      ) // sfârșitul setComenzi
    ); // sfârșitul cuTranzitie
  } // sfârșitul funcției

  function handleDelete(id) { // apelată când utilizatorul confirmă ștergerea
    const index = comenzi.findIndex((c) => c.id === id); // poziția comenzii, ca s-o putem pune la loc
    setDeSters(null); // închidem dialogul
    setUltimaStearsa({ comanda: comenzi[index], index }); // memorăm comanda și poziția pentru undo
    cuTranzitie(() => setComenzi((prev) => prev.filter((c) => c.id !== id))); // listă nouă, fără comanda ștearsă
  } // sfârșitul funcției

  // „Anulează”: comanda revine pe locul ei, tot într-o listă nouă
  function handleUndo() { // apelată de butonul din toast
    const { comanda, index } = ultimaStearsa; // destructurăm ce am salvat la ștergere
    setUltimaStearsa(null); // ascundem toast-ul
    cuTranzitie(() => // animăm reapariția
      setComenzi((prev) => [...prev.slice(0, index), comanda, ...prev.slice(index)]) // inserăm comanda între bucata dinainte și cea de după
    ); // sfârșitul cuTranzitie
  } // sfârșitul funcției

  // Coșul: toate schimbările trec prin funcțiile pure din cos.js, cu forma setCos((prev) => ...)
  function handleAdauga(produsId) { // „Adaugă” din meniu
    setCos((prev) => adaugaInCos(prev, produsId)); // listă nouă cu produsul adăugat (sau cu +1)
  } // sfârșitul funcției

  function handleSchimbaCantitate(produsId, delta) { // „−” / „+” din meniu sau din coș
    setCos((prev) => schimbaCantitate(prev, produsId, delta)); // listă nouă; la 0 linia dispare
  } // sfârșitul funcției

  function handleScoate(produsId) { // coșul de gunoi din coș
    setCos((prev) => scoateDinCos(prev, produsId)); // listă nouă, fără linie
  } // sfârșitul funcției

  // Plasarea: fiecare linie din coș devine o comandă nouă „pe drum”, apoi coșul se golește
  function handlePlaseaza(livrare) { // primește tipul de livrare ales în coș
    if (linii.length === 0) return; // nimic de plasat (butonul nici nu apare când coșul e gol)
    setUltimaStearsa(null); // închidem „Anulează”: o comandă readusă după plasare ar putea primi același id ca una nouă
    setCosDeschis(false); // închidem panoul
    setConfirmare({ produse: produseInCos, total: totalDePlata }); // mesajul de confirmare, cu valorile de dinainte de golire
    setCos([]); // golim coșul imediat, nu în animație: butonul coșului (care primește focusul) arată deja 0
    cuTranzitie(() => setComenzi((prev) => cosInComenzi(linii, prev, livrare))); // doar lista de comenzi e animată; `linii` vine din randarea curentă, deci golirea de mai sus nu o afectează
  } // sfârșitul funcției

  // „Vezi meniul” din coșul gol: panoul s-a închis deja, ducem utilizatorul la meniu
  function handleVeziMeniul() { // apelată de CosDrawer
    setCosDeschis(false); // state-ul urmează dialogul închis
    const titlu = meniuTitluRef.current; // titlul secțiunii „Meniu”
    const fluid = !window.matchMedia("(prefers-reduced-motion: reduce)").matches; // derulare lină doar dacă nu s-au cerut mai puține animații
    titlu.focus({ preventScroll: true }); // focus pe titlu (cititorul de ecran anunță „Meniu”), fără salt brusc
    titlu.scrollIntoView({ behavior: fluid ? "smooth" : "auto", block: "start" }); // derulăm până la meniu
  } // sfârșitul funcției

  // Comutarea temei: state-ul pentru buton, atributul data-theme pentru CSS
  function handleTema() { // apelată de butonul de temă
    const noua = tema === "dark" ? "light" : "dark"; // tema opusă celei curente
    cuTranzitie(() => { // animăm schimbarea culorilor
      setTema(noua); // actualizăm state-ul (iconița și textul butonului)
      document.documentElement.dataset.theme = noua; // setăm data-theme pe <html>; CSS-ul schimbă variabilele de culoare
    }); // sfârșitul cuTranzitie
    try { // salvarea poate eșua
      localStorage.setItem("tema", noua); // reținem alegerea pentru vizita următoare
    } catch { // prindem eroarea
      // alegerea nu se poate păstra; tema se schimbă oricum
    } // sfârșitul try/catch
  } // sfârșitul funcției

  // Valori derivate: se recalculează la fiecare randare
  const peDrum = comenzi.filter((c) => !c.livrata).length; // câte comenzi nu sunt livrate
  const livrate = comenzi.length - peDrum; // restul sunt livrate
  const total = comenzi.reduce((suma, c) => suma + c.pret, 0); // suma tuturor prețurilor
  const comandaDeSters = comenzi.find((c) => c.id === deSters) ?? null; // obiectul comenzii din dialog (sau null)
  const linii = liniiCos(cos, MENIU); // coșul unit cu meniul: preparat, preț, cantitate, subtotal
  const produseInCos = numarProduse(cos); // numărul de pe butonul coșului
  const totalDePlata = totalCos(linii); // totalul coșului

  return ( // JSX-ul paginii
    <>{/* Fragment: mai multe elemente de nivel superior fără un <div> în plus */}
      <header className="app-header">{/* bara de sus */}
        <div className="wrap header-inner">{/* containerul centrat */}
          <h1 className="logo">{/* titlul principal al paginii */}
            <Logo />{/* iconița SVG */}
            Savoro{/* numele aplicației */}
          </h1>
          <span className="address-pill"><MapPin size={16} aria-hidden="true" />Livrare acasă · Acum</span>{/* adresa (doar decorativă deocamdată) */}
          <label className="search">{/* câmpul de căutare */}
            <Search size={18} aria-hidden="true" />{/* iconița lupă */}
            <input type="search" placeholder="Caută preparate sau restaurante" aria-label="Caută" />{/* inputul (încă fără logică) */}
          </label>
          <button // butonul de temă
            className="theme-toggle" // clasa pentru stiluri
            onClick={handleTema} // pasăm funcția (fără paranteze), nu o apelăm aici
            aria-pressed={tema === "dark"} // buton de tip comutator: anunță dacă modul întunecat e activ
          >
            {tema === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}{/* iconița depinde de tema curentă */}
            <span className="theme-label">{tema === "dark" ? "Mod luminos" : "Mod întunecat"}</span>{/* textul arată ce se întâmplă la clic */}
          </button>
          <button // butonul coșului (comenzile pe drum rămân în banda de rezumat)
            type="button" // buton simplu
            className="cart-pill" // clasa pentru stiluri
            onClick={() => setCosDeschis(true)} // deschidem panoul
            aria-haspopup="dialog" // anunță că butonul deschide un dialog
            aria-label={`Coș: ${formatProduse(produseInCos)}`} // ex. „Coș: 3 produse”
          >
            <ShoppingBag size={18} aria-hidden="true" />{/* iconița sacoșă */}
            {produseInCos > 0 && <span key={produseInCos} className="cart-count bump">{produseInCos}</span>}{/* key = valoarea: la fiecare schimbare elementul e nou și animația pornește; ascuns la 0 */}
          </button>
        </div>
      </header>

      <section className="hero">{/* zona mare de sus */}
        <div className="wrap hero-inner">{/* containerul centrat */}
          <div>{/* coloana cu texte */}
            <span className="eyebrow">Comenzile tale</span>{/* supratitlul mic */}
            <h2 className="display">Toate comenzile tale de mâncare, <em>într-un singur loc</em>.</h2>{/* titlul mare */}
            <p className="app-count">{/* numărătoarea */}
              {formatComenzi(comenzi.length)}, dintre care {peDrum} pe drum{/* ex. „3 comenzi, dintre care 2 pe drum” */}
            </p>
          </div>
          <BonComanda comenzi={comenzi} />{/* bonul primește lista prin props */}
        </div>
      </section>

      {/* key = valoarea: când cifra se schimbă, elementul e randat din nou și animația pornește */}
      <section className="proof" aria-label="Rezumat">{/* banda cu statistici */}
        <div className="wrap proof-inner">{/* containerul centrat */}
          <div className="proof-stat"><strong key={total} className="tick">{formatLei(total)}</strong><span>cheltuiți luna asta</span></div>{/* totalul cheltuit */}
          <span className="proof-sep" aria-hidden="true" />{/* separator vizual */}
          <div className="proof-stat"><strong key={peDrum} className="tick">{peDrum}</strong><span>pe drum</span></div>{/* comenzi pe drum */}
          <span className="proof-sep" aria-hidden="true" />{/* separator vizual */}
          <div className="proof-stat"><strong key={`${livrate}/${comenzi.length}`} className="tick">{livrate} din {comenzi.length}</strong><span>livrate</span></div>{/* comenzi livrate din total */}
        </div>
      </section>

      <main className="wrap main">{/* conținutul principal */}
        <Meniu // grila de preparate, deasupra comenzilor
          meniu={MENIU} // datele meniului
          cos={cos} // ca fiecare card să-și știe cantitatea
          onAdauga={handleAdauga} // „Adaugă”
          onSchimba={handleSchimbaCantitate} // „−” / „+”
          titluRef={meniuTitluRef} // referința către titlu
        />
        <div className="section-header">{/* titlul secțiunii */}
          <h2>Comenzile mele</h2>{/* textul titlului */}
          <span className="section-meta">{formatComenzi(comenzi.length)}</span>{/* numărul total de comenzi */}
        </div>
        <ul className="categories" aria-label="Categorii">{/* lista de categorii */}
          {CATEGORII.map((cat) => ( // un <li> pentru fiecare categorie
            <li key={cat.nume}>{/* numele e unic, deci bun ca key */}
              <cat.Icon size={16} aria-hidden="true" />{/* componenta iconiței, luată din obiect */}
              {cat.nume}{/* numele categoriei */}
              <span className="cat-count">{comenzi.filter((c) => c.categorie === cat.nume).length}</span>{/* câte comenzi are categoria */}
            </li>
          ))}{/* sfârșitul map-ului */}
        </ul>
        <ComandaList // lista de comenzi
          comenzi={comenzi} // datele coboară prin props
          onToggle={handleToggleLivrata} // evenimentele urcă prin callback-uri
          onDelete={setDeSters} // nu ștergem direct: doar marcăm comanda și se deschide dialogul
        />
      </main>

      <ConfirmDialog // dialogul de confirmare
        comanda={comandaDeSters} // null = închis, obiect = deschis
        onConfirm={handleDelete} // ștergerea efectivă
        onCancel={() => setDeSters(null)} // renunțare: închidem dialogul
      />
      <CosDrawer // panoul coșului
        deschis={cosDeschis} // false = închis
        linii={linii} // liniile calculate mai sus
        onClose={() => setCosDeschis(false)} // X, Esc sau clic pe fundal
        onSchimba={handleSchimbaCantitate} // „−” / „+”
        onScoate={handleScoate} // coșul de gunoi
        onPlaseaza={handlePlaseaza} // „Plasează comanda”
        onVeziMeniul={handleVeziMeniul} // din coșul gol
      />
      <UndoToast stearsa={ultimaStearsa} onUndo={handleUndo} confirmare={confirmare} />{/* mesajul cu „Anulează” și confirmarea comenzii */}

      <footer className="app-footer">{/* subsolul paginii */}
        <div className="wrap footer-inner">{/* containerul centrat */}
          <p>© Savoro · Proiect Tehnologii Web · UNSTPB 2026–2027</p>{/* textul de copyright */}
        </div>
      </footer>
    </>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
