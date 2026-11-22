import { useState } from "react";
import { CircleAlert, Plus, RotateCw, X } from "lucide-react";
import FormularPreparat from "./FormularPreparat.jsx";
import { createPreparat, deletePreparat, updatePreparat } from "../api.js";
import { formatLei } from "../format.js";
import { useMagazin } from "../magazin.js";
import { estePreparatDisponibil } from "../program.js";
import { preparateRestaurant } from "../restaurante.js";
import styles from "./Panou.module.css";

// Meniul unui restaurant în /restaurant: adaugă, editează, marchează indisponibil, șterge (POST / PATCH / DELETE /meniu).
// După fiecare schimbare, meniul comun se cere din nou, ca paginile clientului să vadă imediat schimbarea.
export default function AdminMeniu({ restaurant }) {
  const { meniu, incarcareMeniu, eroareMeniu, reincarcaMeniu } = useMagazin();
  const [formular, setFormular] = useState(null);
  const [deSters, setDeSters] = useState(null);
  const [inLucru, setInLucru] = useState(null);
  const [eroare, setEroare] = useState(null);
  const [aviz, setAviz] = useState("");

  const preparate = preparateRestaurant(meniu, restaurant);

  function gata(mesaj) {
    setFormular(null);
    setDeSters(null);
    setEroare(null);
    setAviz(mesaj);
    reincarcaMeniu();
  }

  async function salveaza(corp) {
    if (formular?.produs) {
      await updatePreparat(formular.produs.id, corp);
      gata(`„${corp.preparat}” a fost salvat.`);
    } else {
      await createPreparat(corp);
      gata(`„${corp.preparat}” a fost adăugat în meniu.`);
    }
  }

  async function actiune(produs, cerere, mesaj, eticheta) {
    if (inLucru !== null) return;
    setInLucru(produs.id);
    try {
      await cerere();
      gata(mesaj);
    } catch (err) {
      setAviz("");
      setEroare(`Nu am putut ${eticheta} „${produs.preparat}”: ${err.message}`);
    } finally {
      setInLucru(null);
    }
  }

  function comutaDisponibil(produs) {
    const nou = !estePreparatDisponibil(produs);
    return actiune(produs, () => updatePreparat(produs.id, { disponibil: nou }), nou ? `„${produs.preparat}” e din nou disponibil.` : `„${produs.preparat}” e marcat indisponibil.`, "actualiza");
  }

  function sterge(produs) {
    return actiune(produs, () => deletePreparat(produs.id), `„${produs.preparat}” a fost șters din meniu.`, "șterge");
  }

  if (incarcareMeniu && meniu.length === 0) return <p className="info" role="status">Se încarcă meniul…</p>;
  if (eroareMeniu && meniu.length === 0) {
    return (
      <div className={`error ${styles.avertisment}`}>
        <CircleAlert size={22} aria-hidden="true" />
        <div className="error-body">
          <p role="alert">Nu am putut încărca meniul: {eroareMeniu}.</p>
          <button type="button" className="btn-primary" onClick={reincarcaMeniu}><RotateCw size={18} aria-hidden="true" />Încearcă din nou</button>
        </div>
      </div>
    );
  }

  return (
    <section className={styles.sectiune} aria-labelledby="admin-meniu-titlu">
      <h2 id="admin-meniu-titlu" className={styles.sectiuneTitlu}>Meniul restaurantului</h2>
      <p className={styles.nota}>Preparatele indisponibile rămân în meniu, dar clienții nu le pot adăuga în coș. Ștergerea scoate preparatul și din coșurile clienților.</p>
      {eroare && (
        <div className={`error ${styles.avertisment}`}>
          <CircleAlert size={20} aria-hidden="true" />
          <p role="alert">{eroare}</p>
          <button type="button" className="btn-close" onClick={() => setEroare(null)} aria-label="Închide mesajul de eroare"><X size={18} aria-hidden="true" /></button>
        </div>
      )}
      <p className={styles.aviz} role="status">{aviz}</p>

      {formular?.tip === "nou" ? (
        <div className={styles.card}>
          <h3 className={styles.cardTitlu}>Preparat nou</h3>
          <FormularPreparat id="preparat-nou" restaurant={restaurant} meniu={meniu} onSalveaza={salveaza} onRenunta={() => setFormular(null)} />
        </div>
      ) : (
        <div className={styles.actiuni}>
          <button type="button" className="btn-primary" onClick={() => { setFormular({ tip: "nou" }); setAviz(""); }}><Plus size={18} aria-hidden="true" />Adaugă un preparat</button>
        </div>
      )}

      {preparate.length === 0 ? (
        <p className={styles.gol}>Restaurantul nu are preparate în meniu. Adaugă primul preparat.</p>
      ) : (
        <ul className={`${styles.lista} ${styles.sectiuneMica}`}>
          {preparate.map((p) => {
            const disponibil = estePreparatDisponibil(p);
            const ocupat = inLucru === p.id;
            const titluId = `meniu-preparat-${p.id}`;
            return (
              <li key={p.id}>
                <article className={styles.card} aria-labelledby={titluId}>
                  <div className={styles.cardSus}>
                    <h3 id={titluId} className={styles.cardTitlu}>{p.preparat}</h3>
                    <span className={`${styles.stare} ${disponibil ? "" : styles.stareOprita}`}>{disponibil ? "Disponibil" : "Indisponibil"}</span>
                  </div>
                  <p className={styles.meta}><span>{p.categorie}</span><span className="price">{formatLei(p.pret)}</span></p>
                  {formular?.tip === "editare" && formular.produs.id === p.id ? (
                    <FormularPreparat id={`preparat-${p.id}`} produs={p} restaurant={restaurant} meniu={meniu} onSalveaza={salveaza} onRenunta={() => setFormular(null)} />
                  ) : deSters === p.id ? (
                    <div className={styles.formular}>
                      <p>Ștergi „{p.preparat}” din meniu? Comenzile deja plasate rămân.</p>
                      <div className={styles.butoane}>
                        <button type="button" className={styles.butonPericol} aria-disabled={ocupat} onClick={() => sterge(p)}>{ocupat ? "Se șterge…" : "Șterge preparatul"}</button>
                        <button type="button" className="btn-secondary" onClick={() => setDeSters(null)}>Renunță</button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.actiuni}>
                      <button type="button" className="btn-secondary" onClick={() => { setFormular({ tip: "editare", produs: p }); setAviz(""); }}>Editează</button>
                      <button type="button" className="btn-secondary" aria-disabled={ocupat} onClick={() => comutaDisponibil(p)}>{ocupat ? "Se trimite…" : disponibil ? "Marchează indisponibil" : "Marchează disponibil"}</button>
                      <button type="button" className="btn-secondary" onClick={() => { setDeSters(p.id); setAviz(""); }}>Șterge</button>
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
