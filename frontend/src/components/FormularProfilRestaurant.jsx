import { useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import { salveazaProfilRestaurant } from "../api.js";
import { DESCRIERE_MAX, ETICHETE_ZI, ZILE, profilDinFormular, valideazaProfil, valoriFormularProfil } from "../program.js";
import styles from "./Panou.module.css";

// Profilul și programul unui restaurant (descriere, telefon, orele pe zile, pauză), folosit în /restaurant și /admin.
// Salvează în /restaurante (POST pentru un profil nou, PUT pentru unul existent) și anunță pagina prin `onSalvat`.
// Pagina îl randează cu key = slug-ul restaurantului, deci câmpurile pornesc din nou la schimbarea restaurantului.
export default function FormularProfilRestaurant({ restaurant, profil, onSalvat }) {
  const [valori, setValori] = useState(() => valoriFormularProfil(profil));
  const [problema, setProblema] = useState(null);
  const [eroare, setEroare] = useState("");
  const [aviz, setAviz] = useState("");
  const [trimite, setTrimite] = useState(false);
  const [exista, setExista] = useState(Boolean(profil));
  const formRef = useRef(null);
  const prefix = `profil-${restaurant.slug}`;

  function schimba(camp, valoare) {
    setValori((v) => ({ ...v, [camp]: valoare }));
    setAviz("");
    if (problema?.camp === camp) setProblema(null);
  }

  function schimbaZi(zi, camp, valoare) {
    setValori((v) => ({ ...v, program: { ...v.program, [zi]: { ...v.program[zi], [camp]: valoare } } }));
    setAviz("");
    if (problema?.camp === `program-${zi}`) setProblema(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (trimite) return;
    const gresit = valideazaProfil(valori);
    if (gresit) {
      setProblema(gresit);
      setAviz("");
      formRef.current?.querySelector(`[data-camp="${gresit.camp}"]`)?.focus();
      return;
    }
    setProblema(null);
    setEroare("");
    setTrimite(true);
    try {
      const salvat = await salveazaProfilRestaurant(profilDinFormular(restaurant.slug, valori), exista);
      setExista(true);
      setAviz(valori.pauzat ? `Profilul a fost salvat. ${restaurant.nume} e în pauză: clienții nu pot comanda.` : "Profilul și programul au fost salvate.");
      onSalvat?.(salvat);
    } catch (err) {
      setEroare(`Nu am putut salva profilul: ${err.message}`);
    } finally {
      setTrimite(false);
    }
  }

  function atribute(camp) {
    const marcat = problema?.camp === camp;
    return { "data-camp": camp, "aria-invalid": marcat, "aria-describedby": marcat ? `${prefix}-eroare` : undefined };
  }

  return (
    <form ref={formRef} className={`${styles.card} ${styles.formularProfil}`} onSubmit={handleSubmit} noValidate aria-label={`Profilul restaurantului ${restaurant.nume}`}>
      {!exista && <p className={styles.nota}>{restaurant.nume} nu are încă un profil salvat, deci apare mereu deschis. Salvează programul ca să-l aplici.</p>}
      <div className={styles.camp}>
        <label htmlFor={`${prefix}-descriere`}>Descrierea</label>
        <textarea id={`${prefix}-descriere`} rows={3} maxLength={DESCRIERE_MAX} value={valori.descriere} placeholder={restaurant.descriere} onChange={(e) => schimba("descriere", e.target.value)} {...atribute("descriere")} />
        <span className={styles.indiciu}>Goală: clienții văd textul implicit („{restaurant.descriere}”).</span>
      </div>
      <div className={styles.camp}>
        <label htmlFor={`${prefix}-telefon`}>Telefonul (opțional)</label>
        <input id={`${prefix}-telefon`} type="tel" inputMode="tel" maxLength={20} value={valori.telefon} placeholder="0722 123 456" onChange={(e) => schimba("telefon", e.target.value)} {...atribute("telefon")} />
      </div>
      <label className={styles.bifa}>
        <input type="checkbox" checked={valori.pauzat} onChange={(e) => schimba("pauzat", e.target.checked)} />
        Pauză: nu primesc comenzi acum
      </label>
      <fieldset className={styles.program}>
        <legend>Programul (ora browserului)</legend>
        <p className={styles.indiciu}>O oră de închidere mai mică decât cea de deschidere (ex. 18:00–02:00) continuă după miezul nopții.</p>
        {ZILE.map((zi) => {
          const z = valori.program[zi];
          return (
            <div key={zi} className={styles.programZi}>
              <label className={styles.bifa}>
                <input type="checkbox" checked={z.deschis} onChange={(e) => schimbaZi(zi, "deschis", e.target.checked)} />
                {ETICHETE_ZI[zi]}
              </label>
              {z.deschis ? (
                <>
                  <div className={styles.camp}>
                    <label htmlFor={`${prefix}-${zi}-deschide`}>Deschide</label>
                    <input id={`${prefix}-${zi}-deschide`} type="time" step={300} value={z.deschide} onChange={(e) => schimbaZi(zi, "deschide", e.target.value)} {...atribute(`program-${zi}`)} />
                  </div>
                  <div className={styles.camp}>
                    <label htmlFor={`${prefix}-${zi}-inchide`}>Închide</label>
                    <input id={`${prefix}-${zi}-inchide`} type="time" step={300} value={z.inchide} onChange={(e) => schimbaZi(zi, "inchide", e.target.value)} aria-invalid={problema?.camp === `program-${zi}`} />
                  </div>
                </>
              ) : (
                <span className={styles.indiciu}>Închis</span>
              )}
            </div>
          );
        })}
      </fieldset>
      {problema && <p id={`${prefix}-eroare`} className={styles.eroare} role="alert"><CircleAlert size={16} aria-hidden="true" />{problema.mesaj}</p>}
      {eroare && <p className={styles.eroare} role="alert"><CircleAlert size={16} aria-hidden="true" />{eroare}</p>}
      <p className={styles.aviz} role="status">{aviz}</p>
      <div className={styles.butoane}>
        <button type="submit" className="btn-primary" aria-disabled={trimite}>{trimite ? "Se salvează…" : "Salvează profilul"}</button>
      </div>
    </form>
  );
}
