import { useEffect, useState } from "react"; // useState: tema, sertarul, regiunea mesajelor; useEffect: derularea la schimbarea paginii
import { Link, NavLink, Outlet, useLocation, useNavigate, useNavigationType } from "react-router-dom"; // navigarea fără reîncărcarea paginii
import { Bike, Heart, House, Info, LayoutDashboard, Moon, ShoppingBag, Store, Sun, UserRound } from "lucide-react"; // iconițele navigației și ale butoanelor
import Logo from "./Logo.jsx"; // semnul Savoro
import ComutatorRol from "./ComutatorRol.jsx"; // pachetul B: comutatorul de roluri (demo)
import { ETICHETE_ROL, RUTE_ROL } from "../rol.js"; // textele și paginile rolurilor
import CosDrawer from "./CosDrawer.jsx"; // sertarul coșului, disponibil pe toate paginile
import { RegiuneToast, ToastConfirmare, ToastNotificari } from "./UndoToast.jsx"; // mesajele de jos
import { useStareMagazin } from "../magazin.js"; // meniul, coșul, favoritele, livrarea, confirmarea
import { useUrmarireComenzi } from "../urmarireComenzi.js"; // fluxul complet: notificările despre starea comenzilor
import { numarProduse } from "../cos.js"; // numărul de pe butonul coșului
import { formatProduse } from "../format.js"; // „3 produse”
import { cuTranzitie } from "../tranzitie.js"; // schimbarea temei, cu o trecere lină
import styles from "./Layout.module.css"; // Etapa 8: stilurile layout-ului (CSS Modules)

// Etapa 8: layout-ul comun tuturor paginilor: antetul, locul paginii (<Outlet />) și subsolul.
// Redesign „Pădure”: Layout ține și starea comună (meniu, coș, favorite), ca paginile noi s-o poată folosi;
// sertarul coșului și mesajele de jos sunt aici, deci funcționează pe orice pagină.

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

// Pachetul B: iconița linkului fiecărui rol din navigație (clientul nu are link în plus)
const ICONITE_ROL = { restaurant: Store, livrator: Bike, admin: LayoutDashboard }; // cheia = rolul

// NavLink transmite isActive; linkul activ primește și clasa „active” (aria-current="page" îl pune NavLink singur)
function navClass({ isActive }) { // primește starea linkului de la NavLink
  return isActive ? `${styles.link} ${styles.active}` : styles.link; // marcarea paginii curente
} // sfârșitul funcției

export default function Layout() { // componenta layout-ului, folosită ca element al rutei-părinte din App.jsx
  const [tema, setTema] = useState(temaInitiala); // pasăm funcția (nu rezultatul): React o apelează doar la prima randare
  const [cosDeschis, setCosDeschis] = useState(false); // sertarul coșului e deschis?
  const [regiuneToast, setRegiuneToast] = useState(null); // elementul DOM al mesajelor de jos (pentru portalul din ComenziPage)
  const magazin = useStareMagazin(); // starea comună a paginilor
  const { notificari, inchideNotificare, noteazaComanda, laSchimbariComenzi } = useUrmarireComenzi(); // fluxul complet: urmărirea comenzilor în curs
  const { pathname, hash, key } = useLocation(); // adresa curentă; key e nou la fiecare navigare, chiar spre aceeași adresă
  const tipNavigare = useNavigationType(); // „PUSH” (link), „REPLACE” sau „POP” (Înapoi / Înainte / prima încărcare)
  const navigate = useNavigate(); // navigare din cod (din sertarul gol)

  // La un link nou pagina pornește de sus; cu „#ancoră”, derulăm la ea și, dacă e un titlu cu tabIndex -1, îi dăm focus.
  // La Înapoi / Înainte (POP) nu atingem derularea: o gestionează browserul.
  useEffect(() => { // rulează după ce pagina nouă a fost desenată
    if (tipNavigare === "POP") return; // prima încărcare sau butoanele browserului
    const tinta = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; // elementul ancorei (sau null)
    if (!tinta) { window.scrollTo(0, 0); return; } // fără ancoră: începutul paginii
    tinta.scrollIntoView(); // ex. „/#comenzi” după plasarea comenzii
    if (tinta.getAttribute("tabindex") === "-1") tinta.focus({ preventScroll: true }); // titlurile de secțiune primesc focus
  }, [pathname, hash, key, tipNavigare]); // la fiecare navigare

  // Comutarea temei: state-ul pentru buton, atributul data-theme pentru CSS
  function handleTema() { // apelată de butonul de temă
    const noua = tema === "dark" ? "light" : "dark"; // tema opusă celei curente
    cuTranzitie(() => { // animăm schimbarea culorilor
      setTema(noua); // actualizăm state-ul (iconița și textul butonului)
      document.documentElement.dataset.theme = noua; // CSS-ul schimbă variabilele de culoare
    }); // sfârșitul cuTranzitie
    try { // salvarea poate eșua
      localStorage.setItem("tema", noua); // reținem alegerea pentru vizita următoare
    } catch { // prindem eroarea
      // alegerea nu se poate păstra; tema se schimbă oricum
    } // sfârșitul try/catch
  } // sfârșitul funcției

  // Pachetul B: alegerea unui rol din comutator duce direct la pagina lui
  function handleRol(nou) { // primește rolul ales
    magazin.setRol(nou); // starea comună (salvată în localStorage)
    navigate(RUTE_ROL[nou]); // „/restaurant”, „/livrator”, „/admin” sau „/”
  } // sfârșitul funcției

  const IconitaRol = ICONITE_ROL[magazin.rol]; // undefined pentru client
  const disponibil = !magazin.incarcareMeniu && !magazin.eroareMeniu; // meniul a sosit, deci știm ce e în coș
  const produseInCos = numarProduse(magazin.linii); // doar produsele care există în meniu
  const etichetaCos = disponibil ? `Coș: ${formatProduse(produseInCos)}` : "Coș (indisponibil momentan)"; // fără meniu nu spunem „0 produse”
  const context = { ...magazin, regiuneToast, noteazaComanda, laSchimbariComenzi }; // ce primesc paginile prin useMagazin(): starea comună, regiunea mesajelor și urmărirea comenzilor

  return ( // JSX-ul layout-ului
    <>{/* Fragment: antetul, conținutul, subsolul, sertarul și mesajele */}
      <a href="#continut" className={styles.skip}>Sari la conținut</a>{/* primul element la Tab: sare peste antet */}
      <header className={`${styles.header} pe-padure`}>{/* bara verde de sus, aceeași pe toate paginile */}
        <div className={`wrap ${styles.inner}`}>{/* containerul centrat */}
          <Link to="/" className={styles.logo}>{/* logo-ul duce la pagina principală */}
            <Logo />{/* semnul */}
            <span>Savoro</span>{/* numele aplicației */}
          </Link>
          <nav className={styles.nav} data-testid="nav" aria-label="Navigare principală">{/* Etapa 8: reperul navigației; pe telefon devine bara de jos */}
            <NavLink to="/" end className={navClass}>{/* end: activ doar pe „/” */}
              <House size={22} aria-hidden="true" className={styles.navIcon} />{/* iconița, doar pe telefon */}
              Acasă{/* textul linkului */}
            </NavLink>
            {IconitaRol && ( // pachetul B: pagina rolului demo ales (restaurant, livrator sau admin)
              <NavLink to={RUTE_ROL[magazin.rol]} className={navClass}>{/* ex. „/restaurant” */}
                <IconitaRol size={22} aria-hidden="true" className={styles.navIcon} />{/* iconița rolului */}
                {ETICHETE_ROL[magazin.rol]}{/* ex. „Restaurant” */}
              </NavLink>
            )}{/* sfârșitul randării condiționate */}
            <NavLink to="/favorite" className={navClass}>{/* preparatele salvate */}
              <Heart size={22} aria-hidden="true" className={styles.navIcon} />{/* iconița */}
              Favorite{/* textul linkului */}
            </NavLink>
            <NavLink to="/cos" className={({ isActive }) => `${navClass({ isActive })} ${styles.doarTelefon}`}>{/* pe telefon, coșul e în bara de jos */}
              <span className={styles.navIconCos}>{/* iconița cu numărul */}
                <ShoppingBag size={22} aria-hidden="true" className={styles.navIcon} />{/* sacoșa */}
                {disponibil && produseInCos > 0 && <span key={produseInCos} className={`${styles.numar} ${styles.bump}`} aria-hidden="true">{produseInCos}</span>}{/* numărul, cu o mică săritură la schimbare */}
              </span>
              Coș{/* textul linkului */}
              {disponibil && produseInCos > 0 && <span className="sr-only">: {formatProduse(produseInCos)}</span>}{/* numărul, pentru cititoarele de ecran */}
            </NavLink>
            <NavLink to="/cont" className={navClass}>{/* fluxul complet: contul (nume, telefon, adrese) */}
              <UserRound size={22} aria-hidden="true" className={styles.navIcon} />{/* iconița */}
              Cont{/* textul linkului */}
            </NavLink>
            <NavLink to="/despre" className={navClass}>{/* pagina de prezentare */}
              <Info size={22} aria-hidden="true" className={styles.navIcon} />{/* iconița */}
              Despre{/* textul linkului */}
            </NavLink>
          </nav>
          <div className={styles.actiuni}>{/* rolul, tema și coșul, în dreapta */}
            <ComutatorRol rol={magazin.rol} onAlege={handleRol} />{/* pachetul B: comutatorul demo, cu nota „nu e securitate” */}
            <button type="button" className={styles.temaBtn} onClick={handleTema} aria-pressed={tema === "dark"}>{/* comutator: anunță dacă modul întunecat e activ */}
              {tema === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}{/* iconița depinde de tema curentă */}
              <span className={styles.temaText}>{tema === "dark" ? "Mod luminos" : "Mod întunecat"}</span>{/* pe telefon doar iconița; textul rămâne pentru cititoare */}
            </button>
            <button type="button" className={styles.cosBtn} onClick={() => setCosDeschis(true)} aria-haspopup="dialog" aria-label={etichetaCos}>{/* deschide sertarul; ascuns pe telefon */}
              <ShoppingBag size={18} aria-hidden="true" />{/* sacoșa */}
              <span aria-hidden="true">Coș</span>{/* textul vizibil; numele complet e în aria-label */}
              {disponibil && produseInCos > 0 && <span key={produseInCos} className={`${styles.numar} ${styles.bump}`} aria-hidden="true">{produseInCos}</span>}{/* key = valoarea: animația pornește la fiecare schimbare */}
            </button>
          </div>
        </div>
      </header>

      <main id="continut" tabIndex={-1} className={`titlu-focus ${styles.main}`}>{/* ținta lui „Sari la conținut”; aici se desenează pagina potrivită adresei */}
        <Outlet context={context} />{/* paginile citesc starea comună cu useMagazin() */}
      </main>

      <footer className={styles.footer}>{/* subsolul paginii */}
        <div className={`wrap ${styles.footerInner}`}>{/* containerul centrat */}
          <p>© Savoro, proiect Tehnologii Web, UNSTPB 2026–2027</p>{/* textul de copyright */}
          <p><Link to="/despre#fotografii">Fotografii de pe Unsplash</Link></p>{/* autorii fotografiilor sunt pe pagina Despre */}
        </div>
      </footer>

      <CosDrawer // sertarul coșului
        deschis={cosDeschis} // false = închis
        linii={magazin.linii} // liniile unite cu meniul
        disponibil={disponibil} // false = meniul nu a sosit, deci nu spunem „Coșul e gol”
        onClose={() => setCosDeschis(false)} // X, Esc sau clic pe fundal
        onSchimba={magazin.schimba} // „−” / „+”
        onScoate={magazin.scoate} // coșul de gunoi
        onVeziMeniul={() => navigate("/#meniu")} // din coșul gol: meniul de pe pagina principală
      />
      <RegiuneToast ref={setRegiuneToast}>{/* regiunea mesajelor; ComenziPage pune aici „Anulează” printr-un portal */}
        <ToastConfirmare confirmare={magazin.confirmare} />{/* „Comanda a fost plasată” */}
        <ToastNotificari notificari={notificari} onInchide={inchideNotificare} />{/* fluxul complet: „Pizza Margherita: În preparare” */}
      </RegiuneToast>
    </>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
