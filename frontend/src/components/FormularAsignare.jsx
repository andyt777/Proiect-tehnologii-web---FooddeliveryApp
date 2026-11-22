import { useEffect, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import { acelasiId } from "../livrator.js";
import styles from "./Panou.module.css";

// Pachetul B: asignarea manuală a unui livrator din /admin, confirmată pe loc în cardul comenzii.
// `onConfirma(livrator)` trimite cererea; dacă aruncă, mesajul apare aici. Livratorii offline pot fi aleși, dar sunt marcați.
export default function FormularAsignare({ id, livratori, onConfirma, onRenunta }) {
  const [ales, setAles] = useState(() => String((livratori.find((l) => l.online) ?? livratori[0])?.id ?? ""));
  const [eroare, setEroare] = useState("");
  const [trimite, setTrimite] = useState(false);
  const campRef = useRef(null);

  useEffect(() => {
    campRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (trimite) return;
    const livrator = livratori.find((l) => acelasiId(l.id, ales));
    if (!livrator) { setEroare("Alege un livrator din listă."); campRef.current?.focus(); return; }
    setTrimite(true);
    setEroare("");
    try {
      await onConfirma(livrator);
    } catch (err) {
      setEroare(err.message);
      setTrimite(false);
    }
  }

  if (livratori.length === 0) {
    return (
      <div className={styles.formular}>
        <p className={styles.indiciu}>Lista livratorilor nu e disponibilă. Reîncarcă pagina după ce pornești serverul.</p>
        <div className={styles.butoane}><button type="button" className="btn-secondary" onClick={onRenunta}>Renunță</button></div>
      </div>
    );
  }

  return (
    <form className={styles.formular} onSubmit={handleSubmit} noValidate>
      <div className={styles.camp}>
        <label htmlFor={`${id}-livrator`}>Livratorul</label>
        <select id={`${id}-livrator`} ref={campRef} value={ales} onChange={(e) => setAles(e.target.value)} aria-describedby={eroare ? `${id}-eroare` : undefined}>
          {livratori.map((l) => <option key={l.id} value={String(l.id)}>{l.online ? l.nume : `${l.nume}, offline`}</option>)}
        </select>
      </div>
      {eroare && <p id={`${id}-eroare`} className={styles.eroare} role="alert"><CircleAlert size={16} aria-hidden="true" />{eroare}</p>}
      <div className={styles.butoane}>
        <button type="submit" className="btn-primary" aria-disabled={trimite}>{trimite ? "Se trimite…" : "Asignează"}</button>
        <button type="button" className="btn-secondary" onClick={onRenunta}>Renunță</button>
      </div>
    </form>
  );
}
