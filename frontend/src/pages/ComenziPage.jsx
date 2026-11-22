import { useEffect, useRef, useState } from "react"; // useState: comenzile și filtrele; useEffect: cererea și focusul; useRef: focus pe titluri și câmpuri
import { createPortal } from "react-dom"; // „Anulează” se desenează în regiunea mesajelor din Layout
import { CircleAlert, RotateCw, Search, X } from "lucide-react"; // iconițele căutării și ale mesajelor de eroare
import AlegereLivrare from "../components/AlegereLivrare.jsx"; // „Cum primești comanda”, în hero
import CategoriiCarduri from "../components/CategoriiCarduri.jsx"; // rândul de categorii
import CautareGoala from "../components/CautareGoala.jsx"; // starea „niciun rezultat” a căutării
import ComandaForm from "../components/ComandaForm.jsx"; // Etapa 7: formularul „Comandă specială”
import ComandaList from "../components/ComandaList.jsx"; // lista de comenzi
import Meniu from "../components/Meniu.jsx"; // grila de preparate
import RestauranteRand from "../components/RestauranteRand.jsx"; // redesign: rândul „Restaurante”
import PentruTine from "../components/PentruTine.jsx";
import { ScheletComenzi } from "../components/Schelete.jsx"; // rândurile în așteptare cât se încarcă comenzile
import UndoToast from "../components/UndoToast.jsx"; // mesajul cu „Anulează”
import { createComanda, deleteComanda, fetchComenzi, updateComanda } from "../api.js"; // Etapa 6–7: citire, adăugare, modificare și ștergere
import { potrivesteCategoria } from "../categorii.js"; // filtrul de categorie al meniului
import { normalizeaza, potrivesteCautarea } from "../cautare.js"; // filtrarea după textul căutat
import { formatComenzi, formatProduse } from "../format.js"; // funcții de formatare a textelor
import { useMagazin } from "../magazin.js"; // starea comună: meniul, livrarea, regiunea mesajelor
import { RESTAURANTE_INFO } from "../restaurante.js"; // restaurantele, pentru rândul de carduri
import { comutaLivrata } from "../stari.js"; // fluxul complet: bifa „Livrată” schimbă și starea, plata și istoricul
import { formatPreparate, formatRestaurante, frazaRezumat, restauranteDinMeniu } from "../rezumat.js"; // textele derivate din date
import { cuTranzitie } from "../tranzitie.js"; // învelește actualizările de state într-o animație
import styles from "./ComenziPage.module.css"; // Etapa 8: stilurile paginii (CSS Modules)

// Pagina principală („/”). Redesign „Pădure”: hero verde (titlu, căutare, livrare, fotografii care ies din bandă),
// categorii, restaurante, meniu și „Comenzile tale” (listă + „Comandă specială” + rezumat ca text).
// Meniul, coșul și favoritele sunt în starea comună (Layout); aici rămân comenzile, căutarea și categoria.
export default function ComenziPage() { // pagina principală
  const { meniu, incarcareMeniu, eroareMeniu, reincarcaMeniu, livrare, setLivrare, regiuneToast, noteazaComanda, laSchimbariComenzi } = useMagazin(); // starea comună (plus urmărirea comenzilor)
  const [comenzi, setComenzi] = useState([]); // lista de comenzi
  const [incarcareComenzi, setIncarcareComenzi] = useState(true); // true cât timp așteptăm comenzile
  const [eroareComenzi, setEroareComenzi] = useState(null); // mesajul erorii (null = nicio eroare)
  const [reincercari, setReincercari] = useState(0); // crește la „Încearcă din nou”
  const [eroareActiune, setEroareActiune] = useState(null); // Etapa 7: eroarea unei acțiuni pe o comandă deja afișată
  const [ultimaStearsa, setUltimaStearsa] = useState(null); // ultima comandă ștearsă și locul ei, pentru „Anulează”
  const [cautare, setCautare] = useState(""); // textul din câmpul de căutare (input controlat)
  const [categorieActiva, setCategorieActiva] = useState(null); // categoria aleasă (null = toate)
  const meniuTitluRef = useRef(null); // titlul „Meniu”, primește focusul după reîncercare
  const cautareRef = useRef(null); // câmpul de căutare, primește focusul după „Șterge căutarea”
  const focusDupaReincercare = useRef(false); // true între clicul pe „Încearcă din nou” și starea de încărcare
  const comenziTitluRef = useRef(null); // Etapa 7: titlul „Comenzile tale”, primește focusul când butonul apăsat dispare
  const focusPeComenzi = useRef(false); // Etapa 7: true între o ștergere / anulare reușită și randarea listei noi
  const inLucru = useRef(new Set()); // Etapa 7: id-urile comenzilor cu o cerere în curs

  // Etapa 6: comenzile se cer după prima randare (și din nou la fiecare „Încearcă din nou”)
  useEffect(() => { // efect secundar: sincronizăm state-ul cu serverul
    let ignore = false; // devine true dacă efectul e anulat
    async function load() { // useEffect nu poate primi direct o funcție async
      try { // cererea poate eșua
        const date = await fetchComenzi(); // GET /comenzi
        if (!ignore) setComenzi(date); // lista de la server
      } catch (err) { // cererea a eșuat
        if (!ignore) setEroareComenzi(err.message); // doar mesajul
      } finally { // oricum s-a terminat
        if (!ignore) setIncarcareComenzi(false); // gata cu așteptarea
      } // sfârșitul try/catch/finally
    } // sfârșitul funcției load
    load(); // pornim încărcarea
    return () => { ignore = true; }; // cleanup: un răspuns întârziat nu mai suprascrie state-ul
  }, [reincercari]); // la prima randare și la fiecare reîncercare

  // Fluxul complet: când urmărirea din Layout vede o comandă schimbată (ex. acceptată de restaurant), o înlocuim în listă
  useEffect(() => laSchimbariComenzi((schimbate) => { // abonarea; funcția întoarsă e chiar cleanup-ul (dezabonarea)
    setComenzi((prev) => prev.map((c) => schimbate.find((s) => s.id === c.id) ?? c)); // obiectul nou de la server, pe locul vechi
  }), [laSchimbariComenzi]); // funcția e stabilă: abonarea se face o singură dată

  const loading = incarcareComenzi || incarcareMeniu; // pagina așteaptă comenzile sau meniul
  const error = eroareComenzi ?? eroareMeniu; // un singur mesaj de eroare pe pagină (un singur data-testid="error")

  // „Încearcă din nou”: comenzile și, dacă a eșuat, meniul, fără reîncărcarea paginii
  function handleReincearca() { // apelată de butonul din mesajul de eroare
    focusDupaReincercare.current = true; // butonul apăsat va dispărea; efectul de mai jos mută focusul
    setEroareComenzi(null); // ascundem eroarea veche
    setEroareActiune(null); // și pe cea a unei acțiuni dinainte
    setIncarcareComenzi(true); // „Se încarcă…” cât timp așteptăm
    setReincercari((n) => n + 1); // efectul de încărcare rulează din nou
    if (eroareMeniu) reincarcaMeniu(); // meniul se cere din nou doar dacă el a eșuat
  } // sfârșitul funcției

  // După „Încearcă din nou”, panoul de eroare dispare; ducem focusul pe titlul „Meniu”, nu pe <body>
  useEffect(() => { // rulează după randarea în care s-a schimbat `loading`
    if (!loading || !focusDupaReincercare.current) return; // doar imediat după o reîncercare
    focusDupaReincercare.current = false; // o singură dată
    meniuTitluRef.current?.focus(); // titlul există și în starea de încărcare
  }, [loading]); // dependența: starea de încărcare

  // Mesajul cu „Anulează” dispare singur după 5 secunde
  useEffect(() => { // rulează când se schimbă `ultimaStearsa`
    if (!ultimaStearsa) return; // nu e nimic de ascuns
    const timer = setTimeout(() => setUltimaStearsa(null), 5000); // ascundem mesajul după 5 secunde
    return () => clearTimeout(timer); // cleanup: o ștergere nouă repornește numărătoarea
  }, [ultimaStearsa]); // lista de dependențe

  // După o ștergere sau o anulare, butonul apăsat dispare; focusul merge pe titlul „Comenzile tale”
  useEffect(() => { // rulează după fiecare randare în care lista s-a schimbat
    if (!focusPeComenzi.current) return; // doar după o ștergere / anulare
    focusPeComenzi.current = false; // o singură dată
    comenziTitluRef.current?.focus({ preventScroll: true }); // titlul are tabIndex -1
  }, [comenzi]); // dependența: lista de comenzi

  // Etapa 7: o cerere pe o comandă, cel mult una o dată; întoarce false dacă era deja una în curs
  function incepe(id) { // marchează comanda ca ocupată
    if (inLucru.current.has(id)) return false; // dublu clic: a doua cerere nu mai pleacă
    inLucru.current.add(id); // comanda e acum ocupată
    return true; // putem trimite cererea
  } // sfârșitul funcției

  // Etapa 7: întâi serverul, apoi state-ul; eroarea ajunge înapoi în formular, care o afișează
  async function handleAdd(comanda) { // primește comanda construită de formular (fără id)
    setUltimaStearsa(null); // închidem „Anulează”: comanda nouă poate primi id-ul celei șterse
    const salvata = await createComanda(comanda); // POST /comenzi; serverul întoarce comanda cu id
    setEroareActiune(null); // serverul răspunde din nou
    noteazaComanda(salvata); // fluxul complet: urmărirea o știe (și pornește, fiindcă e în curs)
    cuTranzitie(() => setComenzi((prev) => [...prev, salvata])); // în listă intră obiectul de la server
  } // sfârșitul funcției

  // Etapa 7: bifarea pleacă întâi la server. Fluxul complet: PATCH cu `livrata` și, sincron, starea, plata și istoricul (din stari.js)
  async function handleToggleLivrata(id) { // primește id-ul comenzii bifate
    const comanda = comenzi.find((c) => c.id === id); // starea ei curentă
    if (!comanda || !incepe(id)) return; // comandă necunoscută sau cerere deja în curs
    try { // cererea poate eșua
      const actualizata = await updateComanda(id, comutaLivrata(comanda, new Date())); // PATCH /comenzi/:id; `livrata` se inversează ca înainte
      setEroareActiune(null); // a mers: ascundem o eroare veche
      noteazaComanda(actualizata); // fără notificare despre propria bifă
      cuTranzitie(() => setComenzi((prev) => prev.map((c) => (c.id === id ? actualizata : c)))); // obiectul de la server
    } catch (err) { // serverul n-a salvat: bifa rămâne cum era
      setEroareActiune(`Nu am putut schimba starea comenzii „${comanda.preparat}”: ${err.message}. Încearcă din nou.`); // ce s-a întâmplat și ce e de făcut
    } finally { // oricum s-a terminat
      inLucru.current.delete(id); // comanda nu mai e ocupată
    } // sfârșitul try/catch/finally
  } // sfârșitul funcției

  // Etapa 7: ștergerea e directă (fără dialog): DELETE la server, apoi scoatem comanda din listă
  async function handleDelete(id) { // primește id-ul comenzii
    const index = comenzi.findIndex((c) => c.id === id); // poziția comenzii, ca s-o putem pune la loc
    if (index === -1 || !incepe(id)) return; // comandă necunoscută sau cerere deja în curs
    const comanda = comenzi[index]; // obiectul întreg, pentru „Anulează”
    try { // cererea poate eșua
      await deleteComanda(id); // DELETE /comenzi/:id
      setEroareActiune(null); // a mers: ascundem o eroare veche
      setUltimaStearsa({ comanda, index }); // memorăm comanda și poziția pentru undo
      focusPeComenzi.current = true; // butonul de ștergere dispare odată cu rândul
      cuTranzitie(() => setComenzi((prev) => prev.filter((c) => c.id !== id))); // listă nouă, fără comanda ștearsă
    } catch (err) { // serverul n-a șters: comanda rămâne în listă
      setEroareActiune(`Nu am putut șterge comanda „${comanda.preparat}”: ${err.message}. Încearcă din nou.`); // mesajul de deasupra listei
    } finally { // oricum s-a terminat
      inLucru.current.delete(id); // comanda nu mai e ocupată
    } // sfârșitul try/catch/finally
  } // sfârșitul funcției

  // „Anulează”: comanda ștearsă se trimite din nou, cu id-ul ei vechi, și revine pe locul ei
  async function handleUndo() { // apelată de butonul din mesaj
    if (!ultimaStearsa) return; // mesajul tocmai a dispărut
    const { comanda, index } = ultimaStearsa; // ce am salvat la ștergere
    setUltimaStearsa(null); // ascundem mesajul (un al doilea clic nu mai e posibil)
    try { // cererea poate eșua
      const readusa = await createComanda(comanda); // POST /comenzi cu tot cu id
      setEroareActiune(null); // a mers: ascundem o eroare veche
      noteazaComanda(readusa); // urmărirea o știe din nou
      focusPeComenzi.current = true; // butonul „Anulează” a dispărut
      cuTranzitie(() => setComenzi((prev) => [...prev.slice(0, index), readusa, ...prev.slice(index)])); // pe locul ei
    } catch (err) { // serverul n-a salvat-o
      setEroareActiune(`Nu am putut readuce comanda „${comanda.preparat}”: ${err.message}.`); // mesajul de deasupra listei
      comenziTitluRef.current?.focus({ preventScroll: true }); // butonul a dispărut; mutăm focusul aici
    } // sfârșitul try/catch
  } // sfârșitul funcției

  // Căutarea: Esc golește câmpul
  function handleCautareKeyDown(e) { // tastă apăsată în câmpul de căutare
    if (e.key === "Escape") setCautare(""); // golim textul; lista completă reapare
  } // sfârșitul funcției

  // „Șterge căutarea” din starea fără rezultate: butonul dispare, deci ducem focusul în câmp
  function handleStergeCautarea() { // apelată de CautareGoala
    setCautare(""); // golim textul
    cautareRef.current.focus(); // utilizatorul poate scrie imediat altă căutare
  } // sfârșitul funcției

  // Meniul fără rezultate: butonul golește și căutarea, și categoria
  function handleStergeFiltrele() { // apelată de CautareGoala (meniul)
    setCategorieActiva(null); // înapoi la „Toate”
    handleStergeCautarea(); // golim textul și mutăm focusul
  } // sfârșitul funcției

  // Valori derivate: se recalculează la fiecare randare
  const gata = !loading && !error; // datele au sosit cu bine
  const cautareActiva = normalizeaza(cautare) !== ""; // doar spațiile nu contează ca o căutare
  const textCautat = cautareActiva ? cautare.trim() : ""; // textul afișat în mesaje
  const meniuAfisat = meniu.filter((p) => potrivesteCautarea(p, cautare) && potrivesteCategoria(p, categorieActiva)); // meniul filtrat
  const restauranteAfisate = RESTAURANTE_INFO.filter((r) => meniuAfisat.some((p) => p.restaurant === r.nume)); // restaurantele care au ceva din meniul filtrat
  const comenziAfisate = comenzi.filter((c) => potrivesteCautarea(c, cautare)); // comenzile filtrate doar de căutare
  const rezumat = frazaRezumat(comenzi); // „6 comenzi: 3 pe drum, 3 livrate. Total: 331 lei.” (din toată lista)
  const anuntFiltre = !gata || (!cautareActiva && !categorieActiva) ? "" : `${categorieActiva ? `${categorieActiva}: ` : ""}${formatProduse(meniuAfisat.length)}${cautareActiva ? ` și ${formatComenzi(comenziAfisate.length)} găsite` : ""}`; // anunțul cititoarelor de ecran

  return ( // JSX-ul paginii
    <>{/* Fragment: hero, conținutul și mesajul „Anulează” */}
      <section className={`${styles.hero} pe-padure`} aria-labelledby="hero-titlu">{/* banda verde, continuarea antetului */}
        <div className={`wrap ${styles.heroInner}`}>{/* containerul centrat */}
          <div className={styles.heroText}>{/* titlul, căutarea și livrarea */}
            <h1 id="hero-titlu" className={styles.display}>Cina ta preferată, la ușă.</h1>{/* titlul mare */}
            <p className={styles.heroSub}>{/* subtitlul, derivat din meniu */}
              {!incarcareMeniu && !eroareMeniu ? (meniu.length > 0 ? `${formatPreparate(meniu.length)} de la ${formatRestaurante(restauranteDinMeniu(meniu).length)}, gata de comandat.` : "Meniul nu are preparate momentan.") : " "}{/* ex. „9 preparate de la 3 restaurante”; depinde doar de meniu; cât se încarcă, un spațiu păstrează înălțimea */}
            </p>
            <label className={styles.search}>{/* câmpul de căutare, cel mai mare control din hero */}
              <Search size={22} aria-hidden="true" />{/* iconița lupă */}
              <input // inputul controlat: valoarea vine din state
                ref={cautareRef} // ca să-i putem da focus din cod
                type="search" // tastatura de pe telefon arată „Caută”
                placeholder="Caută preparate sau restaurante" // indiciul din câmpul gol
                aria-label="Caută preparate sau restaurante" // nume accesibil (placeholder-ul nu ajunge)
                value={cautare} // componentă controlată
                onChange={(e) => setCautare(e.target.value)} // listele se filtrează la randare
                onKeyDown={handleCautareKeyDown} // Esc golește câmpul
                maxLength={100} // o căutare nu are nevoie de mai mult
              />
            </label>
            <span className="sr-only" role="status">{anuntFiltre}</span>{/* anunță numărul de rezultate, fără să mute focusul */}
            <AlegereLivrare valoare={livrare} onAlege={setLivrare} nume="livrare-hero" varianta="compact" />{/* aceeași alegere ca în coș */}
          </div>
          <div className={styles.heroFotos} aria-hidden="true">{/* fotografiile ies din banda verde, peste hârtie */}
            <img className={styles.fotoMare} src="/img/hero-900.webp" alt="" width="828" height="1100" fetchPriority="high" decoding="async" />{/* pizza, portret; preîncărcată din index.html */}
            <img className={styles.fotoSus} src="/img/sushi-platou.webp" alt="" width="720" height="540" decoding="async" />{/* platoul de sushi */}
            <img className={styles.fotoJos} src="/img/burger-vita.webp" alt="" width="720" height="540" decoding="async" />{/* burgerul */}
          </div>
        </div>
      </section>

      <div className={`wrap ${styles.continut}`}>{/* conținutul de sub hero */}
        {error ? ( // starea de eroare: un singur mesaj, care spune ce s-a întâmplat și ce e de făcut
          <div className="error">{/* panoul de eroare */}
            <CircleAlert size={22} aria-hidden="true" />{/* iconiță decorativă */}
            <div className="error-body">{/* textul și butonul */}
              <p role="alert" data-testid="error">Nu am putut încărca datele: {error}. Pornește serverul cu <code>npm run api</code> și încearcă din nou.</p>{/* Etapa 7: data-testid="error" */}
              <button type="button" className="btn-primary" onClick={handleReincearca}>{/* reîncearcă fără reîncărcarea paginii */}
                <RotateCw size={18} aria-hidden="true" />{/* iconiță decorativă */}
                Încearcă din nou{/* textul butonului */}
              </button>
            </div>
          </div>
        ) : ( // se încarcă sau datele au sosit
          <>{/* Fragment: secțiunile */}
            <CategoriiCarduri meniu={meniu} activa={categorieActiva} onAlege={setCategorieActiva} incarcare={incarcareMeniu} />{/* rândul de categorii; depinde doar de meniu */}
            <RestauranteRand restaurante={restauranteAfisate} meniu={meniu} incarcare={incarcareMeniu} />{/* rândul de restaurante */}
            {/* Pachetul C: „Pentru tine” se ascunde cât se caută sau se filtrează, ca rezultatele să rămână primele */}
            {gata && !cautareActiva && !categorieActiva && <PentruTine comenzi={comenzi} meniu={meniu} />}
            <Meniu // grila de preparate
              meniu={meniuAfisat} // preparatele care se potrivesc cu căutarea și cu categoria
              totalMeniu={meniu.length} // pentru „2 din 9 preparate”
              incarcare={incarcareMeniu} // true = schelete; doar meniul contează, ca „/#comenzi” să nu sară când sosesc comenzile
              cautare={textCautat} // textul căutat ("" = nu se caută)
              categorie={categorieActiva} // categoria aleasă (null = toate)
              onStergeFiltrele={handleStergeFiltrele} // butonul din starea fără rezultate
              titluRef={meniuTitluRef} // referința către titlu
            />
            <section className={styles.comenzi} aria-labelledby="comenzi" aria-busy={loading}>{/* secțiunea comenzilor */}
              <div className="section-header">{/* titlul secțiunii */}
                <h2 id="comenzi" className={`titlu-focus ${styles.titluAncora}`} ref={comenziTitluRef} tabIndex={-1}>Comenzile tale</h2>{/* „/#comenzi” duce aici după plasare */}
                {gata && <span className="section-meta">{cautareActiva ? `${comenziAfisate.length} din ${formatComenzi(comenzi.length)}` : formatComenzi(comenzi.length)}</span>}{/* la căutare: „1 din 6 comenzi” */}
              </div>
              {gata && rezumat && <p className={styles.rezumat}>{rezumat}</p>}{/* rezumatul ca o frază, din toată lista */}
              <div className={styles.comenziGrid}>{/* lista în stânga (mai lată), formularul în dreapta; una sub alta pe ecrane înguste */}
                <div className={styles.comenziLista}>{/* coloana listei */}
                  {eroareActiune && ( // Etapa 7: o acțiune a eșuat; lista rămâne dedesubt
                    <div className={`error ${styles.errorActiune}`}>{/* același panou de eroare, mai compact */}
                      <CircleAlert size={20} aria-hidden="true" />{/* iconiță decorativă */}
                      <p role="alert" data-testid="error">{eroareActiune}</p>{/* mesajul erorii */}
                      <button type="button" className="btn-close" onClick={() => setEroareActiune(null)} aria-label="Închide mesajul de eroare">{/* utilizatorul îl poate ascunde */}
                        <X size={18} aria-hidden="true" />{/* iconiță decorativă */}
                      </button>
                    </div>
                  )}{/* sfârșitul randării condiționate */}
                  {loading ? ( // comenzile nu au sosit încă
                    <>{/* mesajul și scheletele */}
                      <p className="info" role="status" data-testid="loading">Se încarcă comenzile…</p>{/* Etapa 7: data-testid="loading" */}
                      <ScheletComenzi />{/* rânduri în așteptare, doar decor */}
                    </>
                  ) : cautareActiva && comenziAfisate.length === 0 && comenzi.length > 0 ? ( // căutarea nu a găsit nicio comandă
                    <CautareGoala mesaj={`Nicio comandă pentru „${textCautat}”`} onSterge={handleStergeCautarea} />// mesaj + „Șterge căutarea”
                  ) : ( // lista (sau „Nu ai nicio comandă.” dacă e goală)
                    <ComandaList comenzi={comenziAfisate} onToggle={handleToggleLivrata} onDelete={handleDelete} />// lista de comenzi
                  )}{/* sfârșitul randării condiționate */}
                </div>
                <section className={`panel ${styles.specialaPanel}`} aria-labelledby="speciala-titlu">{/* foaia formularului */}
                  <h3 id="speciala-titlu" className={styles.panelTitlu}>Comandă specială</h3>{/* titlul foii */}
                  <ComandaForm onAdd={handleAdd} blocat={loading} />{/* pagina primește comanda validată și o trimite la server */}
                </section>
              </div>
            </section>
          </>
        )}{/* sfârșitul celor trei stări */}
      </div>

      {regiuneToast && createPortal(<UndoToast stearsa={ultimaStearsa} onUndo={handleUndo} />, regiuneToast)}{/* „Anulează”, în regiunea mesajelor din Layout */}
    </>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
