import { useEffect, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import { createRecenzie, fetchRecenzii } from "../api.js";
import { formatData } from "../format.js";
import { ETICHETE_NOTA, NOTA_MAX, NOTA_MIN, TEXT_RECENZIE_MAX, curataRecenzii, poateLasaRecenzie, recenziaComenzii, recenzieNoua, valideazaRecenzie } from "../recenzii.js";
import styles from "./RecenzieComanda.module.css";

const NOTE = Array.from({ length: NOTA_MAX - NOTA_MIN + 1 }, (_, i) => NOTA_MAX - i);

// Pachetul C: recenzia unei comenzi livrate, pe pagina de detaliu. O singură recenzie pentru fiecare comandă.
// Recenziile se citesc de la server la deschidere; dacă cererea eșuează, comanda se vede normal și apare doar un mesaj scurt.
// Validarea e doar în browser (json-server acceptă orice POST), deci nu e securitate.
export default function RecenzieComanda({ comanda }) {
  const [recenzii, setRecenzii] = useState(null);
  const [eroareCitire, setEroareCitire] = useState(null);
  const [nota, setNota] = useState(null);
  const [text, setText] = useState("");
  const [problema, setProblema] = useState(null);
  const [eroareTrimitere, setEroareTrimitere] = useState("");
  const [trimite, setTrimite] = useState(false);
  const [aviz, setAviz] = useState("");
  const titluRef = useRef(null);
  const primaNotaRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    let ignore = false;
    fetchRecenzii()
      .then((lista) => { if (!ignore) setRecenzii(curataRecenzii(lista)); })
      .catch((err) => { if (!ignore) setEroareCitire(err.message); });
    return () => { ignore = true; };
  }, []);

  if (eroareCitire) {
    return (
      <section className={styles.sectiune} aria-labelledby="recenzie-titlu">
        <h2 id="recenzie-titlu" className={styles.titlu}>Recenzie</h2>
        <p className={styles.indiciu}>Nu am putut încărca recenziile ({eroareCitire}). Încearcă mai târziu.</p>
      </section>
    );
  }
  if (recenzii === null) return null;

  const existenta = recenziaComenzii(recenzii, comanda.id);

  async function handleSubmit(e) {
    e.preventDefault();
    if (trimite) return;
    const gresit = valideazaRecenzie({ nota, text });
    if (gresit) {
      setProblema(gresit);
      (gresit.camp === "nota" ? primaNotaRef : textRef).current?.focus();
      return;
    }
    setProblema(null);
    setEroareTrimitere("");
    setTrimite(true);
    try {
      // Citim din nou lista: poate recenzia a fost trimisă între timp din alt tab
      const proaspete = curataRecenzii(await fetchRecenzii());
      if (!poateLasaRecenzie(comanda, proaspete)) {
        setRecenzii(proaspete);
        setAviz("Comanda are deja o recenzie.");
        titluRef.current?.focus();
        return;
      }
      const trimisa = recenzieNoua({ comanda, nota, text });
      const salvata = await createRecenzie(trimisa);
      // Afișăm ce a întors serverul; dacă răspunsul are altă formă, rămâne ce am trimis (cu un id provizoriu)
      setRecenzii([...proaspete, ...curataRecenzii([{ ...trimisa, id: "nou", ...(salvata ?? {}) }])]);
      setAviz("Mulțumim! Recenzia a fost salvată.");
      titluRef.current?.focus();
    } catch (err) {
      setEroareTrimitere(`Recenzia nu a fost trimisă: ${err.message}. Încearcă din nou.`);
    } finally {
      setTrimite(false);
    }
  }

  const data = existenta ? formatData(existenta.creata) : null;

  return (
    <section className={styles.sectiune} aria-labelledby="recenzie-titlu">
      <h2 id="recenzie-titlu" ref={titluRef} tabIndex={-1} className={`titlu-focus ${styles.titlu}`}>{existenta ? "Recenzia ta" : "Cum a fost?"}</h2>
      <p className={styles.aviz} role="status">{aviz}</p>
      {existenta ? (
        <div className={styles.recenzie}>
          <p className={styles.nota}><strong>{existenta.nota} din {NOTA_MAX}</strong>, {ETICHETE_NOTA[existenta.nota].toLowerCase()}</p>
          {existenta.text && <p className={styles.text}>{existenta.text}</p>}
          {data && <p className={styles.indiciu}>Trimisă pe <time dateTime={existenta.creata}>{data}</time></p>}
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <fieldset className={styles.grup} aria-describedby={problema?.camp === "nota" ? "recenzie-eroare" : undefined}>
            <legend className={styles.legenda}>Nota ta pentru {comanda.restaurant}</legend>
            <div className={styles.note}>
              {NOTE.map((n, i) => (
                <label key={n} className={styles.optiune}>
                  <input type="radio" name="recenzie-nota" value={n} checked={nota === n} onChange={() => { setNota(n); if (problema?.camp === "nota") setProblema(null); }} ref={i === 0 ? primaNotaRef : undefined} />
                  <span className={styles.optiuneNumar}>{n}</span>
                  <span className={styles.optiuneText}>{ETICHETE_NOTA[n]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className={styles.camp}>
            <label htmlFor="recenzie-text">Câteva cuvinte (opțional)</label>
            <textarea
              id="recenzie-text"
              ref={textRef}
              rows={3}
              value={text}
              onChange={(e) => { setText(e.target.value); if (problema?.camp === "text") setProblema(null); }}
              maxLength={TEXT_RECENZIE_MAX}
              aria-invalid={problema?.camp === "text"}
              aria-describedby={problema?.camp === "text" ? "recenzie-text-numar recenzie-eroare" : "recenzie-text-numar"}
            />
            <span id="recenzie-text-numar" className={styles.indiciu}>{text.trim().length} din {TEXT_RECENZIE_MAX} de caractere</span>
          </div>
          {problema && <p id="recenzie-eroare" className={styles.eroareCamp} role="alert"><CircleAlert size={16} aria-hidden="true" />{problema.mesaj}</p>}
          {eroareTrimitere && <p className={styles.eroare} role="alert"><CircleAlert size={18} aria-hidden="true" />{eroareTrimitere}</p>}
          <div>
            <button type="submit" className="btn-primary" aria-disabled={trimite}>{trimite ? "Se trimite…" : "Trimite recenzia"}</button>
          </div>
        </form>
      )}
    </section>
  );
}
