import { useEffect, useRef, useState } from "react"; // useState: comanda, încărcarea și eroarea; useEffect: cererea; useRef: focus pe titlu
import { Link, useParams } from "react-router-dom"; // Link: drumul înapoi fără reîncărcare; useParams: id-ul din adresă
import { ArrowLeft, CircleAlert, CircleCheck, Clock, Sparkles, Utensils } from "lucide-react"; // iconițele paginii
import { fetchComanda } from "../api.js"; // GET /comenzi/:id, prin singurul fișier cu fetch
import { ICONITE_CATEGORIE } from "../categorii.js"; // iconița categoriei, când comanda nu are fotografie
import { imagineComanda } from "../imagini.js"; // fotografia preparatului (sau null)
import { DURATE_LIVRARE, ETICHETE_LIVRARE } from "../livrare.js"; // tipul livrării și timpul estimat
import { formatData, formatLei } from "../format.js"; // prețul în lei și data plasării, în format românesc
import { arePret } from "../rezumat.js"; // comanda specială are pret: null până la confirmare
import styles from "./ComandaDetaliuPage.module.css"; // stilurile paginii (CSS Modules)

// Etapa 8: pagina unei singure comenzi, la /comenzi/:id. Citește id-ul din adresă și cere de la server exact acea comandă.
// key={id}: când adresa trece la altă comandă (Înapoi / Înainte între două detalii), React creează o componentă nouă,
// deci state-ul pornește iar de la loading = true și error = null, fără setState la începutul efectului.
export default function ComandaDetaliuPage() { // componenta rutei
  const { id } = useParams(); // text din URL, de exemplu "3" (useParams întoarce mereu text)
  return <DetaliuComanda key={id} id={id} />; // o componentă nouă pentru fiecare id
} // sfârșitul componentei

function DetaliuComanda({ id }) { // conținutul paginii, pentru un singur id
  const [comanda, setComanda] = useState(null); // comanda de la server (null până sosește)
  const [loading, setLoading] = useState(true); // pornește direct cu true: efectul nu mai apelează setLoading(true)
  const [error, setError] = useState(null); // pornește cu null: efectul nu mai apelează setError(null)
  const titluRef = useRef(null); // titlul comenzii, primește focusul după încărcare

  // Cererea pleacă după prima randare. Regula de lint react-hooks/set-state-in-effect interzice setState direct în efect,
  // de aceea starea inițială e deja „se încarcă”, iar setState se apelează doar în .then / .catch / .finally.
  useEffect(() => { // efect secundar: sincronizăm pagina cu serverul
    let ignore = false; // devine true dacă efectul e anulat (StrictMode sau altă comandă)
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

  // Când comanda apare, ducem focusul pe titlu: cititorul de ecran anunță ce pagină s-a deschis, iar Tab continuă de aici
  useEffect(() => { // rulează după randarea în care a sosit comanda
    if (comanda) titluRef.current?.focus(); // titlul are tabIndex -1 (focus doar din cod)
  }, [comanda]); // dependența: comanda

  return ( // JSX-ul paginii
    <div className={`wrap ${styles.pagina}`}>{/* containerul centrat */}
      <Link to="/" className={styles.inapoi}>{/* drumul înapoi la listă, fără reîncărcare */}
        <ArrowLeft size={18} aria-hidden="true" />{/* săgeata „←”, decorativă */}
        Înapoi la comenzi{/* textul linkului */}
      </Link>

      {loading && ( // comanda nu a sosit încă
        <>{/* mesajul și scheletul */}
          <p className="info" role="status" data-testid="loading">Se încarcă comanda…</p>{/* reperul pentru verificarea automată; anunțat de cititoarele de ecran */}
          <ScheletDetaliu />{/* forme gri cu așezarea paginii, doar decor */}
        </>
      )}{/* sfârșitul randării condiționate */}

      {error && ( // cererea a eșuat (ex. /comenzi/999 -> 404)
        <div className="error">{/* panoul de eroare global, ca pe pagina comenzilor */}
          <CircleAlert size={22} aria-hidden="true" />{/* iconiță decorativă */}
          <div className="error-body">{/* textul și butonul */}
            <p role="alert" data-testid="error">Comanda nu a putut fi încărcată: {error}.</p>{/* ex. „Eroare server: 404”, mesajul din request() */}
            <p className={styles.indiciu}>Poate a fost ștearsă sau adresa e greșită.</p>{/* ce înseamnă, pe înțelesul utilizatorului */}
            <Link to="/" className="btn-primary">Vezi toate comenzile</Link>{/* drumul înapoi, nu un ecran gol */}
          </div>
        </div>
      )}{/* sfârșitul randării condiționate */}

      {comanda && <Detaliu comanda={comanda} titluRef={titluRef} />}{/* comanda sosită */}
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Comanda propriu-zisă: fotografia mare în stânga, textele în dreapta (una sub alta pe telefon)
function Detaliu({ comanda, titluRef }) { // primește comanda de la server și referința titlului
  const Iconita = ICONITE_CATEGORIE[comanda.categorie] ?? Utensils; // iconița categoriei (tacâmuri pentru una necunoscută)
  const imagine = comanda.speciala ? null : imagineComanda(comanda); // ca pe card: preparatul cerut special nu are fotografie proprie
  const plasata = formatData(comanda.creata); // „16 noiembrie 2026 la 12:00” sau null (comenzile vechi nu au dată)
  const eticheta = ETICHETE_LIVRARE[comanda.livrare] ?? comanda.livrare; // „Express”; un tip necunoscut apare așa cum e

  return ( // JSX-ul detaliului
    <section className={styles.detaliu} data-testid="detail" aria-labelledby="detaliu-titlu">{/* reperul paginii de detaliu */}
      <div className={styles.media}>{/* coloana cu fotografia */}
        {imagine ? ( // avem fotografia preparatului
          <img className={styles.foto} src={imagine} alt="" width="720" height="540" decoding="async" />// decorativă: numele e chiar în titlu
        ) : ( // comandă specială sau preparat fără fotografie
          <span className={`${styles.foto} ${styles.fotoGol}`} aria-hidden="true"><Iconita size={96} strokeWidth={1.25} /></span>// iconița categoriei, în aceeași cutie
        )}{/* sfârșitul randării condiționate */}
      </div>

      <div className={styles.text}>{/* coloana cu textele */}
        <p className={styles.eyebrow}>{/* supratitlul: categoria și eticheta specială */}
          <span>{comanda.categorie ?? "Comandă"}</span>{/* ex. „Pizza” */}
          {comanda.speciala && <span className="badge badge-speciala"><Sparkles size={12} aria-hidden="true" />Comandă specială</span>}{/* aceeași etichetă ca pe card */}
        </p>
        <h2 id="detaliu-titlu" className={`titlu-focus ${styles.titlu}`} ref={titluRef} tabIndex={-1} data-testid="detail-title">{comanda.preparat}</h2>{/* titlul; tabIndex -1: focus doar din cod */}
        <p className={styles.restaurant}>de la {comanda.restaurant}</p>{/* restaurantul, sub titlu */}
        <p className={styles.pret}>{/* prețul, mare */}
          {arePret(comanda) ? <span className="price">{formatLei(comanda.pret)}</span> : <span className="price price-asteptare">Preț la confirmare</span>}{/* fără preț inventat pentru comenzile speciale */}
        </p>

        <dl className={styles.campuri}>{/* tot ce nu încape pe card, ca listă de termeni */}
          <div>{/* o pereche termen / valoare */}
            <dt>Stare</dt>{/* termenul */}
            <dd>{/* valoarea */}
              <span className={comanda.livrata ? `${styles.stare} ${styles.livrata}` : styles.stare}>{/* pastilă: bleu pentru livrată */}
                {comanda.livrata ? <CircleCheck size={16} aria-hidden="true" /> : <Clock size={16} aria-hidden="true" />}{/* forma spune starea, nu doar culoarea */}
                {comanda.livrata ? "Livrată" : "Pe drum"}{/* textul stării */}
              </span>
            </dd>
          </div>
          <div>{/* livrarea */}
            <dt>Livrare</dt>{/* termenul */}
            <dd className={styles.livrare}>{/* eticheta și timpul */}
              <span className={`badge badge-${comanda.livrare}`}><span className="dot" aria-hidden="true" />{eticheta}</span>{/* eticheta colorată, ca pe card */}
              <span>{comanda.livrata ? "Comandă încheiată" : DURATE_LIVRARE[comanda.livrare]}</span>{/* ex. „Sosește în ~20 min” */}
            </dd>
          </div>
          <div>{/* restaurantul */}
            <dt>Restaurant</dt>{/* termenul */}
            <dd>{comanda.restaurant}</dd>{/* ex. „Sushi Kyo” */}
          </div>
          <div>{/* categoria */}
            <dt>Categorie</dt>{/* termenul */}
            <dd className={styles.categorie}><Iconita size={16} aria-hidden="true" />{comanda.categorie ?? "—"}</dd>{/* iconița și numele */}
          </div>
          {plasata && ( // doar comenzile trimise din formular sau din coș au data plasării
            <div>{/* data plasării */}
              <dt>Plasată</dt>{/* termenul */}
              <dd><time dateTime={comanda.creata}>{plasata}</time></dd>{/* <time>: data exactă, citibilă și de mașini */}
            </div>
          )}{/* sfârșitul randării condiționate */}
          <div>{/* numărul comenzii */}
            <dt>Număr comandă</dt>{/* termenul */}
            <dd>#{comanda.id}</dd>{/* id-ul de la server */}
          </div>
        </dl>
      </div>
    </section>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Scheletul paginii: aceeași așezare (fotografie + texte), forme gri fără text; aria-hidden, textul „Se încarcă” e mai sus
function ScheletDetaliu() { // fără props
  return ( // JSX-ul scheletului
    <div className={styles.detaliu} aria-hidden="true">{/* aceeași grilă ca detaliul */}
      <div className={styles.media}><span className={`${styles.foto} skeleton`} /></div>{/* locul fotografiei */}
      <div className={`${styles.text} schelet-text`}>{/* locul textelor */}
        <span className="skeleton skeleton-line skeleton-short" />{/* supratitlul */}
        <span className={`skeleton skeleton-line ${styles.scheletTitlu}`} />{/* titlul mare */}
        <span className="skeleton skeleton-line" />{/* restaurantul */}
        <span className="skeleton skeleton-line skeleton-short" />{/* prețul */}
      </div>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
