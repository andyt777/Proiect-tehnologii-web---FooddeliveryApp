import { useEffect, useRef, useState } from "react"; // useState: restaurantul, formularul deschis, mesajele; useRef + useEffect: focusul după o acțiune
import { CircleAlert, RotateCw, X } from "lucide-react"; // iconițele erorilor
import ComandaPanou from "../components/ComandaPanou.jsx"; // cardul unei comenzi
import FormularAcceptare from "../components/FormularAcceptare.jsx"; // minutele (și prețul) la acceptare
import FormularMotiv from "../components/FormularMotiv.jsx"; // motivul respingerii
import PoartaRol from "../components/PoartaRol.jsx"; // pagina doar în rolul Restaurant (demo)
import { patchTranzitie } from "../actiuniComenzi.js"; // corpul PATCH, cu verificarea rolului
import { useComenziLive } from "../comenziLive.js"; // comenzile, ținute la zi
import { useMagazin } from "../magazin.js"; // urmărirea comenzilor din Layout
import { RESTAURANTE_INFO } from "../restaurante.js"; // restaurantele demo
import { ETICHETE_PAS_LIVRARE, esteRidicare, normalizeazaComanda, poateTrece } from "../stari.js"; // stările, cu valorile implicite
import styles from "../components/Panou.module.css"; // stilurile comune ale panourilor (CSS Modules)

// Cele trei coloane ale bucătăriei; o comandă acceptată, dar neîncepută, stă la „În preparare”
const COLOANE = [ // ordinea de pe ecran
  { id: "noi", titlu: "Noi", stari: ["plasata"], gol: "Nicio comandă nouă." }, // așteaptă răspunsul restaurantului
  { id: "preparare", titlu: "În preparare", stari: ["acceptata", "in_preparare"], gol: "Nimic în preparare." }, // acceptate și începute
  { id: "gata", titlu: "Gata", stari: ["gata"], gol: "Nicio comandă gata." }, // așteaptă livratorul sau clientul
]; // sfârșitul listei

// Pachetul B: pagina /restaurant (rolul demo Restaurant): comenzile unui restaurant, pe coloane, cu acțiunile lui.
export default function PanouRestaurantPage() { // componenta rutei
  return <PoartaRol rol="restaurant" titlu="Comenzile restaurantului"><PanouRestaurant /></PoartaRol>; // explicație dacă rolul e altul
} // sfârșitul componentei

function PanouRestaurant() { // conținutul, în rolul Restaurant
  const { noteazaComanda } = useMagazin(); // fără notificări despre acțiunile făcute aici
  const { comenzi, incarcare, eroare, acum, reincarca, aplica } = useComenziLive(noteazaComanda); // lista, la zi
  const [restaurant, setRestaurant] = useState(RESTAURANTE_INFO[0].nume); // restaurantul ales
  const [deschis, setDeschis] = useState(null); // formularul deschis: { id, tip: „accepta” | „respinge” } sau null
  const [inLucru, setInLucru] = useState(null); // id-ul comenzii cu o cerere în curs (butoanele simple)
  const [eroareActiune, setEroareActiune] = useState(null); // eroarea ultimei acțiuni
  const [aviz, setAviz] = useState(""); // confirmarea ultimei acțiuni
  const titluRef = useRef(null); // titlul paginii
  const focusDupa = useRef(null); // id-ul comenzii care primește focus după randare (cardul s-a mutat în altă coloană)

  useEffect(() => { // la deschiderea paginii
    titluRef.current?.focus({ preventScroll: true }); // cititorul de ecran anunță pagina
  }, []); // o singură dată

  // După o acțiune, butonul apăsat dispare (cardul trece în altă coloană); focusul merge pe titlul cardului, altfel pe titlul paginii
  useEffect(() => { // rulează după randarea cu lista nouă sau cu formularul închis
    if (focusDupa.current === null) return; // nimic de mutat
    const tinta = document.querySelector(`#panou-comanda-${focusDupa.current} a`); // linkul din titlul cardului
    focusDupa.current = null; // o singură dată
    (tinta ?? titluRef.current)?.focus({ preventScroll: Boolean(!tinta) }); // cardul a dispărut: titlul paginii
  }, [comenzi, deschis]); // după fiecare schimbare a listei sau a formularului

  // O tranziție: comanda proaspătă -> corpul PATCH (doar dacă restaurantul o poate face acum) -> serverul
  async function trece(comanda, stareNoua, detalii, mesaj) { // folosită de butoane și de formulare
    await aplica(comanda.id, (proaspata) => patchTranzitie(proaspata, stareNoua, "restaurant", new Date(), detalii)); // aruncă dacă nu mai e permisă
    focusDupa.current = comanda.id; // focusul urmează cardul
    setDeschis(null); // formularul (dacă era) se închide
    setEroareActiune(null); // fără erori vechi
    setAviz(mesaj); // ce s-a întâmplat
  } // sfârșitul funcției

  async function handleButon(comanda, stareNoua, mesaj) { // butoanele fără formular
    if (inLucru !== null) return; // o cerere e deja în curs
    setInLucru(comanda.id); // butonul arată că lucrează
    try { // cererile pot eșua
      await trece(comanda, stareNoua, {}, mesaj); // tranziția
    } catch (err) { // server oprit sau comanda s-a schimbat
      setAviz(""); // fără confirmare
      setEroareActiune(`Nu am putut actualiza comanda „${comanda.preparat}”: ${err.message}`); // ce s-a întâmplat
    } finally { // oricum
      setInLucru(null); // butoanele revin
    } // sfârșitul try/catch/finally
  } // sfârșitul funcției

  function inchideFormular(id) { // „Renunță” într-un formular
    focusDupa.current = id; // focusul revine pe card
    setDeschis(null); // formularul dispare
  } // sfârșitul funcției

  const aleRestaurantului = comenzi.filter((c) => c?.restaurant === restaurant).map((c) => ({ bruta: c, n: normalizeazaComanda(c) })); // comenzile lui, cu valorile implicite

  function actiuniCard(bruta, c) { // butoanele și formularele unui card
    if (deschis?.id === c.id && deschis.tip === "accepta") return <FormularAcceptare comanda={bruta} onConfirma={(valori) => trece(bruta, "acceptata", valori, `Ai acceptat comanda „${c.preparat}”.`)} onRenunta={() => inchideFormular(c.id)} />; // minutele (și prețul)
    if (deschis?.id === c.id && deschis.tip === "respinge") return <FormularMotiv id={`respinge-${c.id}`} intrebare="De ce respingi comanda?" textConfirma="Respinge comanda" onConfirma={(motiv) => trece(bruta, "respinsa", { motiv }, `Ai respins comanda „${c.preparat}”.`)} onRenunta={() => inchideFormular(c.id)} />; // motivul
    const ocupat = inLucru === c.id; // cererea acestei comenzi e în curs
    return ( // butoanele potrivite stării
      <div className={styles.actiuni}>{/* rândul de butoane */}
        {poateTrece(c, "acceptata", "restaurant") && <button type="button" className="btn-primary" onClick={() => setDeschis({ id: c.id, tip: "accepta" })}>Acceptă</button>}{/* deschide formularul */}
        {poateTrece(c, "respinsa", "restaurant") && <button type="button" className="btn-secondary" onClick={() => setDeschis({ id: c.id, tip: "respinge" })}>Respinge</button>}{/* deschide formularul */}
        {poateTrece(c, "in_preparare", "restaurant") && <button type="button" className="btn-primary" aria-disabled={ocupat} onClick={() => handleButon(bruta, "in_preparare", `Ai început prepararea pentru „${c.preparat}”.`)}>{ocupat ? "Se trimite…" : "Începe prepararea"}</button>}{/* acceptată -> în preparare */}
        {poateTrece(c, "gata", "restaurant") && <button type="button" className="btn-primary" aria-disabled={ocupat} onClick={() => handleButon(bruta, "gata", `„${c.preparat}” e gata.`)}>{ocupat ? "Se trimite…" : "Marchează gata"}</button>}{/* în preparare -> gata */}
        {poateTrece(c, "livrata", "restaurant") && <button type="button" className="btn-primary" aria-disabled={ocupat} onClick={() => handleButon(bruta, "livrata", `„${c.preparat}” a fost ridicată de client.`)}>{ocupat ? "Se trimite…" : "Predată clientului"}</button>}{/* ridicare: gata -> ridicată */}
        {c.stare === "gata" && !esteRidicare(c) && <p className={styles.indiciu}>{ETICHETE_PAS_LIVRARE[c.livrareStare]}. Livratorul o preia de aici.</p>}{/* livrarea nu e treaba restaurantului */}
      </div>
    ); // sfârșitul JSX-ului
  } // sfârșitul funcției

  return ( // JSX-ul paginii
    <div className={`wrap ${styles.pagina}`}>{/* containerul centrat */}
      <h1 ref={titluRef} tabIndex={-1} className={`titlu-focus ${styles.titlu}`}>Comenzile restaurantului</h1>{/* titlul; tabIndex -1: focus doar din cod */}
      <p className={styles.intro}>Acceptă sau respinge comenzile noi, spune cât durează prepararea și marchează-le gata. Lista se actualizează singură la 10 secunde.</p>{/* ce face pagina */}
      <div className={styles.bara}>{/* alegerea restaurantului */}
        <div className={styles.alegere}>{/* eticheta și lista */}
          <label htmlFor="panou-restaurant">Restaurantul</label>{/* eticheta */}
          <select id="panou-restaurant" value={restaurant} onChange={(e) => { setRestaurant(e.target.value); setDeschis(null); setAviz(""); setEroareActiune(null); }}>{/* alt restaurant: formularele și mesajele vechi dispar */}
            {RESTAURANTE_INFO.map((r) => <option key={r.slug} value={r.nume}>{r.nume}</option>)}{/* cele trei restaurante demo */}
          </select>
        </div>
      </div>

      {eroareActiune && ( // o acțiune a eșuat; coloanele rămân
        <div className={`error ${styles.avertisment}`}>{/* panoul de eroare */}
          <CircleAlert size={20} aria-hidden="true" />{/* iconiță decorativă */}
          <p role="alert">{eroareActiune}</p>{/* mesajul */}
          <button type="button" className="btn-close" onClick={() => setEroareActiune(null)} aria-label="Închide mesajul de eroare"><X size={18} aria-hidden="true" /></button>{/* utilizatorul îl poate ascunde */}
        </div>
      )}{/* sfârșitul randării condiționate */}
      <p className={styles.aviz} role="status">{aviz}</p>{/* confirmarea, anunțată fără să mute focusul */}

      {incarcare ? ( // prima citire nu a sosit
        <p className="info" role="status">Se încarcă comenzile…</p>// mesajul de încărcare
      ) : eroare && comenzi.length === 0 ? ( // prima citire a eșuat
        <div className={`error ${styles.avertisment}`}>{/* panoul de eroare */}
          <CircleAlert size={22} aria-hidden="true" />{/* iconiță decorativă */}
          <div className="error-body">{/* textul și butonul */}
            <p role="alert">Nu am putut încărca comenzile: {eroare}. Pornește serverul cu <code>npm run api</code> și încearcă din nou.</p>{/* ce s-a întâmplat */}
            <button type="button" className="btn-primary" onClick={reincarca}><RotateCw size={18} aria-hidden="true" />Încearcă din nou</button>{/* ce poate face utilizatorul */}
          </div>
        </div>
      ) : ( // lista a sosit
        <>{/* avertismentul unei citiri periodice eșuate și coloanele */}
          {eroare && <p className={styles.indiciu} role="status">Ultima actualizare a eșuat ({eroare}). Încercăm din nou în câteva secunde.</p>}{/* lista veche rămâne */}
          <div className={styles.coloane}>{/* Noi / În preparare / Gata */}
            {COLOANE.map((col) => { // o coloană
              const dinColoana = aleRestaurantului.filter(({ n }) => col.stari.includes(n.stare)); // comenzile ei
              return ( // JSX-ul coloanei
                <section key={col.id} className={styles.coloana} aria-labelledby={`coloana-${col.id}`}>{/* secțiunea are numele titlului */}
                  <h2 id={`coloana-${col.id}`} className={styles.coloanaTitlu}>{col.titlu}<span className={styles.coloanaNumar}>{dinColoana.length}</span></h2>{/* titlul și câte sunt */}
                  {dinColoana.length === 0 ? <p className={styles.gol}>{col.gol}</p> : ( // coloana goală
                    <ul className={styles.lista}>{/* cardurile */}
                      {dinColoana.map(({ bruta, n }) => ( // un card pentru fiecare comandă
                        <li key={n.id}>{/* id-ul e unic */}
                          <ComandaPanou comanda={bruta} acum={acum}>{/* titlul, starea, detaliile, întârzierea */}
                            <dl className={styles.detalii}>{/* ce îi trebuie bucătăriei */}
                              {n.contact && <div><dt>Client</dt><dd>{n.contact.nume}</dd></div>}{/* pentru predare */}
                              {n.timpPreparare && <div><dt>Timp de preparare</dt><dd>{n.timpPreparare} min</dd></div>}{/* cerut la acceptare */}
                            </dl>
                            {actiuniCard(bruta, n)}{/* butoanele sau formularul */}
                          </ComandaPanou>
                        </li>
                      ))}{/* sfârșitul map-ului */}
                    </ul>
                  )}{/* sfârșitul randării condiționate */}
                </section>
              ); // sfârșitul JSX-ului
            })}{/* sfârșitul map-ului */}
          </div>
        </>
      )}{/* sfârșitul celor trei stări */}
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
