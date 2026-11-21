import { useEffect, useRef, useState } from "react"; // useState: comanda, încărcarea și eroarea; useEffect: cererea; useRef: focus pe titlu
import { Link, useParams } from "react-router-dom"; // Link: drumul înapoi fără reîncărcare; useParams: id-ul din adresă
import { ArrowLeft, Check, CircleAlert, Utensils, X, Zap } from "lucide-react"; // iconițele paginii
import AnulareComanda from "../components/AnulareComanda.jsx"; // fluxul complet: anularea, cu motiv, confirmată pe loc
import { fetchComanda } from "../api.js"; // GET /comenzi/:id, prin singurul fișier cu fetch
import { ICONITE_CATEGORIE } from "../categorii.js"; // iconița categoriei, când comanda nu are fotografie
import { imagineComanda } from "../imagini.js"; // fotografia preparatului (sau null)
import { DURATE_LIVRARE, ETICHETE_LIVRARE } from "../livrare.js"; // tipul livrării și timpul estimat
import { formatData, formatLei, formatOra } from "../format.js"; // prețul în lei, data plasării și ora fiecărui pas
import { useMagazin } from "../magazin.js"; // fluxul complet: urmărirea comenzilor (Layout)
import { restaurantDupaNume } from "../restaurante.js"; // link spre pagina restaurantului
import { arePret } from "../rezumat.js"; // comanda specială are pret: null până la confirmare
import { ETICHETE_METODA_PLATA, ETICHETE_PAS_LIVRARE, ETICHETE_STARE_PLATA, cronologie, normalizeazaComanda, poateTrece } from "../stari.js"; // fluxul complet: stările, cu valorile implicite
import styles from "./ComandaDetaliuPage.module.css"; // stilurile paginii (CSS Modules)

// Etapa 8: pagina unei singure comenzi, la /comenzi/:id. Citește id-ul din adresă și cere de la server exact acea comandă.
// key={id}: când adresa trece la altă comandă, React creează o componentă nouă, deci state-ul pornește iar de la început.
// Fluxul complet: pașii vin din `istoric` (cu ora reală când există), plus plata, adresa, programarea și anularea.
export default function ComandaDetaliuPage() { // componenta rutei
  const { id } = useParams(); // text din URL, de exemplu "3"
  return <DetaliuComanda key={id} id={id} />; // o componentă nouă pentru fiecare id
} // sfârșitul componentei

function DetaliuComanda({ id }) { // conținutul paginii, pentru un singur id
  const { noteazaComanda, laSchimbariComenzi } = useMagazin(); // urmărirea comenzilor, din Layout
  const [comanda, setComanda] = useState(null); // comanda de la server (null până sosește)
  const [loading, setLoading] = useState(true); // pornește direct cu true: efectul nu apelează setLoading(true)
  const [error, setError] = useState(null); // pornește cu null: efectul nu apelează setError(null)
  const [aviz, setAviz] = useState(""); // fluxul complet: rezultatul anulării („Comanda a fost anulată.”)
  const titluRef = useRef(null); // titlul comenzii, primește focusul după încărcare
  const focusat = useRef(false); // titlul primește focus o singură dată (nu la fiecare actualizare a comenzii)

  // Cererea pleacă după prima randare; setState se apelează doar în .then / .catch / .finally (regula set-state-in-effect)
  useEffect(() => { // efect secundar: sincronizăm pagina cu serverul
    let ignore = false; // devine true dacă efectul e anulat
    fetchComanda(id) // GET /comenzi/:id
      .then((data) => { // serverul a răspuns cu comanda
        if (!ignore) setComanda(data); // doar dacă răspunsul e încă cel dorit
      }) // sfârșitul then
      .catch((err) => { // 404, server oprit, timeout sau răspuns ciudat
        if (!ignore) setError(err.message); // mesajul românesc din request()
      }) // sfârșitul catch
      .finally(() => { // oricum s-a terminat
        if (!ignore) setLoading(false); // gata cu așteptarea
      }); // sfârșitul finally
    return () => { // cleanup: un răspuns întârziat nu mai suprascrie state-ul
      ignore = true; // marcăm efectul ca anulat
    }; // sfârșitul cleanup-ului
  }, [id]); // se reîncarcă dacă se schimbă id-ul din adresă

  // Fluxul complet: urmărirea din Layout a văzut o schimbare; dacă e comanda de pe pagină, pașii se actualizează singuri
  useEffect(() => laSchimbariComenzi((schimbate) => { // abonarea; funcția întoarsă e dezabonarea (cleanup)
    const noua = schimbate.find((c) => String(c.id) === id); // id-ul din adresă e text, cel de la server e număr
    if (noua) setComanda(noua); // comanda nouă, de la server
  }), [laSchimbariComenzi, id]); // abonare nouă doar dacă se schimbă id-ul

  // Când comanda apare prima dată, ducem focusul pe titlu: cititorul de ecran anunță ce pagină s-a deschis
  useEffect(() => { // rulează după randarea în care a sosit comanda
    if (!comanda || focusat.current) return; // încă nu a sosit sau focusul a fost deja mutat
    focusat.current = true; // o singură dată
    titluRef.current?.focus(); // titlul are tabIndex -1
  }, [comanda]); // dependența: comanda

  // Comanda anulată de pe pagină: o afișăm și o trecem în urmărire (fără notificare despre propria acțiune)
  function handleActualizata(noua, mesaj) { // primește comanda întoarsă de server și mesajul pentru utilizator
    noteazaComanda(noua); // urmărirea o știe
    setComanda(noua); // pagina o arată
    setAviz(mesaj); // confirmarea sau motivul pentru care nu s-a putut
  } // sfârșitul funcției

  return ( // JSX-ul paginii
    <div className={`wrap ${styles.pagina}`}>{/* containerul centrat */}
      <Link to="/#comenzi" className={styles.inapoi}>{/* drumul înapoi la listă, fără reîncărcare */}
        <ArrowLeft size={18} aria-hidden="true" />{/* săgeata, decorativă */}
        Înapoi la comenzi{/* textul linkului */}
      </Link>

      {loading && ( // comanda nu a sosit încă
        <>{/* mesajul și scheletul */}
          <p className="info" role="status" data-testid="loading">Se încarcă comanda…</p>{/* reperul pentru verificarea automată */}
          <ScheletDetaliu />{/* forme fără text, doar decor */}
        </>
      )}{/* sfârșitul randării condiționate */}

      {error && ( // cererea a eșuat (ex. /comenzi/999 -> 404)
        <div className="error">{/* panoul de eroare */}
          <CircleAlert size={22} aria-hidden="true" />{/* iconiță decorativă */}
          <div className="error-body">{/* textul și butonul */}
            <p role="alert" data-testid="error">Comanda nu a putut fi încărcată: {error}.</p>{/* ex. „Eroare server: 404” */}
            <p className={styles.indiciu}>Poate a fost ștearsă sau adresa e greșită. Verifică lista de comenzi.</p>{/* ce înseamnă și ce e de făcut */}
            <Link to="/#comenzi" className="btn-primary">Vezi toate comenzile</Link>{/* drumul înapoi, nu un ecran gol */}
          </div>
        </div>
      )}{/* sfârșitul randării condiționate */}

      {comanda && <Detaliu comanda={comanda} titluRef={titluRef} aviz={aviz} onActualizata={handleActualizata} />}{/* comanda sosită */}
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Comanda propriu-zisă: fotografia mare în stânga, textele în dreapta (una sub alta pe telefon)
function Detaliu({ comanda: bruta, titluRef, aviz, onActualizata }) { // primește comanda de la server, referința titlului, mesajul anulării și funcția de actualizare
  const comanda = normalizeazaComanda(bruta); // fluxul complet: toate câmpurile, cu valorile implicite pentru comenzile vechi
  const Iconita = ICONITE_CATEGORIE[comanda.categorie] ?? Utensils; // iconița categoriei (tacâmuri pentru una necunoscută)
  const imagine = comanda.speciala ? null : imagineComanda(comanda); // preparatul cerut special nu are fotografie proprie
  const plasata = formatData(comanda.creata); // „16 noiembrie 2026 la 12:00” sau null
  const programata = formatData(comanda.programataLa); // ora aleasă la plasare sau null
  const eticheta = ETICHETE_LIVRARE[comanda.livrare] ?? comanda.livrare; // „Express”; un tip necunoscut apare așa cum e
  const restaurant = restaurantDupaNume(comanda.restaurant); // pentru link (null dacă nu-l știm)
  const pasi = cronologie(comanda); // pașii, cu ora reală din istoric
  const oprita = comanda.stare === "anulata" || comanda.stare === "respinsa"; // ieșirile laterale
  const poateAnula = poateTrece(comanda, "anulata", "client"); // doar înainte de preparare

  return ( // JSX-ul detaliului
    <section className={styles.detaliu} data-testid="detail" aria-labelledby="detaliu-titlu">{/* reperul paginii de detaliu */}
      <div className={styles.media}>{/* coloana cu fotografia */}
        {imagine ? ( // avem fotografia preparatului
          <img className={styles.foto} src={imagine} alt="" width="720" height="540" decoding="async" />// decorativă: numele e chiar în titlu
        ) : ( // comandă specială sau preparat fără fotografie
          <span className={`${styles.foto} ${styles.fotoGol}`} aria-hidden="true"><Iconita size={96} strokeWidth={1.25} /></span>// iconița categoriei
        )}{/* sfârșitul randării condiționate */}
      </div>

      <div className={styles.text}>{/* coloana cu textele */}
        {comanda.speciala && <p><span className="tag tag-speciala">Comandă specială</span></p>}{/* aceeași etichetă ca în listă */}
        <h1 id="detaliu-titlu" className={`titlu-focus ${styles.titlu}`} ref={titluRef} tabIndex={-1} data-testid="detail-title">{comanda.preparat}</h1>{/* titlul; tabIndex -1: focus doar din cod */}
        <p className={styles.restaurant}>{/* restaurantul, sub titlu */}
          de la {restaurant ? <Link to={`/restaurante/${restaurant.slug}`}>{comanda.restaurant}</Link> : comanda.restaurant}{/* link spre pagina lui, dacă îl știm */}
        </p>
        <p className={styles.pret}>{/* prețul, mare */}
          {arePret(comanda) ? <span className="price">{formatLei(comanda.pret)}</span> : <span className="price price-asteptare">Preț la confirmare</span>}{/* fără preț inventat */}
        </p>

        <h2 id="stare-titlu" className={`titlu-focus ${styles.subtitlu}`} tabIndex={-1}>Stare</h2>{/* titlul pașilor; primește focus după anulare */}
        <ol className={styles.etape} aria-labelledby="stare-titlu">{/* pașii, în ordine */}
          {pasi.map((p) => ( // un pas pentru fiecare stare a drumului
            <li key={p.id} className={`${styles.etapa} ${styles[p.stare]}`} aria-current={p.curenta ? "step" : undefined}>{/* aria-current: pasul la care e comanda acum */}
              <span className={styles.punct} aria-hidden="true">{p.stare === "gata" && <Check size={14} strokeWidth={3} />}{p.stare === "oprit" && <X size={14} strokeWidth={3} />}</span>{/* bifa sau X spun starea, nu doar culoarea */}
              <span className={styles.etapaText}>{p.text}</span>{/* ex. „În preparare” */}
              {p.la && <time className={styles.etapaOra} dateTime={p.la}>{formatOra(p.la)}</time>}{/* ora reală, doar când e în istoric */}
              {p.curenta && p.id === "in_livrare" && <span className={styles.etapaDetaliu}>{DURATE_LIVRARE[comanda.livrare]}</span>}{/* timpul estimat, cât e în livrare */}
              {p.curenta && p.id === "in_preparare" && comanda.timpPreparare && <span className={styles.etapaDetaliu}>Gata în ~{comanda.timpPreparare} min</span>}{/* minutele cerute de restaurant */}
              <span className="sr-only">{p.stare === "gata" ? " (încheiat)" : p.stare === "acum" ? " (în curs)" : p.stare === "oprit" ? " (oprită)" : " (urmează)"}</span>{/* starea, pentru cititoarele de ecran */}
            </li>
          ))}{/* sfârșitul map-ului */}
        </ol>
        {oprita && comanda.motiv && <p className={styles.motiv}>Motiv: {comanda.motiv}</p>}{/* de ce s-a oprit comanda */}
        <p className={styles.aviz} role="status">{aviz}</p>{/* rezultatul anulării; regiunea există mereu, ca textul nou să fie anunțat */}

        {poateAnula && <AnulareComanda comanda={bruta} onAnulata={onActualizata} />}{/* anularea, cât încă e permisă */}

        <dl className={styles.campuri}>{/* tot ce nu încape în listă */}
          <div>{/* livrarea */}
            <dt>Livrare</dt>{/* termenul */}
            <dd>{comanda.livrare === "express" ? <span className="tag tag-express"><Zap size={13} aria-hidden="true" />{eticheta}</span> : eticheta}</dd>{/* doar Express primește culoare */}
          </div>
          {comanda.livrareStare && comanda.stare !== "plasata" && !oprita && ( // pasul livrării, după ce restaurantul a acceptat
            <div>{/* livratorul */}
              <dt>Livrator</dt>{/* termenul */}
              <dd>{ETICHETE_PAS_LIVRARE[comanda.livrareStare]}</dd>{/* ex. „Livratorul vine spre tine” */}
            </div>
          )}{/* sfârșitul randării condiționate */}
          {comanda.adresa && ( // doar la livrare
            <div>{/* adresa */}
              <dt>Adresă</dt>{/* termenul */}
              <dd className={styles.lung}>{comanda.adresa}</dd>{/* textul scris de client */}
            </div>
          )}{/* sfârșitul randării condiționate */}
          {comanda.contact && ( // comenzile plasate din coș
            <div>{/* contactul */}
              <dt>Contact</dt>{/* termenul */}
              <dd className={styles.lung}>{comanda.contact.nume}, {comanda.contact.telefon}</dd>{/* numele și telefonul */}
            </div>
          )}{/* sfârșitul randării condiționate */}
          <div>{/* plata */}
            <dt>Plată</dt>{/* termenul */}
            <dd>{ETICHETE_METODA_PLATA[comanda.plata.metoda]}, {ETICHETE_STARE_PLATA[comanda.plata.stare].toLowerCase()}</dd>{/* ex. „Card (simulare), plătită” */}
          </div>
          <div>{/* categoria */}
            <dt>Categorie</dt>{/* termenul */}
            <dd className={styles.categorie}><Iconita size={16} aria-hidden="true" />{comanda.categorie ?? "Necunoscută"}</dd>{/* iconița și numele */}
          </div>
          {plasata && ( // doar comenzile trimise din formular sau din coș au data plasării
            <div>{/* data plasării */}
              <dt>Plasată</dt>{/* termenul */}
              <dd><time dateTime={comanda.creata}>{plasata}</time></dd>{/* <time>: data exactă, citibilă și de mașini */}
            </div>
          )}{/* sfârșitul randării condiționate */}
          {programata && ( // comanda programată pentru o oră anume
            <div>{/* ora programată */}
              <dt>Programată pentru</dt>{/* termenul */}
              <dd><time dateTime={comanda.programataLa}>{programata}</time></dd>{/* data și ora */}
            </div>
          )}{/* sfârșitul randării condiționate */}
          <div>{/* numărul comenzii */}
            <dt>Număr comandă</dt>{/* termenul */}
            <dd className={styles.numar}>{comanda.id}</dd>{/* id-ul de la server */}
          </div>
        </dl>
      </div>
    </section>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Scheletul paginii: aceeași așezare, forme fără text; aria-hidden, textul „Se încarcă” e mai sus
function ScheletDetaliu() { // fără props
  return ( // JSX-ul scheletului
    <div className={styles.detaliu} aria-hidden="true">{/* aceeași grilă ca detaliul */}
      <div className={styles.media}><span className={`${styles.foto} skeleton`} /></div>{/* locul fotografiei */}
      <div className={`${styles.text} schelet-text`}>{/* locul textelor */}
        <span className={`skeleton skeleton-line ${styles.scheletTitlu}`} />{/* titlul mare */}
        <span className="skeleton skeleton-line" />{/* restaurantul */}
        <span className="skeleton skeleton-line skeleton-short" />{/* prețul */}
      </div>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
