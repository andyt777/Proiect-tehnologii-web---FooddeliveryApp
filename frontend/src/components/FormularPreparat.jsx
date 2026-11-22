import { useEffect, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import { CATEGORII } from "../categorii.js";
import { categorieRestaurant } from "../constants.js";
import { IMAGINE_MAX, NUME_PREPARAT_MAX, PRET_PREPARAT_MAX, preparatDinFormular, valideazaPreparat, valoriFormularPreparat } from "../meniuAdmin.js";
import styles from "./Panou.module.css";

// Formularul unui preparat (adăugare sau editare) din /restaurant. Validarea e în meniuAdmin.js;
// `onSalveaza(corp)` trimite cererea și aruncă o eroare cu mesaj românesc dacă serverul refuză.
export default function FormularPreparat({ id, produs = null, restaurant, meniu, onSalveaza, onRenunta }) {
  const [valori, setValori] = useState(() => valoriFormularPreparat(produs, categorieRestaurant(restaurant)));
  const [problema, setProblema] = useState(null);
  const [eroare, setEroare] = useState("");
  const [trimite, setTrimite] = useState(false);
  const numeRef = useRef(null);
  const categorieRef = useRef(null);
  const pretRef = useRef(null);
  const imagineRef = useRef(null);

  useEffect(() => {
    numeRef.current?.focus();
  }, [numeRef]);

  function schimba(camp, valoare) {
    setValori((v) => ({ ...v, [camp]: valoare }));
    if (problema?.camp === camp) setProblema(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (trimite) return;
    const gresit = valideazaPreparat(valori, { meniu, restaurant, idEditat: produs?.id ?? null });
    if (gresit) {
      setProblema(gresit);
      const refuri = { preparat: numeRef, categorie: categorieRef, pret: pretRef, imagine: imagineRef };
      refuri[gresit.camp]?.current?.focus();
      return;
    }
    setProblema(null);
    setEroare("");
    setTrimite(true);
    try {
      await onSalveaza(preparatDinFormular(valori, restaurant));
    } catch (err) {
      setEroare(err.message);
      setTrimite(false);
    }
  }

  function atribute(camp) {
    const marcat = problema?.camp === camp;
    return { "aria-invalid": marcat, "aria-describedby": marcat ? `${id}-eroare-${camp}` : undefined };
  }

  function mesaj(camp) {
    if (problema?.camp !== camp) return null;
    return <p id={`${id}-eroare-${camp}`} className={styles.eroare} role="alert"><CircleAlert size={16} aria-hidden="true" />{problema.mesaj}</p>;
  }

  return (
    <form className={styles.formular} onSubmit={handleSubmit} noValidate aria-label={produs ? `Editează ${produs.preparat}` : "Preparat nou"}>
      <div className={styles.campuri}>
        <div className={styles.camp}>
          <label htmlFor={`${id}-nume`}>Numele preparatului</label>
          <input id={`${id}-nume`} ref={numeRef} type="text" value={valori.preparat} maxLength={NUME_PREPARAT_MAX + 10} onChange={(e) => schimba("preparat", e.target.value)} {...atribute("preparat")} />
          {mesaj("preparat")}
        </div>
        <div className={styles.camp}>
          <label htmlFor={`${id}-categorie`}>Categoria</label>
          <select id={`${id}-categorie`} ref={categorieRef} value={valori.categorie} onChange={(e) => schimba("categorie", e.target.value)} {...atribute("categorie")}>
            {CATEGORII.map((c) => <option key={c.nume} value={c.nume}>{c.nume}</option>)}
          </select>
          {mesaj("categorie")}
        </div>
        <div className={styles.camp}>
          <label htmlFor={`${id}-pret`}>Prețul (lei)</label>
          <input id={`${id}-pret`} ref={pretRef} type="text" inputMode="numeric" value={valori.pret} maxLength={String(PRET_PREPARAT_MAX).length + 2} onChange={(e) => schimba("pret", e.target.value)} {...atribute("pret")} />
          {mesaj("pret")}
        </div>
      </div>
      <div className={styles.camp}>
        <label htmlFor={`${id}-imagine`}>Imaginea (opțional)</label>
        <input id={`${id}-imagine`} ref={imagineRef} type="text" value={valori.imagine} maxLength={IMAGINE_MAX} placeholder="/img/pizza-diavola.webp sau https://…" onChange={(e) => schimba("imagine", e.target.value)} {...atribute("imagine")} />
        {mesaj("imagine")}
      </div>
      <label className={styles.bifa}>
        <input type="checkbox" checked={valori.disponibil} onChange={(e) => schimba("disponibil", e.target.checked)} />
        Disponibil pentru comenzi
      </label>
      {eroare && <p className={styles.eroare} role="alert"><CircleAlert size={16} aria-hidden="true" />Nu am putut salva preparatul: {eroare}</p>}
      <div className={styles.butoane}>
        <button type="submit" className="btn-primary" aria-disabled={trimite}>{trimite ? "Se salvează…" : produs ? "Salvează" : "Adaugă preparatul"}</button>
        <button type="button" className="btn-secondary" onClick={onRenunta}>Renunță</button>
      </div>
    </form>
  );
}
