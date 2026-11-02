import { useEffect, useRef, useState } from "react"; // useRef: <dialog> și focus; useState: livrarea aleasă; useEffect: deschidere/închidere
import { ShoppingBag, Trash2, X } from "lucide-react"; // iconițe: sacoșă, coș de gunoi, închidere
import Stepper from "./Stepper.jsx"; // selectorul de cantitate
import { ICONITE_CATEGORIE } from "../categorii.js"; // harta categorie -> iconiță
import { numarProduse, totalCos } from "../cos.js"; // aceleași calcule ca în App, dintr-un singur loc
import { DURATE_LIVRARE, ETICHETE_LIVRARE } from "../livrare.js"; // textele pentru tipurile de livrare
import { formatLei, formatProduse } from "../format.js"; // formatarea sumelor și a numărului de produse

const TIPURI_LIVRARE = Object.keys(ETICHETE_LIVRARE); // ["standard", "express", "ridicare"], în ordinea din livrare.js

// Coșul: panou lateral construit pe <dialog> nativ, ca ConfirmDialog (Esc și clicul pe fundal îl închid).
// Primește liniile deja calculate de App; nu modifică singur coșul, doar anunță prin callback-uri.
export default function CosDrawer({ deschis, linii, onClose, onSchimba, onScoate, onPlaseaza, onVeziMeniul }) { // props: starea, datele și callback-urile
  const ref = useRef(null); // elementul <dialog>
  const inchideRef = useRef(null); // butonul X, primește focusul la deschidere
  const titluRef = useRef(null); // titlul, primește focusul când o linie dispare
  const [livrare, setLivrare] = useState("standard"); // tipul de livrare ales; state local, contează doar aici până la plasare
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
    onSchimba(linie.id, delta); // anunțăm App
  } // sfârșitul funcției

  function handleScoate(id) { // coșul de gunoi de pe o linie
    titluRef.current.focus(); // linia va dispărea
    onScoate(id); // anunțăm App
  } // sfârșitul funcției

  function handleVeziMeniul() { // butonul din coșul gol
    ref.current.close(); // închidem imediat; browserul readuce focusul pe butonul coșului...
    onVeziMeniul(); // ...iar App îl mută apoi pe titlul meniului
  } // sfârșitul funcției

  function handleSubmit(e) { // trimiterea formularului = plasarea comenzii
    e.preventDefault(); // fără reîncărcarea paginii
    onPlaseaza(livrare); // App transformă coșul în comenzi
  } // sfârșitul funcției

  return ( // întoarcem JSX
    <dialog // elementul nativ pentru ferestre modale
      ref={ref} // legăm referința
      className="drawer" // panou lateral (vezi App.css)
      aria-labelledby="cos-titlu" // numele dialogului = titlul
      onClose={onClose} // Esc sau close(): anunțăm App
      onPointerDown={(e) => (apasatPeFundal.current = e.target === e.currentTarget)} // reținem unde a început apăsarea
      onClick={(e) => apasatPeFundal.current && e.target === e.currentTarget && onClose()} // închidem doar dacă și apăsarea, și eliberarea sunt pe fundal (nu la o selecție de text trasă din panou)
    >
      <div className="drawer-body">{/* conținutul ocupă toată înălțimea, deci clicurile din panou nu ajung la <dialog> */}
        <div className="drawer-head">{/* titlul și X-ul */}
          <h2 id="cos-titlu" ref={titluRef} tabIndex={-1}>Coșul tău</h2>{/* tabIndex -1: focus doar din cod */}
          <button // butonul de închidere
            ref={inchideRef} // primește focusul la deschidere
            type="button" // buton simplu
            className="btn-close" // clasa pentru stiluri
            onClick={onClose} // App pune `deschis` pe false
            aria-label="Închide coșul" // nume accesibil, butonul are doar iconiță
          >
            <X size={20} aria-hidden="true" />{/* iconiță decorativă */}
          </button>
        </div>

        {linii.length === 0 ? ( // coșul e gol
          <div className="drawer-empty">{/* starea goală */}
            <span className="drawer-empty-icon" aria-hidden="true"><ShoppingBag size={26} /></span>{/* iconiță decorativă */}
            <p className="drawer-empty-title">Coșul e gol</p>{/* mesajul principal */}
            <p>Adaugă preparate din meniu și le găsești aici.</p>{/* indicația */}
            <button type="button" className="btn-primary" onClick={handleVeziMeniul}>Vezi meniul</button>{/* închide coșul și duce la meniu */}
          </div>
        ) : ( // coșul are produse
          <form className="drawer-form" onSubmit={handleSubmit}>{/* formular: Enter pe un radio plasează comanda */}
            <div className="drawer-scroll">{/* zona care se derulează */}
              <ul className="cos-lista">{/* liniile coșului */}
                {linii.map((linie) => { // un rând pentru fiecare linie
                  const Iconita = ICONITE_CATEGORIE[linie.categorie]; // iconița categoriei
                  return ( // JSX-ul liniei
                    <li key={linie.id} className="cos-linie">{/* id-ul preparatului e unic în coș */}
                      <span className="thumb" aria-hidden="true"><Iconita size={20} strokeWidth={1.75} /></span>{/* iconița categoriei */}
                      <div className="cos-info">{/* numele și detaliile */}
                        <h3>{linie.preparat}</h3>{/* numele preparatului */}
                        <p>{linie.restaurant} · {formatLei(linie.pret)} / buc.</p>{/* restaurantul și prețul unitar */}
                      </div>
                      <span className="price cos-subtotal">{formatLei(linie.subtotal)}</span>{/* subtotalul liniei */}
                      <div className="cos-actiuni">{/* selectorul și ștergerea */}
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

              <fieldset className="livrare-optiuni">{/* grupul de butoane radio */}
                <legend>Livrare</legend>{/* numele grupului, citit înaintea fiecărei opțiuni */}
                {TIPURI_LIVRARE.map((tip) => ( // o opțiune pentru fiecare tip
                  <label key={tip} className="livrare-optiune">{/* tot cardul e clicabil */}
                    <input // butonul radio, controlat de React
                      type="radio" // o singură opțiune activă
                      name="livrare" // același name = același grup (săgețile trec de la unul la altul)
                      value={tip} // valoarea din date
                      checked={livrare === tip} // bifat dacă e cel ales
                      onChange={() => setLivrare(tip)} // schimbăm alegerea
                    />
                    <span className="livrare-text">{/* textele opțiunii */}
                      <strong>{ETICHETE_LIVRARE[tip]}</strong>{/* ex. „Express” */}
                      <span>{DURATE_LIVRARE[tip]}</span>{/* ex. „Sosește în ~20 min” */}
                    </span>
                  </label>
                ))}{/* sfârșitul map-ului */}
              </fieldset>
            </div>

            <div className="drawer-foot">{/* rezumatul și butonul, mereu vizibile */}
              <dl className="cos-rezumat">{/* listă de perechi termen / valoare */}
                <div><dt>Produse</dt><dd>{formatProduse(produse)}</dd></div>{/* numărul de produse */}
                <div className="cos-total"><dt>Total</dt><dd>{formatLei(total)}</dd></div>{/* totalul, fără taxe inventate */}
              </dl>
              <button type="submit" className="btn-primary">Plasează comanda · {formatLei(total)}</button>{/* trimite formularul */}
            </div>
          </form>
        )}{/* sfârșitul randării condiționate */}
      </div>
    </dialog>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
