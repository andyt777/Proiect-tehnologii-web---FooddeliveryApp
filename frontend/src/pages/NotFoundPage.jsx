import { useEffect, useRef } from "react"; // useRef + useEffect: focus pe titlu când se deschide pagina
import { Link } from "react-router-dom"; // drumul înapoi, fără reîncărcare
import { ArrowLeft } from "lucide-react"; // săgeata de pe buton
import styles from "./NotFoundPage.module.css"; // stilurile paginii (CSS Modules)

// Etapa 8: pagina pentru adresele inexistente (ruta „*” din App.jsx), de exemplu /ceva.
// data-testid="not-found" e reperul căutat de verificarea automată.
export default function NotFoundPage() { // componenta rutei „*”
  const titluRef = useRef(null); // titlul paginii

  // La deschidere, focusul merge pe titlu: cititorul de ecran anunță că pagina nu există
  useEffect(() => { // rulează o dată, după prima randare
    titluRef.current?.focus({ preventScroll: true }); // titlul are tabIndex -1; derularea o face Layout
  }, []); // fără dependențe: doar la deschidere

  return ( // JSX-ul paginii
    <div className={`wrap ${styles.pagina}`}>{/* containerul centrat */}
      <section className={`panel ${styles.card}`} data-testid="not-found" aria-labelledby="not-found-titlu">{/* panoul global, centrat */}
        <p className={styles.cod} aria-hidden="true">404</p>{/* codul, mare și decorativ (titlul spune același lucru) */}
        <h2 id="not-found-titlu" className={`titlu-focus ${styles.titlu}`} ref={titluRef} tabIndex={-1}>Pagina nu există</h2>{/* titlul */}
        <p className={styles.text}>Adresa cerută nu duce nicăieri. Poate a fost scrisă greșit sau pagina a fost mutată.</p>{/* explicația */}
        <Link to="/" className="btn-primary">{/* drumul spre pagina principală */}
          <ArrowLeft size={18} aria-hidden="true" />{/* iconiță decorativă */}
          Înapoi la comenzi{/* textul butonului */}
        </Link>
      </section>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
