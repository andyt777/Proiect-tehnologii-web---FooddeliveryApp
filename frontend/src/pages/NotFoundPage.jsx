import { useEffect, useRef } from "react"; // useRef + useEffect: focus pe titlu când se deschide pagina
import { Link } from "react-router-dom"; // drumul înapoi, fără reîncărcare
import styles from "./NotFoundPage.module.css"; // stilurile paginii (CSS Modules)

// Etapa 8: pagina pentru adresele inexistente (ruta „*” din App.jsx), de exemplu /ceva; redesign: și /restaurante/necunoscut.
// data-testid="not-found" e reperul căutat de verificarea automată.
export default function NotFoundPage() { // componenta rutei „*”
  const titluRef = useRef(null); // titlul paginii

  // La deschidere, focusul merge pe titlu: cititorul de ecran anunță că pagina nu există
  useEffect(() => { // rulează o dată, după prima randare
    titluRef.current?.focus({ preventScroll: true }); // titlul are tabIndex -1
  }, []); // fără dependențe: doar la deschidere

  return ( // JSX-ul paginii
    <div className={`wrap ${styles.pagina}`}>{/* containerul centrat */}
      <section className={styles.card} data-testid="not-found" aria-labelledby="not-found-titlu">{/* conținutul, aliniat în stânga */}
        <p className={styles.cod} aria-hidden="true">404</p>{/* codul, mare și decorativ (titlul spune același lucru) */}
        <h1 id="not-found-titlu" className={`titlu-focus ${styles.titlu}`} ref={titluRef} tabIndex={-1}>Pagina nu există</h1>{/* titlul */}
        <p className={styles.text}>Adresa nu duce la nicio pagină din Savoro. Poate a fost scrisă greșit. Pornește de pe pagina principală.</p>{/* ce s-a întâmplat și ce e de făcut */}
        <Link to="/" className="btn-primary">Mergi la pagina principală</Link>{/* drumul spre pagina principală */}
      </section>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
