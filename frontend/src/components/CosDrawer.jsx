import { useEffect, useRef } from "react"; // useRef: <dialog> și focus; useEffect: deschidere/închidere
import { Link } from "react-router-dom"; // „Mergi la plată” duce la /cos, fără reîncărcare
import { ShoppingBag, Trash2, X } from "lucide-react"; // iconițe: sacoșă, coș de gunoi, închidere
import Stepper from "./Stepper.jsx"; // selectorul de cantitate
import Miniatura from "./Miniatura.jsx"; // fotografia mică a preparatului (sau iconița categoriei)
import { numarProduse, totalCos } from "../cos.js"; // aceleași calcule ca pe pagina coșului
import { formatLei, formatProduse } from "../format.js"; // formatarea sumelor și a numărului de produse
import styles from "./CosDrawer.module.css"; // Etapa 8: stilurile coșului (CSS Modules)

// Coșul ca sertar lateral, construit pe <dialog> nativ (Esc și clicul pe fundal îl închid).
// Redesign „Pădure”: sertarul e doar o privire rapidă (cantități, total); plasarea comenzii se face pe pagina /cos.
// Primește liniile deja calculate de Layout; nu modifică singur coșul, doar anunță prin callback-uri.
export default function CosDrawer({ deschis, linii, disponibil, onClose, onSchimba, onScoate, onVeziMeniul }) { // disponibil = meniul s-a încărcat
  const ref = useRef(null); // elementul <dialog>
  const inchideRef = useRef(null); // butonul X, primește focusul la deschidere
  const titluRef = useRef(null); // titlul, primește focusul când o linie dispare
  const apasatPeFundal = useRef(false); // true doar dacă apăsarea mouse-ului a început chiar pe fundal

  useEffect(() => { // sincronizăm <dialog> cu prop-ul `deschis`
    const dialog = ref.current; // elementul DOM real
    if (deschis && !dialog.open) { // trebuie deschis, dar e închis
      dialog.showModal(); // modal: restul paginii devine inert
      inchideRef.current.focus(); // focus pe „Închide coșul”
    } // sfârșitul ramurii de deschidere
    if (!deschis && dialog.open) dialog.close(); // trebuie închis (browserul pune focusul înapoi pe butonul coșului)
  }, [deschis]); // doar când se schimbă `deschis`

  const produse = numarProduse(linii); // câte produse sunt în coș; derivat
  const total = totalCos(linii); // totalul; derivat

  // Butonul apăsat (− la cantitatea 1, sau coșul de gunoi) dispare odată cu linia; mutăm focusul pe titlu înainte
  function handleSchimba(linie, delta) { // „−” / „+” pe o linie
    if (linie.cantitate + delta <= 0) titluRef.current.focus(); // linia va dispărea
    onSchimba(linie.id, delta); // anunțăm Layout
  } // sfârșitul funcției

  function handleScoate(id) { // coșul de gunoi de pe o linie
    titluRef.current.focus(); // linia va dispărea
    onScoate(id); // anunțăm Layout
  } // sfârșitul funcției

  // Închidem dialogul imediat (browserul readuce focusul pe butonul coșului), apoi pagina nouă își mută focusul pe titlul ei.
  // Fără close() aici, efectul de mai sus ar închide dialogul după ce pagina nouă a mutat deja focusul, și l-ar strica.
  function inchideAcum() { // folosită de „Mergi la plată” și „Vezi meniul”
    ref.current.close(); // evenimentul close anunță Layout (onClose)
  } // sfârșitul funcției

  function handleVeziMeniul() { // butonul din coșul gol
    inchideAcum(); // închidem sertarul
    onVeziMeniul(); // Layout duce utilizatorul la meniu
  } // sfârșitul funcției

  return ( // întoarcem JSX
    <dialog // elementul nativ pentru ferestre modale
      ref={ref} // legăm referința
      className={styles.drawer} // sertar lateral
      aria-labelledby="cos-titlu" // numele dialogului = titlul
      onClose={onClose} // Esc sau close(): anunțăm Layout
      onPointerDown={(e) => (apasatPeFundal.current = e.target === e.currentTarget)} // reținem unde a început apăsarea
      onClick={(e) => apasatPeFundal.current && e.target === e.currentTarget && onClose()} // închidem doar dacă apăsarea și eliberarea sunt pe fundal
    >
      <div className={styles.body}>{/* conținutul ocupă toată înălțimea, deci clicurile din sertar nu ajung la <dialog> */}
        <div className={styles.head}>{/* titlul și X-ul */}
          <h2 id="cos-titlu" className="titlu-focus" ref={titluRef} tabIndex={-1}>Coșul tău</h2>{/* tabIndex -1: focus doar din cod */}
          <button ref={inchideRef} type="button" className="btn-close" onClick={onClose} aria-label="Închide coșul">{/* butonul de închidere */}
            <X size={20} aria-hidden="true" />{/* iconiță decorativă */}
          </button>
        </div>

        {linii.length === 0 ? ( // nimic de arătat în listă
          <div className={styles.gol}>{/* starea goală */}
            <span className={styles.golIcon} aria-hidden="true"><ShoppingBag size={26} /></span>{/* iconiță decorativă */}
            {disponibil ? ( // meniul a sosit, deci coșul chiar e gol
              <>{/* textele și butonul */}
                <p className={styles.golTitlu}>Coșul e gol</p>{/* mesajul principal */}
                <p>Adaugă preparate din meniu și le găsești aici.</p>{/* indicația */}
                <button type="button" className="btn-primary" onClick={handleVeziMeniul}>Vezi meniul</button>{/* închide sertarul și duce la meniu */}
              </>
            ) : ( // meniul nu a sosit: nu spunem „gol”, produsele salvate apar după încărcare
              <>{/* textele */}
                <p className={styles.golTitlu}>Coșul nu e disponibil încă</p>{/* mesajul principal */}
                <p>Produsele din coș apar după ce se încarcă meniul.</p>{/* explicația */}
              </>
            )}{/* sfârșitul randării condiționate */}
          </div>
        ) : ( // coșul are produse
          <>{/* lista și subsolul */}
            <ul className={styles.lista}>{/* liniile coșului, zona care se derulează */}
              {linii.map((linie) => ( // un rând pentru fiecare linie
                <li key={linie.id} className={styles.linie}>{/* id-ul preparatului e unic în coș */}
                  <Miniatura preparat={linie.preparat} categorie={linie.categorie} />{/* fotografia mică */}
                  <div className={styles.info}>{/* numele și detaliile */}
                    <h3>{linie.preparat}</h3>{/* numele preparatului */}
                    <p>{linie.restaurant}</p>{/* restaurantul */}
                    <div className={styles.actiuni}>{/* selectorul și ștergerea */}
                      <Stepper preparat={linie.preparat} cantitate={linie.cantitate} onSchimba={(delta) => handleSchimba(linie, delta)} />{/* − cantitate + */}
                      <button type="button" className="btn-danger" onClick={() => handleScoate(linie.id)} aria-label={`Scoate ${linie.preparat} din coș`} title="Scoate din coș">{/* scoate toată linia */}
                        <Trash2 size={18} aria-hidden="true" />{/* iconiță decorativă */}
                      </button>
                    </div>
                  </div>
                  <span className={`price ${styles.subtotal}`}>{formatLei(linie.subtotal)}</span>{/* subtotalul liniei */}
                </li>
              ))}{/* sfârșitul map-ului */}
            </ul>
            <div className={styles.foot}>{/* totalul și drumul spre plată, mereu vizibile */}
              <dl className={styles.rezumat}>{/* perechi termen / valoare */}
                <div><dt>Produse</dt><dd>{formatProduse(produse)}</dd></div>{/* numărul de produse */}
                <div className={styles.total}><dt>Total</dt><dd className="price">{formatLei(total)}</dd></div>{/* totalul, fără taxe inventate */}
              </dl>
              <Link to="/cos" className="btn-primary" onClick={inchideAcum}>Mergi la plată</Link>{/* pagina coșului: livrarea și plasarea */}
            </div>
          </>
        )}{/* sfârșitul randării condiționate */}
      </div>
    </dialog>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
