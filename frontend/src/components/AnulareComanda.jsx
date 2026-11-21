import { useEffect, useRef, useState } from "react"; // useState: formularul; useRef: focus; useEffect: focusul după deschidere / închidere
import { Ban } from "lucide-react"; // iconița anulării
import { fetchComanda, updateComanda } from "../api.js"; // citirea proaspătă și PATCH, prin singurul fișier cu fetch
import { MOTIVE_ANULARE, MOTIV_MAX, aplicaTranzitie, poateTrece, valideazaMotiv } from "../stari.js"; // regulile anulării, pure
import styles from "./AnulareComanda.module.css"; // stilurile (CSS Modules)

const ALT_MOTIV = "alt"; // valoarea opțiunii „Alt motiv”

// Fluxul complet: clientul anulează o comandă cât încă e permis (înainte de preparare), cu un motiv.
// Confirmarea e pe loc, în pagină (fără dialog). Înainte de PATCH citim comanda din nou: poate restaurantul a început între timp.
// Verificarea e doar în browser (json-server acceptă orice), deci nu e securitate; un server real ar repeta regula.
export default function AnulareComanda({ comanda, onAnulata }) { // comanda de pe pagină și funcția (comanda nouă, mesaj) apelată după răspuns
  const [deschis, setDeschis] = useState(false); // formularul e la vedere?
  const [alegere, setAlegere] = useState(MOTIVE_ANULARE[0]); // motivul ales (sau ALT_MOTIV)
  const [detalii, setDetalii] = useState(""); // textul pentru „Alt motiv”
  const [eroare, setEroare] = useState(""); // mesajul de eroare ("" = niciunul)
  const [trimite, setTrimite] = useState(false); // true cât așteptăm serverul
  const butonRef = useRef(null); // „Anulează comanda”
  const primaOptiuneRef = useRef(null); // primul motiv
  const detaliiRef = useRef(null); // câmpul „Alt motiv”
  const focusDupa = useRef(null); // ce primește focus după randare: „formular”, „buton” sau null

  // Focusul urmează schimbarea: în formular la deschidere, pe buton la „Renunță”
  useEffect(() => { // rulează când se deschide sau se închide formularul
    if (focusDupa.current === "formular") primaOptiuneRef.current?.focus(); // primul motiv
    if (focusDupa.current === "buton") butonRef.current?.focus(); // butonul a reapărut
    focusDupa.current = null; // o singură dată
  }, [deschis]); // dependența: deschis / închis

  function deschide() { // „Anulează comanda”
    focusDupa.current = "formular"; // după randare, focus pe primul motiv
    setEroare(""); // fără mesaje vechi
    setDeschis(true); // arătăm formularul
  } // sfârșitul funcției

  function renunta() { // „Renunță”
    focusDupa.current = "buton"; // după randare, focus pe butonul inițial
    setDeschis(false); // ascundem formularul
  } // sfârșitul funcției

  async function handleSubmit(e) { // „Confirmă anularea”
    e.preventDefault(); // fără reîncărcarea paginii
    if (trimite) return; // o cerere e deja în curs
    const motiv = alegere === ALT_MOTIV ? detalii : alegere; // textul motivului
    const problema = valideazaMotiv(motiv); // null sau mesajul
    if (problema) { // motiv lipsă sau prea lung
      setEroare(problema); // mesajul, lângă formular
      detaliiRef.current?.focus(); // câmpul de corectat (există doar la „Alt motiv”, singurul care poate fi greșit)
      return; // ne oprim
    } // sfârșitul if
    setTrimite(true); // butonul arată „Se anulează…”
    setEroare(""); // fără mesaje vechi
    try { // cererile pot eșua
      const proaspata = await fetchComanda(comanda.id); // starea de acum, nu cea de la deschiderea paginii
      if (!poateTrece(proaspata, "anulata", "client")) { // restaurantul a mers mai departe între timp
        document.getElementById("stare-titlu")?.focus(); // formularul dispare; focusul merge pe titlul pașilor
        onAnulata(proaspata, "Comanda a intrat deja în preparare și nu mai poate fi anulată."); // pagina arată starea nouă și mesajul
        return; // ne oprim
      } // sfârșitul if
      const actualizata = await updateComanda(proaspata.id, aplicaTranzitie(proaspata, "anulata", new Date(), { motiv })); // PATCH cu starea, plata (rambursare) și istoricul
      document.getElementById("stare-titlu")?.focus(); // formularul dispare; focusul merge pe titlul pașilor
      onAnulata(actualizata, actualizata?.plata?.stare === "rambursata" ? "Comanda a fost anulată. Plata simulată a fost rambursată." : "Comanda a fost anulată."); // pagina arată comanda anulată și confirmarea
    } catch (err) { // server oprit, eroare HTTP sau timeout
      setEroare(`Comanda nu a fost anulată: ${err.message}. Încearcă din nou.`); // ce s-a întâmplat și ce e de făcut
    } finally { // oricum s-a terminat
      setTrimite(false); // butonul revine
    } // sfârșitul try/catch/finally
  } // sfârșitul funcției

  if (!deschis) { // starea inițială: doar butonul
    return ( // JSX-ul butonului
      <div className={styles.inchis}>{/* butonul și indicația */}
        <button type="button" ref={butonRef} className="btn-secondary" onClick={deschide} aria-expanded={false} aria-controls="anulare-form">{/* deschide formularul */}
          <Ban size={18} aria-hidden="true" />{/* iconiță decorativă */}
          Anulează comanda{/* textul butonului */}
        </button>
        <p className={styles.indiciu}>Poți anula până începe prepararea.</p>{/* regula, spusă direct */}
      </div>
    ); // sfârșitul JSX-ului
  } // sfârșitul if

  return ( // formularul de confirmare
    <form id="anulare-form" className={styles.form} onSubmit={handleSubmit} noValidate>{/* noValidate: mesajele sunt cele din cod */}
      <fieldset className={styles.grup}>{/* motivele */}
        <legend className={styles.legenda}>De ce anulezi comanda?</legend>{/* întrebarea, citită înaintea opțiunilor */}
        {[...MOTIVE_ANULARE, ALT_MOTIV].map((m, i) => ( // motivele gata scrise, apoi „Alt motiv”
          <label key={m} className={styles.optiune}>{/* tot rândul e clicabil */}
            <input type="radio" name="motiv-anulare" value={m} checked={alegere === m} onChange={() => setAlegere(m)} ref={i === 0 ? primaOptiuneRef : undefined} />{/* radio controlat */}
            {m === ALT_MOTIV ? "Alt motiv" : m}{/* textul opțiunii */}
          </label>
        ))}{/* sfârșitul map-ului */}
        {alegere === ALT_MOTIV && ( // câmpul liber, doar pentru „Alt motiv”
          <div className={styles.camp}>{/* eticheta și câmpul */}
            <label htmlFor="anulare-detalii">Spune-ne pe scurt</label>{/* eticheta */}
            <input id="anulare-detalii" ref={detaliiRef} type="text" value={detalii} onChange={(e) => setDetalii(e.target.value)} maxLength={MOTIV_MAX} autoComplete="off" aria-invalid={Boolean(eroare) && valideazaMotiv(detalii) !== null} aria-describedby={eroare ? "anulare-eroare" : undefined} />{/* câmp text controlat */}
          </div>
        )}{/* sfârșitul randării condiționate */}
      </fieldset>
      {eroare && <p id="anulare-eroare" className={styles.eroare} role="alert">{eroare}</p>}{/* mesajul, anunțat imediat */}
      <div className={styles.butoane}>{/* confirmarea și renunțarea */}
        <button type="submit" className={styles.confirma} aria-disabled={trimite}>{trimite ? "Se anulează…" : "Confirmă anularea"}</button>{/* aria-disabled: butonul rămâne focalizabil */}
        <button type="button" className="btn-secondary" onClick={renunta}>Renunță</button>{/* închide formularul, comanda rămâne */}
      </div>
    </form>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
