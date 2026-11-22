import { useEffect, useRef, useState } from "react"; // useState: textul, eroarea, trimiterea; useRef + useEffect: focus în câmp
import { CircleAlert } from "lucide-react"; // iconița erorii
import { MOTIV_MAX, valideazaMotiv } from "../stari.js"; // aceeași regulă ca la anularea clientului
import styles from "./Panou.module.css"; // stilurile comune ale panourilor (CSS Modules)

// Pachetul B: confirmarea pe loc a unei respingeri (restaurant) sau anulări (admin), cu motiv obligatoriu.
// Fără dialog: formularul apare în cardul comenzii. `onConfirma(motiv)` trimite cererea; dacă aruncă, mesajul apare aici.
// Pagina închide formularul după succes (îl scoate din pagină).
export default function FormularMotiv({ id, intrebare, textConfirma, onConfirma, onRenunta }) { // id unic, întrebarea, textul butonului și cele două acțiuni
  const [motiv, setMotiv] = useState(""); // textul scris
  const [eroare, setEroare] = useState(""); // mesajul de eroare ("" = niciunul)
  const [trimite, setTrimite] = useState(false); // true cât așteptăm serverul
  const campRef = useRef(null); // câmpul motivului

  useEffect(() => { // la deschidere
    campRef.current?.focus(); // utilizatorul poate scrie imediat
  }, []); // o singură dată

  async function handleSubmit(e) { // „Confirmă”
    e.preventDefault(); // fără reîncărcarea paginii
    if (trimite) return; // o cerere e deja în curs
    const problema = valideazaMotiv(motiv); // null sau mesajul
    if (problema) { setEroare(problema); campRef.current?.focus(); return; } // motiv lipsă sau prea lung
    setTrimite(true); // butonul arată „Se trimite…”
    setEroare(""); // fără mesaje vechi
    try { // cererea poate eșua
      await onConfirma(motiv.trim()); // pagina trimite PATCH-ul și închide formularul
    } catch (err) { // server oprit sau comanda s-a schimbat între timp
      setEroare(err.message); // ce s-a întâmplat
      setTrimite(false); // se poate încerca din nou
    } // sfârșitul try/catch
  } // sfârșitul funcției

  return ( // JSX-ul formularului
    <form className={styles.formular} onSubmit={handleSubmit} noValidate>{/* noValidate: mesajele sunt cele din cod */}
      <div className={styles.camp}>{/* eticheta și câmpul */}
        <label htmlFor={`${id}-motiv`}>{intrebare}</label>{/* ex. „De ce respingi comanda?” */}
        <input id={`${id}-motiv`} ref={campRef} type="text" value={motiv} onChange={(e) => setMotiv(e.target.value)} maxLength={MOTIV_MAX} autoComplete="off" aria-invalid={eroare !== "" && valideazaMotiv(motiv) !== null} aria-describedby={eroare ? `${id}-eroare` : undefined} />{/* câmp controlat */}
      </div>
      {eroare && <p id={`${id}-eroare`} className={styles.eroare} role="alert"><CircleAlert size={16} aria-hidden="true" />{eroare}</p>}{/* mesajul, anunțat imediat */}
      <div className={styles.butoane}>{/* confirmarea și renunțarea */}
        <button type="submit" className={styles.butonPericol} aria-disabled={trimite}>{trimite ? "Se trimite…" : textConfirma}</button>{/* aria-disabled: butonul rămâne focalizabil */}
        <button type="button" className="btn-secondary" onClick={onRenunta}>Renunță</button>{/* închide formularul, comanda rămâne */}
      </div>
    </form>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
