import { useEffect, useRef, useState } from "react"; // useState: câmpurile, eroarea, trimiterea; useRef + useEffect: focus
import { CircleAlert } from "lucide-react"; // iconița erorii
import { PRET_MAXIM, TIMP_PREPARARE_MAX, TIMP_PREPARARE_MIN, valideazaAcceptare } from "../stari.js"; // regulile acceptării
import { TIMP_PREPARARE_IMPLICIT_MIN } from "../metrici.js"; // valoarea propusă (aceeași ca în regula întârzierii)
import styles from "./Panou.module.css"; // stilurile comune ale panourilor (CSS Modules)

// Pachetul B: acceptarea unei comenzi de către restaurant: câte minute durează prepararea și, pentru o
// „Comandă specială” fără preț (pret: null), prețul. `onConfirma({ timpPreparare, pret })` trimite cererea.
export default function FormularAcceptare({ comanda, onConfirma, onRenunta }) { // comanda, trimiterea și renunțarea
  const cerePret = !(Number.isInteger(comanda.pret) && comanda.pret > 0); // comanda specială încă fără preț
  const [timp, setTimp] = useState(String(TIMP_PREPARARE_IMPLICIT_MIN)); // minutele, ca text (valoarea câmpului)
  const [pret, setPret] = useState(""); // prețul, ca text
  const [eroare, setEroare] = useState(""); // mesajul de eroare ("" = niciunul)
  const [trimite, setTrimite] = useState(false); // true cât așteptăm serverul
  const timpRef = useRef(null); // câmpul minutelor
  const id = `acceptare-${comanda.id}`; // prefixul id-urilor din formular

  useEffect(() => { // la deschidere
    timpRef.current?.focus(); // primul câmp
  }, []); // o singură dată

  async function handleSubmit(e) { // „Acceptă”
    e.preventDefault(); // fără reîncărcarea paginii
    if (trimite) return; // o cerere e deja în curs
    const valori = { timpPreparare: Number(timp), pret: cerePret ? Number(pret) : undefined }; // textele devin numere („” devine 0, deci e respins)
    const problema = valideazaAcceptare(valori, comanda); // null sau mesajul
    if (problema) { setEroare(problema); timpRef.current?.focus(); return; } // valori greșite
    setTrimite(true); // butonul arată „Se trimite…”
    setEroare(""); // fără mesaje vechi
    try { // cererea poate eșua
      await onConfirma(valori); // pagina trimite PATCH-ul și închide formularul
    } catch (err) { // server oprit sau comanda s-a schimbat între timp
      setEroare(err.message); // ce s-a întâmplat
      setTrimite(false); // se poate încerca din nou
    } // sfârșitul try/catch
  } // sfârșitul funcției

  return ( // JSX-ul formularului
    <form className={styles.formular} onSubmit={handleSubmit} noValidate>{/* noValidate: mesajele sunt cele din cod */}
      <div className={styles.campuri}>{/* câmpurile, alăturate pe ecrane late */}
        <div className={styles.camp}>{/* minutele */}
          <label htmlFor={`${id}-timp`}>Timp de preparare (minute)</label>{/* eticheta */}
          <input id={`${id}-timp`} ref={timpRef} type="number" inputMode="numeric" min={TIMP_PREPARARE_MIN} max={TIMP_PREPARARE_MAX} step={1} value={timp} onChange={(e) => setTimp(e.target.value)} aria-describedby={eroare ? `${id}-eroare` : undefined} />{/* câmp controlat */}
        </div>
        {cerePret && ( // doar pentru comanda specială
          <div className={styles.camp}>{/* prețul */}
            <label htmlFor={`${id}-pret`}>Preț (lei)</label>{/* eticheta */}
            <input id={`${id}-pret`} type="number" inputMode="numeric" min={1} max={PRET_MAXIM} step={1} value={pret} onChange={(e) => setPret(e.target.value)} aria-describedby={eroare ? `${id}-eroare` : undefined} />{/* câmp controlat */}
          </div>
        )}{/* sfârșitul randării condiționate */}
      </div>
      {eroare && <p id={`${id}-eroare`} className={styles.eroare} role="alert"><CircleAlert size={16} aria-hidden="true" />{eroare}</p>}{/* mesajul, anunțat imediat */}
      <div className={styles.butoane}>{/* acceptarea și renunțarea */}
        <button type="submit" className="btn-primary" aria-disabled={trimite}>{trimite ? "Se trimite…" : "Acceptă comanda"}</button>{/* acțiunea principală */}
        <button type="button" className="btn-secondary" onClick={onRenunta}>Renunță</button>{/* închide formularul */}
      </div>
    </form>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
