import { useRef, useState } from "react";
import { CircleAlert, Plus, X } from "lucide-react";
import { createLivrator, deleteLivrator, updateLivrator } from "../api.js";
import { acelasiId, curataLivratori, curseLivrator, numeLivratorDemo, poateStergeLivrator, valideazaNumeLivrator, NUME_LIVRATOR_MAX } from "../livrator.js";
import styles from "./Panou.module.css";

// Livratorii demo în /admin: adaugă, redenumește, activează / dezactivează, șterge (doar fără cursă în lucru).
// Un livrator dezactivat iese offline și nu mai poate intra online sau accepta curse (regulă din browser, nu securitate).
export default function AdminLivratori({ livratori, setLivratori, comenzi, incarcare }) {
  const [numeNou, setNumeNou] = useState("");
  const [eroareNou, setEroareNou] = useState("");
  const [editat, setEditat] = useState(null);
  const [numeEditat, setNumeEditat] = useState("");
  const [eroareEditat, setEroareEditat] = useState("");
  const [deSters, setDeSters] = useState(null);
  const [inLucru, setInLucru] = useState(null);
  const [eroare, setEroare] = useState(null);
  const [aviz, setAviz] = useState("");
  const numeNouRef = useRef(null);
  const listaRef = useRef(null);

  function inlocuieste(actualizat) {
    const [curat] = curataLivratori([actualizat]);
    if (curat) setLivratori((prev) => prev.map((l) => (acelasiId(l.id, curat.id) ? curat : l)));
  }

  async function cu(id, cerere, eticheta) {
    if (inLucru !== null) return false;
    setInLucru(id);
    try {
      await cerere();
      setEroare(null);
      return true;
    } catch (err) {
      setAviz("");
      setEroare(`Nu am putut ${eticheta}: ${err.message}`);
      return false;
    } finally {
      setInLucru(null);
    }
  }

  async function adauga(e) {
    e.preventDefault();
    const mesaj = valideazaNumeLivrator(numeNou, livratori);
    if (mesaj) { setEroareNou(mesaj); numeNouRef.current?.focus(); return; }
    const nume = numeLivratorDemo(numeNou);
    const ok = await cu("nou", async () => {
      const creat = await createLivrator({ nume, online: false, activ: true });
      const [curat] = curataLivratori([creat]);
      if (curat) setLivratori((prev) => [...prev, curat]);
    }, "adăuga livratorul");
    if (ok) { setNumeNou(""); setEroareNou(""); setAviz(`${nume} a fost adăugat.`); }
  }

  async function redenumeste(e, l) {
    e.preventDefault();
    const mesaj = valideazaNumeLivrator(numeEditat, livratori, l.id);
    if (mesaj) { setEroareEditat(mesaj); return; }
    const nume = numeLivratorDemo(numeEditat);
    const ok = await cu(l.id, async () => inlocuieste(await updateLivrator(l.id, { nume })), "redenumi livratorul");
    if (ok) { setEditat(null); setAviz(`Livratorul se numește acum ${nume}.`); listaRef.current?.focus(); }
  }

  async function comutaActiv(l) {
    const corp = l.activ ? { activ: false, online: false } : { activ: true };
    const ok = await cu(l.id, async () => inlocuieste(await updateLivrator(l.id, corp)), l.activ ? "dezactiva livratorul" : "activa livratorul");
    if (ok) setAviz(l.activ ? `${l.nume} e dezactivat și offline.` : `${l.nume} e din nou activ.`);
  }

  async function sterge(l) {
    if (!poateStergeLivrator(comenzi, l.id)) return;
    const ok = await cu(l.id, async () => {
      await deleteLivrator(l.id);
      setLivratori((prev) => prev.filter((x) => !acelasiId(x.id, l.id)));
    }, "șterge livratorul");
    if (ok) { setDeSters(null); setAviz(`${l.nume} a fost șters.`); listaRef.current?.focus(); }
  }

  return (
    <section className={styles.sectiune} aria-labelledby="admin-livratori-titlu">
      <h2 id="admin-livratori-titlu" ref={listaRef} tabIndex={-1} className={`titlu-focus ${styles.sectiuneTitlu}`}>Livratori</h2>
      <p className={styles.nota}>Livratorii sunt conturi demo: numele lor spune asta. Un livrator cu o cursă în lucru nu poate fi șters.</p>
      {eroare && (
        <div className={`error ${styles.avertisment}`}>
          <CircleAlert size={20} aria-hidden="true" />
          <p role="alert">{eroare}</p>
          <button type="button" className="btn-close" onClick={() => setEroare(null)} aria-label="Închide mesajul de eroare"><X size={18} aria-hidden="true" /></button>
        </div>
      )}
      <p className={styles.aviz} role="status">{aviz}</p>

      <form className={`${styles.card} ${styles.formularRand}`} onSubmit={adauga} noValidate aria-label="Livrator nou">
        <div className={styles.camp}>
          <label htmlFor="livrator-nou">Livrator nou</label>
          <input id="livrator-nou" ref={numeNouRef} type="text" value={numeNou} maxLength={NUME_LIVRATOR_MAX} placeholder="ex. Ana" onChange={(e) => { setNumeNou(e.target.value); setEroareNou(""); }} aria-invalid={eroareNou !== ""} aria-describedby={eroareNou ? "livrator-nou-eroare" : "livrator-nou-indiciu"} />
          <span id="livrator-nou-indiciu" className={styles.indiciu}>Primește automat „(livrator demo)” în nume.</span>
          {eroareNou && <p id="livrator-nou-eroare" className={styles.eroare} role="alert"><CircleAlert size={16} aria-hidden="true" />{eroareNou}</p>}
        </div>
        <button type="submit" className="btn-primary" aria-disabled={inLucru === "nou"}><Plus size={18} aria-hidden="true" />{inLucru === "nou" ? "Se adaugă…" : "Adaugă"}</button>
      </form>

      {incarcare ? <p className="info" role="status">Se încarcă livratorii…</p> : livratori.length === 0 ? (
        <p className={styles.gol}>Niciun livrator. Adaugă unul mai sus.</p>
      ) : (
        <ul className={`${styles.lista} ${styles.sectiuneMica}`}>
          {livratori.map((l) => {
            const ocupat = inLucru === l.id;
            const inLucruCurse = curseLivrator(comenzi, l.id).length;
            const titluId = `admin-livrator-${l.id}`;
            return (
              <li key={l.id}>
                <article className={styles.card} aria-labelledby={titluId}>
                  <div className={styles.cardSus}>
                    <h3 id={titluId} className={styles.cardTitlu}>{l.nume}</h3>
                    <span className={`${styles.stare} ${l.activ ? "" : styles.stareOprita}`}>{l.activ ? (l.online ? "Activ, online" : "Activ, offline") : "Dezactivat"}</span>
                  </div>
                  {inLucruCurse > 0 && <p className={styles.indiciu}>Are o cursă în lucru.</p>}
                  {editat === l.id ? (
                    <form className={styles.formular} onSubmit={(e) => redenumeste(e, l)} noValidate>
                      <div className={styles.camp}>
                        <label htmlFor={`${titluId}-nume`}>Numele nou</label>
                        <input id={`${titluId}-nume`} type="text" value={numeEditat} maxLength={NUME_LIVRATOR_MAX} autoFocus onChange={(e) => { setNumeEditat(e.target.value); setEroareEditat(""); }} aria-invalid={eroareEditat !== ""} aria-describedby={eroareEditat ? `${titluId}-eroare` : undefined} />
                        {eroareEditat && <p id={`${titluId}-eroare`} className={styles.eroare} role="alert"><CircleAlert size={16} aria-hidden="true" />{eroareEditat}</p>}
                      </div>
                      <div className={styles.butoane}>
                        <button type="submit" className="btn-primary" aria-disabled={ocupat}>{ocupat ? "Se salvează…" : "Salvează"}</button>
                        <button type="button" className="btn-secondary" onClick={() => setEditat(null)}>Renunță</button>
                      </div>
                    </form>
                  ) : deSters === l.id ? (
                    <div className={styles.formular}>
                      <p>Ștergi livratorul {l.nume}? Comenzile predate de el rămân în istoric.</p>
                      <div className={styles.butoane}>
                        <button type="button" className={styles.butonPericol} aria-disabled={ocupat} onClick={() => sterge(l)}>{ocupat ? "Se șterge…" : "Șterge livratorul"}</button>
                        <button type="button" className="btn-secondary" onClick={() => setDeSters(null)}>Renunță</button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.actiuni}>
                      <button type="button" className="btn-secondary" onClick={() => { setEditat(l.id); setNumeEditat(l.nume.replace(/\s*\(livrator demo\)$/i, "")); setEroareEditat(""); setDeSters(null); setAviz(""); }}>Redenumește</button>
                      <button type="button" className="btn-secondary" aria-disabled={ocupat} onClick={() => comutaActiv(l)}>{ocupat ? "Se trimite…" : l.activ ? "Dezactivează" : "Activează"}</button>
                      {inLucruCurse === 0 ? (
                        <button type="button" className="btn-secondary" onClick={() => { setDeSters(l.id); setEditat(null); setAviz(""); }}>Șterge</button>
                      ) : (
                        <span className={styles.indiciu}>Nu poate fi șters cât are o cursă în lucru.</span>
                      )}
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
