import { useEffect, useRef, useState } from "react"; // hook-urile React: useState pentru date care se schimbă, useEffect pentru efecte secundare, useRef pentru titlul meniului
import { CircleAlert, MapPin, Moon, RotateCw, Search, ShoppingBag, Sun } from "lucide-react"; // iconițele din header și din mesajul de eroare
import BonComanda from "./components/BonComanda.jsx"; // „bonul” din zona hero
import CautareGoala from "./components/CautareGoala.jsx"; // starea „niciun rezultat” a căutării
import ComandaList from "./components/ComandaList.jsx"; // lista de comenzi
import ConfirmDialog from "./components/ConfirmDialog.jsx"; // dialogul de confirmare a ștergerii
import CosDrawer from "./components/CosDrawer.jsx"; // panoul lateral al coșului
import Logo from "./components/Logo.jsx"; // logo-ul Savoro
import Meniu from "./components/Meniu.jsx"; // grila de preparate
import { ScheletComenzi } from "./components/Schelete.jsx"; // rândurile gri afișate cât se încarcă comenzile
import UndoToast from "./components/UndoToast.jsx"; // mesajul cu „Anulează” și confirmarea comenzii
import { fetchComenzi, fetchMeniu } from "./api.js"; // Etapa 6: datele vin de la server, prin singurul fișier cu fetch
import { CATEGORII } from "./categorii.js"; // lista de categorii
import { normalizeaza, potrivesteCautarea } from "./cautare.js"; // filtrarea după textul din câmpul de căutare
import { adaugaInCos, citesteCos, cosInComenzi, liniiCos, numarProduse, pastreazaDinMeniu, schimbaCantitate, scoateDinCos, totalCos } from "./cos.js"; // logica pură a coșului
import { formatComenzi, formatLei, formatProduse } from "./format.js"; // funcții de formatare a textelor
import { cuTranzitie } from "./tranzitie.js"; // învelește actualizările de state într-o animație

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

// Coșul de pornire: cel salvat data trecută, verificat de citesteCos (textul din localStorage nu e de încredere).
// Etapa 6: aici verificăm doar forma; produsele care nu mai sunt în meniu se scot după ce meniul sosește de la server.
function cosInitial() { // funcție apelată o singură dată, la prima randare
  try { // localStorage poate arunca eroare în unele browsere
    return citesteCos(localStorage.getItem("cos")); // coșul salvat, doar cu liniile bine formate
  } catch { // fără acces la localStorage
    return []; // pornim cu un coș gol
  } // sfârșitul try/catch
} // sfârșitul funcției

export default function App() { // componenta principală; deține tot state-ul
  // Etapa 6: datele nu mai sunt scrise în cod; pornim cu liste goale și le cerem serverului după prima randare
  const [comenzi, setComenzi] = useState([]); // lista de comenzi + funcția care o înlocuiește
  const [meniu, setMeniu] = useState([]); // preparatele care se pot comanda
  const [loading, setLoading] = useState(true); // true cât timp așteptăm răspunsul serverului
  const [error, setError] = useState(null); // mesajul erorii (null = nicio eroare)
  const [reincercari, setReincercari] = useState(0); // crește la „Încearcă din nou”; efectul de încărcare depinde de el
  const [tema, setTema] = useState(temaInitiala); // pasăm funcția (nu rezultatul): React o apelează doar la prima randare
  // id-ul comenzii care așteaptă confirmarea ștergerii (null = dialog închis)
  const [deSters, setDeSters] = useState(null); // state pentru dialogul de confirmare
  // ultima comandă ștearsă și locul ei în listă, pentru „Anulează” (null = mesaj ascuns)
  const [ultimaStearsa, setUltimaStearsa] = useState(null); // state pentru toast-ul de undo
  const [cos, setCos] = useState(cosInitial); // liniile coșului: [{ produsId, cantitate }]; inițializare leneșă, ca la temă
  const [cosDeschis, setCosDeschis] = useState(false); // panoul coșului e deschis?
  // ultima comandă plasată, pentru mesajul de confirmare (null = ascuns); obiect nou la fiecare plasare, ca timer-ul să repornească
  const [confirmare, setConfirmare] = useState(null); // state pentru toast-ul de confirmare
  const [cautare, setCautare] = useState(""); // textul din câmpul de căutare (input controlat)
  const meniuTitluRef = useRef(null); // titlul secțiunii „Meniu”, ca să-i putem da focus din coșul gol
  const cautareRef = useRef(null); // câmpul de căutare, primește focusul după „Șterge căutarea”
  const focusDupaReincercare = useRef(false); // true între clicul pe „Încearcă din nou” și randarea stării de încărcare (ref, nu state: nu trebuie să redeseneze nimic)

  // Etapa 6: încărcarea datelor de la server, după prima randare (și din nou la fiecare „Încearcă din nou”)
  useEffect(() => { // efect secundar: sincronizăm state-ul cu serverul
    let ignore = false; // devine true dacă efectul e anulat (componenta dispare sau pornește o încărcare nouă)
    async function load() { // useEffect nu poate primi direct o funcție async, deci o definim înăuntru
      try { // cererile pot eșua (server oprit, eroare HTTP, timeout)
        const [dateComenzi, dateMeniu] = await Promise.all([fetchComenzi(), fetchMeniu()]); // ambele cereri pornesc în paralel; așteptăm să se termine amândouă
        if (!ignore) { // răspunsul e încă cel dorit
          setComenzi(dateComenzi); // lista de comenzi de la server
          setMeniu(dateMeniu); // meniul de la server
          if (dateMeniu.length > 0) setCos((prev) => pastreazaDinMeniu(prev, dateMeniu)); // scoatem din coșul salvat produsele care nu mai există în meniu; un meniu gol (date stricate) nu golește coșul
        } // sfârșitul if
      } catch (err) { // una dintre cereri a eșuat
        if (!ignore) setError(err.message); // păstrăm doar mesajul (text simplu, ușor de afișat)
      } finally { // rulează și la succes, și la eroare
        if (!ignore) setLoading(false); // gata cu așteptarea, oricum s-a terminat
      } // sfârșitul try/catch/finally
    } // sfârșitul funcției load
    load(); // pornim încărcarea
    return () => { ignore = true; }; // cleanup: un răspuns întârziat nu mai suprascrie state-ul (ex. în StrictMode, efectul rulează de două ori)
  }, [reincercari]); // rulează la prima randare și la fiecare reîncercare

  // „Încearcă din nou”: înapoi la starea de încărcare, fără reîncărcarea paginii
  function handleReincearca() { // apelată de butonul din mesajul de eroare
    focusDupaReincercare.current = true; // butonul apăsat va dispărea; efectul de mai jos mută focusul
    setError(null); // ascundem eroarea veche
    setLoading(true); // arătăm din nou „Se încarcă…” cât timp așteptăm
    setReincercari((n) => n + 1); // dependența efectului se schimbă, deci efectul rulează din nou
  } // sfârșitul funcției

  // După „Încearcă din nou”, panoul de eroare (cu butonul care avea focusul) dispare. Fără asta, focusul ar
  // cădea pe <body> și utilizatorul de tastatură ar o lua de la începutul paginii; îl ducem pe titlul „Meniu”.
  useEffect(() => { // rulează după randarea în care s-a schimbat `loading`
    if (!loading || !focusDupaReincercare.current) return; // doar imediat după o reîncercare
    focusDupaReincercare.current = false; // o singură dată
    meniuTitluRef.current?.focus(); // titlul există și în starea de încărcare
  }, [loading]); // dependența: starea de încărcare

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

  // Actualizare imutabilă: listă nouă, obiect nou pentru comanda schimbată (în Etapa 6 rămâne doar local, se pierde la refresh)
  function handleToggleLivrata(id) { // primește id-ul comenzii bifate
    cuTranzitie(() => // animăm schimbarea
      setComenzi((prev) => // forma cu funcție: primim valoarea cea mai recentă a state-ului
        prev.map((c) => (c.id === id ? { ...c, livrata: !c.livrata } : c)) // copie a comenzii cu `livrata` inversat; restul rămân la fel
      ) // sfârșitul setComenzi
    ); // sfârșitul cuTranzitie
  } // sfârșitul funcției

  function handleDelete(id) { // apelată când utilizatorul confirmă ștergerea
    const index = comenzi.findIndex((c) => c.id === id); // poziția comenzii în lista completă, ca s-o putem pune la loc
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
    if (!titlu) return; // în starea de eroare secțiunea „Meniu” nu e afișată
    const fluid = !window.matchMedia("(prefers-reduced-motion: reduce)").matches; // derulare lină doar dacă nu s-au cerut mai puține animații
    titlu.focus({ preventScroll: true }); // focus pe titlu (cititorul de ecran anunță „Meniu”), fără salt brusc
    titlu.scrollIntoView({ behavior: fluid ? "smooth" : "auto", block: "start" }); // derulăm până la meniu
  } // sfârșitul funcției

  // Căutarea: Esc golește câmpul (în plus față de „×”-ul pe care unele browsere îl pun în input[type=search])
  function handleCautareKeyDown(e) { // tastă apăsată în câmpul de căutare
    if (e.key === "Escape") setCautare(""); // golim textul; lista completă reapare
  } // sfârșitul funcției

  // „Șterge căutarea” din starea fără rezultate: butonul dispare, deci ducem focusul în câmp
  function handleStergeCautarea() { // apelată de CautareGoala
    setCautare(""); // golim textul
    cautareRef.current.focus(); // utilizatorul poate scrie imediat altă căutare
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
  const gata = !loading && !error; // datele au sosit cu bine
  const stare = loading ? "incarcare" : error ? "eroare" : "gata"; // aceeași informație, ca text, pentru bon
  const peDrum = comenzi.filter((c) => !c.livrata).length; // câte comenzi nu sunt livrate
  const livrate = comenzi.length - peDrum; // restul sunt livrate
  const total = comenzi.reduce((suma, c) => suma + c.pret, 0); // suma tuturor prețurilor
  const comandaDeSters = comenzi.find((c) => c.id === deSters) ?? null; // obiectul comenzii din dialog (sau null)
  const linii = liniiCos(cos, meniu); // coșul unit cu meniul: preparat, preț, cantitate, subtotal (gol cât meniul nu a sosit)
  const produseInCos = numarProduse(linii); // numărul de pe butonul coșului, doar din produsele care există în meniu
  const totalDePlata = totalCos(linii); // totalul coșului
  const cautareActiva = normalizeaza(cautare) !== ""; // doar spațiile nu contează ca o căutare
  const textCautat = cautareActiva ? cautare.trim() : ""; // textul afișat în mesaje, fără spațiile de la margini
  const meniuAfisat = meniu.filter((p) => potrivesteCautarea(p, cautare)); // meniul filtrat (tot meniul dacă nu se caută nimic)
  const comenziAfisate = comenzi.filter((c) => potrivesteCautarea(c, cautare)); // comenzile filtrate; contoarele de mai sus rămân pe toată lista
  // în locul cifrelor, cât timp nu avem date: o liniuță vizibilă și un text pentru cititoarele de ecran
  const faraValoare = <><span aria-hidden="true">—</span><span className="sr-only">{loading ? "se încarcă" : "indisponibil"}</span></>; // nu „0 lei”: încă nu știm

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
            <input // inputul controlat: valoarea vine din state
              ref={cautareRef} // ca să-i putem da focus din cod
              type="search" // tastatura de pe telefon arată „Caută”
              placeholder="Caută preparate sau restaurante" // indiciul din câmpul gol
              aria-label="Caută" // nume accesibil (placeholder-ul nu ajunge)
              value={cautare} // componentă controlată
              onChange={(e) => setCautare(e.target.value)} // fiecare tastă actualizează state-ul, iar listele se filtrează la randare
              onKeyDown={handleCautareKeyDown} // Esc golește câmpul
              maxLength={100} // o căutare nu are nevoie de mai mult
            />
          </label>
          <span className="sr-only" role="status">{/* anunță numărul de rezultate, fără să mute focusul */}
            {gata && cautareActiva ? `${formatProduse(meniuAfisat.length)} și ${formatComenzi(comenziAfisate.length)} găsite` : ""}{/* gol când nu se caută */}
          </span>
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
            aria-label={gata ? `Coș: ${formatProduse(produseInCos)}` : "Coș (indisponibil momentan)"} // ex. „Coș: 3 produse”; fără meniu nu știm încă ce e în coș, deci nu spunem „0 produse”
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
            {gata && ( // numărătoarea apare doar când avem datele
              <p className="app-count">{/* numărătoarea */}
                {formatComenzi(comenzi.length)}, dintre care {peDrum} pe drum{/* ex. „3 comenzi, dintre care 2 pe drum” */}
              </p>
            )}{/* sfârșitul randării condiționate */}
            {loading && <p className="app-count" aria-hidden="true"><span className="skeleton skeleton-line skeleton-hero" /></p>}{/* cât se încarcă: o linie gri în locul textului */}
          </div>
          <BonComanda comenzi={comenzi} stare={stare} />{/* bonul primește lista și starea încărcării prin props */}
        </div>
      </section>

      {/* key = valoarea: când cifra se schimbă, elementul e randat din nou și animația pornește */}
      <section className="proof" aria-label="Rezumat" aria-busy={loading}>{/* banda cu statistici */}
        <div className="wrap proof-inner">{/* containerul centrat */}
          <div className="proof-stat"><strong key={gata ? total : stare} className="tick">{gata ? formatLei(total) : faraValoare}</strong><span>cheltuiți luna asta</span></div>{/* totalul cheltuit */}
          <span className="proof-sep" aria-hidden="true" />{/* separator vizual */}
          <div className="proof-stat"><strong key={gata ? peDrum : stare} className="tick">{gata ? peDrum : faraValoare}</strong><span>pe drum</span></div>{/* comenzi pe drum */}
          <span className="proof-sep" aria-hidden="true" />{/* separator vizual */}
          <div className="proof-stat"><strong key={gata ? `${livrate}/${comenzi.length}` : stare} className="tick">{gata ? `${livrate} din ${comenzi.length}` : faraValoare}</strong><span>livrate</span></div>{/* comenzi livrate din total */}
        </div>
      </section>

      <main className="wrap main">{/* conținutul principal */}
        {error ? ( // starea de eroare: un singur mesaj, care spune ce s-a întâmplat și ce e de făcut
          <div className="error">{/* panoul de eroare */}
            <CircleAlert size={22} aria-hidden="true" />{/* iconiță decorativă */}
            <div className="error-body">{/* textul și butonul */}
              <p role="alert">Nu am putut încărca datele: {error}. Rulează <code>npm run api</code>?</p>{/* role="alert": cititorul de ecran îl anunță imediat */}
              <button type="button" className="btn-primary" onClick={handleReincearca}>{/* reîncearcă fără reîncărcarea paginii */}
                <RotateCw size={18} aria-hidden="true" />{/* iconiță decorativă */}
                Încearcă din nou{/* textul butonului */}
              </button>
            </div>
          </div>
        ) : ( // se încarcă sau datele au sosit
          <>{/* Fragment: cele două secțiuni */}
            <Meniu // grila de preparate, deasupra comenzilor
              meniu={meniuAfisat} // preparatele care se potrivesc cu căutarea
              totalMeniu={meniu.length} // câte are meniul întreg, pentru „2 din 9 produse”
              incarcare={loading} // true = schelete în loc de carduri
              cautare={textCautat} // textul căutat ("" = nu se caută)
              onStergeCautarea={handleStergeCautarea} // butonul din starea fără rezultate
              cos={cos} // ca fiecare card să-și știe cantitatea
              onAdauga={handleAdauga} // „Adaugă”
              onSchimba={handleSchimbaCantitate} // „−” / „+”
              titluRef={meniuTitluRef} // referința către titlu
            />
            <section className="orders-section" aria-labelledby="comenzi-titlu" aria-busy={loading}>{/* secțiunea comenzilor */}
              <div className="section-header">{/* titlul secțiunii */}
                <h2 id="comenzi-titlu">Comenzile mele</h2>{/* textul titlului */}
                {gata && ( // numărul apare doar după încărcare
                  <span className="section-meta">{cautareActiva ? `${comenziAfisate.length} din ${formatComenzi(comenzi.length)}` : formatComenzi(comenzi.length)}</span> // la căutare: „1 din 6 comenzi”
                )}{/* sfârșitul randării condiționate */}
              </div>
              {loading ? ( // comenzile nu au sosit încă
                <>{/* mesajul și scheletele */}
                  <p className="info" role="status">Se încarcă comenzile…</p>{/* role="status": textul e anunțat de cititoarele de ecran */}
                  <ScheletComenzi />{/* rânduri gri, doar decor */}
                </>
              ) : ( // datele au sosit
                <>{/* categoriile și lista */}
                  <ul className="categories" aria-label="Categorii">{/* lista de categorii */}
                    {CATEGORII.map((cat) => ( // un <li> pentru fiecare categorie
                      <li key={cat.nume}>{/* numele e unic, deci bun ca key */}
                        <cat.Icon size={16} aria-hidden="true" />{/* componenta iconiței, luată din obiect */}
                        {cat.nume}{/* numele categoriei */}
                        <span className="cat-count">{comenzi.filter((c) => c.categorie === cat.nume).length}</span>{/* câte comenzi are categoria (din toată lista) */}
                      </li>
                    ))}{/* sfârșitul map-ului */}
                  </ul>
                  {cautareActiva && comenziAfisate.length === 0 && comenzi.length > 0 ? ( // căutarea nu a găsit nicio comandă
                    <CautareGoala mesaj={`Nicio comandă pentru „${textCautat}”`} onSterge={handleStergeCautarea} />// mesaj + „Șterge căutarea”
                  ) : ( // lista (sau mesajul „Nu ai nicio comandă.” dacă lista e chiar goală)
                    <ComandaList // lista de comenzi
                      comenzi={comenziAfisate} // datele coboară prin props (filtrate de căutare)
                      onToggle={handleToggleLivrata} // evenimentele urcă prin callback-uri
                      onDelete={setDeSters} // nu ștergem direct: doar marcăm comanda și se deschide dialogul
                    />
                  )}{/* sfârșitul randării condiționate */}
                </>
              )}{/* sfârșitul randării condiționate */}
            </section>
          </>
        )}{/* sfârșitul celor trei stări */}
      </main>

      <ConfirmDialog // dialogul de confirmare
        comanda={comandaDeSters} // null = închis, obiect = deschis
        onConfirm={handleDelete} // ștergerea efectivă
        onCancel={() => setDeSters(null)} // renunțare: închidem dialogul
      />
      <CosDrawer // panoul coșului
        deschis={cosDeschis} // false = închis
        linii={linii} // liniile calculate mai sus
        disponibil={gata} // false = meniul nu a sosit, deci nu spunem „Coșul e gol”
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
