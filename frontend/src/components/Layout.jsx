import { useEffect, useState } from "react"; // useState: tema aleasă; useEffect: derularea la schimbarea paginii
import { Link, NavLink, Outlet, useLocation, useNavigationType } from "react-router-dom"; // navigarea fără reîncărcarea paginii
import { Moon, Sun } from "lucide-react"; // iconițele butonului de temă
import Logo from "./Logo.jsx"; // semnul Savoro
import { cuTranzitie } from "../tranzitie.js"; // schimbarea temei, cu o trecere lină
import styles from "./Layout.module.css"; // Etapa 8: stilurile layout-ului (CSS Modules)

// Etapa 8: layout-ul comun tuturor paginilor: antetul cu logo, navigație și tema, locul paginii (<Outlet />) și subsolul.
// Tema stă aici (nu în pagina comenzilor), ca butonul să meargă pe toate paginile.

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

// NavLink transmite isActive (adresa curentă se potrivește cu linkul); linkul activ primește și clasa „active”
function navClass({ isActive }) { // primește starea linkului de la NavLink
  return isActive ? `${styles.link} ${styles.active}` : styles.link; // marcarea paginii curente, fără cod scris de mână
} // sfârșitul funcției

export default function Layout() { // componenta layout-ului, folosită ca element al rutei-părinte din App.jsx
  const [tema, setTema] = useState(temaInitiala); // pasăm funcția (nu rezultatul): React o apelează doar la prima randare
  const { pathname, hash } = useLocation(); // adresa curentă, ex. „/comenzi/3” și „#fotografii”
  const tipNavigare = useNavigationType(); // „PUSH” (link), „REPLACE” sau „POP” (Înapoi / Înainte / prima încărcare)

  // La un link nou pagina pornește de sus (fără asta, rămâne derulată cât era pagina veche); cu „#ancoră”, derulăm la ea.
  // La Înapoi / Înainte (POP) nu atingem derularea: o gestionează browserul.
  useEffect(() => { // rulează după ce pagina nouă a fost desenată
    if (tipNavigare === "POP") return; // prima încărcare sau butoanele browserului
    const tinta = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; // elementul ancorei (sau null)
    if (tinta) tinta.scrollIntoView(); // ex. „/despre#fotografii” duce direct la tabelul cu fotografii
    else window.scrollTo(0, 0); // altfel, începutul paginii
  }, [pathname, hash, tipNavigare]); // la fiecare schimbare de adresă

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

  return ( // JSX-ul layout-ului
    <>{/* Fragment: antetul, conținutul și subsolul, fără un <div> în plus */}
      <header className={styles.header}>{/* bara de sus, aceeași pe toate paginile */}
        <div className={`wrap ${styles.inner}`}>{/* containerul centrat („wrap” e clasa globală din index.css) */}
          <h1 className={styles.logo}>{/* titlul principal al aplicației */}
            <Link to="/" className={styles.logoLink}>{/* logo-ul duce la pagina comenzilor, fără reîncărcare */}
              <Logo />{/* iconița SVG */}
              <span className={styles.logoText}>Savoro</span>{/* numele aplicației */}
            </Link>
          </h1>
          <nav className={styles.nav} data-testid="nav" aria-label="Navigare principală">{/* Etapa 8: reperul navigației pentru verificarea automată */}
            <NavLink to="/" end className={navClass}>{/* end: activ doar pe „/”, nu pe orice adresă care începe cu „/” */}
              Comenzi{/* textul linkului */}
            </NavLink>
            <NavLink to="/despre" className={navClass}>{/* pagina de prezentare */}
              Despre{/* textul linkului */}
            </NavLink>
          </nav>
          <button // butonul de temă
            type="button" // buton simplu
            className={styles.themeToggle} // clasa din modul
            onClick={handleTema} // pasăm funcția (fără paranteze), nu o apelăm aici
            aria-pressed={tema === "dark"} // buton de tip comutator: anunță dacă modul întunecat e activ
          >
            {tema === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}{/* iconița depinde de tema curentă */}
            <span className={styles.themeLabel}>{tema === "dark" ? "Mod luminos" : "Mod întunecat"}</span>{/* textul arată ce se întâmplă la clic */}
          </button>
        </div>
      </header>

      <main className={styles.main}>{/* conținutul principal: aici se desenează pagina potrivită adresei */}
        <Outlet />{/* locul paginii curente (ComenziPage, ComandaDetaliuPage, DesprePage sau NotFoundPage) */}
      </main>

      <footer className={styles.footer}>{/* subsolul paginii */}
        <div className={`wrap ${styles.footerInner}`}>{/* containerul centrat */}
          <p>© Savoro · Proiect Tehnologii Web · UNSTPB 2026–2027</p>{/* textul de copyright */}
          <p><Link to="/despre#fotografii">Fotografii: Unsplash</Link></p>{/* Etapa 8: autorii fotografiilor sunt pe pagina Despre */}
        </div>
      </footer>
    </>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
