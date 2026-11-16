import { useEffect, useRef, useState } from "react"; // useRef: <dialog> și focus; useState: livrarea aleasă și trimiterea; useEffect: deschidere/închidere
import { CircleAlert, ShoppingBag, Trash2, X } from "lucide-react"; // iconițe: avertisment, sacoșă, coș de gunoi, închidere
import Stepper from "./Stepper.jsx"; // selectorul de cantitate
import { ICONITE_CATEGORIE } from "../categorii.js"; // harta categorie -> iconiță
import { numarProduse, totalCos } from "../cos.js"; // aceleași calcule ca în ComenziPage, dintr-un singur loc
import { DURATE_LIVRARE, ETICHETE_LIVRARE } from "../livrare.js"; // textele pentru tipurile de livrare
import { formatLei, formatProduse } from "../format.js"; // formatarea sumelor și a numărului de produse
import styles from "./CosDrawer.module.css"; // Etapa 8: stilurile coșului (CSS Modules)

const TIPURI_LIVRARE = Object.keys(ETICHETE_LIVRARE); // ["standard", "express", "ridicare"], în ordinea din livrare.js

// Coșul: panou lateral construit pe <dialog> nativ (Esc și clicul pe fundal îl închid).
// Primește liniile deja calculate de ComenziPage; nu modifică singur coșul, doar anunță prin callback-uri.
// Etapa 7: plasarea trimite comenzile la server; `eroare` (de la ComenziPage) spune ce linii n-au ajuns și au rămas în coș.
export default function CosDrawer({ deschis, linii, disponibil, eroare, onClose, onSchimba, onScoate, onPlaseaza, onVeziMeniul }) { // props: starea, datele și callback-urile; disponibil = meniul s-a încărcat
  const ref = useRef(null); // elementul <dialog>
  const inchideRef = useRef(null); // butonul X, primește focusul la deschidere
  const titluRef = useRef(null); // titlul, primește focusul când o linie dispare
  const [livrare, setLivrare] = useState("standard"); // tipul de livrare ales; state local, contează doar aici până la plasare
  const [trimite, setTrimite] = useState(false); // Etapa 7: true cât timp comenzile pleacă spre server
  const apasatPeFundal = useRef(false); // true doar dacă apăsarea mouse-ului a început chiar pe fundal

  useEffect(() => { // sincronizăm <dialog> cu prop-ul `deschis`
    const dialog = ref.current; // elementul DOM real
    if (deschis && !dialog.open) { // trebuie deschis, dar e închis
      dialog.showModal(); // modal: restul paginii devine inert
      inchideRef.current.focus(); // focus pe „Închide coșul”
    } // sfârșitul ramurii de deschidere
    if (!deschis && dialog.open) dialog.close(); // trebuie închis: îl închidem (browserul pune focusul înapoi pe butonul coșului)
  }, [deschis]); // doar când se schimbă `deschis`

  const produse = numarProduse(linii); // câte produse sunt în coș (liniile au și ele `cantitate`); derivat
  const total = totalCos(linii); // totalul de plată; derivat

  // Butonul apăsat (− la cantitatea 1, sau coșul de gunoi) dispare odată cu linia; mutăm focusul pe titlu
  // înainte, ca utilizatorul de tastatură să nu rămână „nicăieri”.
  function handleSchimba(linie, delta) { // „−” / „+” pe o linie
    if (linie.cantitate + delta <= 0) titluRef.current.focus(); // linia va dispărea
    onSchimba(linie.id, delta); // anunțăm ComenziPage
  } // sfârșitul funcției

  function handleScoate(id) { // coșul de gunoi de pe o linie
    titluRef.current.focus(); // linia va dispărea
    onScoate(id); // anunțăm ComenziPage
  } // sfârșitul funcției

  function handleVeziMeniul() { // butonul din coșul gol
    ref.current.close(); // închidem imediat; browserul readuce focusul pe butonul coșului...
    onVeziMeniul(); // ...iar ComenziPage îl mută apoi pe titlul meniului
  } // sfârșitul funcției

  // Etapa 7: plasarea așteaptă serverul. Butonul rămâne focalizabil (aria-disabled, nu disabled), ca focusul
  // să nu se piardă din panou; o a doua apăsare cât se trimite e ignorată aici.
  async function handleSubmit(e) { // trimiterea formularului = plasarea comenzii
    e.preventDefault(); // fără reîncărcarea paginii
    if (trimite) return; // o trimitere e deja în curs: fără comenzi duble
    setTrimite(true); // butonul arată „Se trimite…”
    try { // onPlaseaza nu aruncă: erorile ajung în prop-ul `eroare`
      const toate = await onPlaseaza(livrare); // ComenziPage trimite fiecare linie la server; true = toate au ajuns
      if (toate) setLivrare("standard"); // următoarea comandă pornește iar de la livrarea standard
    } finally { // oricum s-a terminat
      setTrimite(false); // butonul revine la normal
    } // sfârșitul try/finally
  } // sfârșitul funcției

  // Enter pe un buton radio ar trimite formularul (trimitere implicită) și ar plasa comanda din greșeală.
  // Oprim tasta doar pe radio-uri; comanda se plasează numai din buton (Enter sau Space pe el merg în continuare).
  function handleKeyDown(e) { // tastă apăsată oriunde în formular
    if (e.key === "Enter" && e.target.type === "radio") e.preventDefault(); // fără acțiunea implicită a tastei, browserul nu mai trimite formularul
  } // sfârșitul funcției

  return ( // întoarcem JSX
    <dialog // elementul nativ pentru ferestre modale
      ref={ref} // legăm referința
      className={styles.drawer} // panou lateral (Etapa 8: vezi CosDrawer.module.css)
      aria-labelledby="cos-titlu" // numele dialogului = titlul
      onClose={onClose} // Esc sau close(): anunțăm ComenziPage
      onPointerDown={(e) => (apasatPeFundal.current = e.target === e.currentTarget)} // reținem unde a început apăsarea
      onClick={(e) => apasatPeFundal.current && e.target === e.currentTarget && onClose()} // închidem doar dacă și apăsarea, și eliberarea sunt pe fundal (nu la o selecție de text trasă din panou)
    >
      <div className={styles.body}>{/* conținutul ocupă toată înălțimea, deci clicurile din panou nu ajung la <dialog> */}
        <div className={styles.head}>{/* titlul și X-ul */}
          <h2 id="cos-titlu" className="titlu-focus" ref={titluRef} tabIndex={-1}>Coșul tău</h2>{/* tabIndex -1: focus doar din cod; titlu-focus: fără contur la acest focus */}
          <button // butonul de închidere
            ref={inchideRef} // primește focusul la deschidere
            type="button" // buton simplu
            className="btn-close" // clasa pentru stiluri
            onClick={onClose} // ComenziPage pune `deschis` pe false
            aria-label="Închide coșul" // nume accesibil, butonul are doar iconiță
          >
            <X size={20} aria-hidden="true" />{/* iconiță decorativă */}
          </button>
        </div>

        {linii.length === 0 && !disponibil ? ( // meniul nu s-a încărcat: nu știm încă ce e în coș
          <div className={styles.gol}>{/* aceeași așezare ca starea goală */}
            <span className={styles.golIcon} aria-hidden="true"><ShoppingBag size={26} /></span>{/* iconiță decorativă */}
            <p className={styles.golTitlu}>Coșul nu e disponibil încă</p>{/* nu spunem „gol”: produsele salvate apar după încărcare */}
            <p>Produsele din coș apar după ce se încarcă meniul.</p>{/* explicația */}
          </div>
        ) : linii.length === 0 ? ( // coșul e gol
          <div className={styles.gol}>{/* starea goală */}
            <span className={styles.golIcon} aria-hidden="true"><ShoppingBag size={26} /></span>{/* iconiță decorativă */}
            <p className={styles.golTitlu}>Coșul e gol</p>{/* mesajul principal */}
            <p>Adaugă preparate din meniu și le găsești aici.</p>{/* indicația */}
            <button type="button" className="btn-primary" onClick={handleVeziMeniul}>Vezi meniul</button>{/* închide coșul și duce la meniu */}
          </div>
        ) : ( // coșul are produse
          <form className={styles.form} onSubmit={handleSubmit} onKeyDown={handleKeyDown}>{/* formular: se trimite doar din butonul „Plasează comanda” */}
            <div className={styles.scroll}>{/* zona care se derulează */}
              <ul className={styles.lista}>{/* liniile coșului */}
                {linii.map((linie) => { // un rând pentru fiecare linie
                  const Iconita = ICONITE_CATEGORIE[linie.categorie]; // iconița categoriei
                  return ( // JSX-ul liniei
                    <li key={linie.id} className={styles.linie}>{/* id-ul preparatului e unic în coș */}
                      <span className="thumb" aria-hidden="true"><Iconita size={20} strokeWidth={1.75} /></span>{/* iconița categoriei */}
                      <div className={styles.info}>{/* numele și detaliile */}
                        <h3>{linie.preparat}</h3>{/* numele preparatului */}
                        <p>{linie.restaurant} · {formatLei(linie.pret)} / buc.</p>{/* restaurantul și prețul unitar */}
                      </div>
                      <span className={`price ${styles.subtotal}`}>{formatLei(linie.subtotal)}</span>{/* subtotalul liniei */}
                      <div className={styles.actiuni}>{/* selectorul și ștergerea */}
                        <Stepper preparat={linie.preparat} cantitate={linie.cantitate} onSchimba={(delta) => handleSchimba(linie, delta)} />{/* − cantitate + */}
                        <button // butonul de scoatere din coș
                          type="button" // nu trimite formularul
                          className="btn-danger" // același stil ca ștergerea comenzilor
                          onClick={() => handleScoate(linie.id)} // scoatem toată linia
                          aria-label={`Scoate ${linie.preparat} din coș`} // nume accesibil
                          title="Scoate din coș" // tooltip la hover
                        >
                          <Trash2 size={18} aria-hidden="true" />{/* iconiță decorativă */}
                        </button>
                      </div>
                    </li>
                  ); // sfârșitul JSX-ului liniei
                })}{/* sfârșitul map-ului */}
              </ul>

              <fieldset className={styles.optiuni}>{/* grupul de butoane radio */}
                <legend>Livrare</legend>{/* numele grupului, citit înaintea fiecărei opțiuni */}
                {TIPURI_LIVRARE.map((tip) => ( // o opțiune pentru fiecare tip
                  <label key={tip} className={styles.optiune}>{/* tot cardul e clicabil */}
                    <input // butonul radio, controlat de React
                      type="radio" // o singură opțiune activă
                      name="livrare" // același name = același grup (săgețile trec de la unul la altul)
                      value={tip} // valoarea din date
                      checked={livrare === tip} // bifat dacă e cel ales
                      onChange={() => setLivrare(tip)} // schimbăm alegerea
                    />
                    <span className={styles.livrareText}>{/* textele opțiunii */}
                      <strong>{ETICHETE_LIVRARE[tip]}</strong>{/* ex. „Express” */}
                      <span>{DURATE_LIVRARE[tip]}</span>{/* ex. „Sosește în ~20 min” */}
                    </span>
                  </label>
                ))}{/* sfârșitul map-ului */}
              </fieldset>
            </div>

            <div className={styles.foot}>{/* rezumatul și butonul, mereu vizibile */}
              <dl className={styles.rezumat}>{/* listă de perechi termen / valoare */}
                <div><dt>Produse</dt><dd>{formatProduse(produse)}</dd></div>{/* numărul de produse */}
                <div className={styles.total}><dt>Total</dt><dd>{formatLei(total)}</dd></div>{/* totalul, fără taxe inventate */}
              </dl>
              {eroare && <p className={styles.eroare} role="alert"><CircleAlert size={18} aria-hidden="true" />{eroare}</p>}{/* Etapa 7: liniile care n-au ajuns la server au rămas în coș */}
              <button type="submit" className="btn-primary" aria-disabled={trimite}>{trimite ? "Se trimite…" : `Plasează comanda · ${formatLei(total)}`}</button>{/* trimite formularul; aria-disabled cât se trimite */}
            </div>
          </form>
        )}{/* sfârșitul randării condiționate */}
      </div>
    </dialog>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
