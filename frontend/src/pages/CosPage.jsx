import { useEffect, useRef, useState } from "react"; // useState: trimiterea și eroarea; useRef: focus pe titlu; useEffect: focus la deschidere
import { Link, useNavigate } from "react-router-dom"; // Link: drumul spre meniu; useNavigate: după plasare, spre comenzi
import { CircleAlert, RotateCw, ShoppingBag, Trash2 } from "lucide-react"; // iconițele paginii
import AlegereLivrare from "../components/AlegereLivrare.jsx"; // tipul de livrare
import Miniatura from "../components/Miniatura.jsx"; // fotografia mică a preparatului
import Stepper from "../components/Stepper.jsx"; // selectorul de cantitate
import { createComanda } from "../api.js"; // POST /comenzi, prin singurul fișier cu fetch
import { cosInComenzi, numarProduse, schimbaCantitate, totalCos } from "../cos.js"; // logica pură a coșului
import { formatLei, formatProduse } from "../format.js"; // sume și numărul de produse
import { useMagazin } from "../magazin.js"; // starea comună: coșul, meniul, livrarea, confirmarea
import styles from "./CosPage.module.css"; // stilurile paginii (CSS Modules)

// Redesign „Pădure”: pagina coșului, la /cos: liniile, cantitățile, livrarea, totalul și „Plasează comanda”.
// Plasarea e cea din Etapa 7 (mutată din ComenziPage): câte un POST pentru fiecare linie, cu Promise.allSettled;
// liniile salvate ies din coș, cele eșuate rămân, cu un mesaj. Dacă totul a ajuns, mergem la „Comenzile tale”.
export default function CosPage() { // componenta rutei /cos
  const { linii, setCos, schimba, scoate, incarcareMeniu, eroareMeniu, reincarcaMeniu, livrare, setLivrare, setConfirmare } = useMagazin(); // starea comună
  const [trimite, setTrimite] = useState(false); // true cât timp comenzile pleacă spre server
  const [eroare, setEroare] = useState(null); // ce linii n-au ajuns la server (null = nicio eroare)
  const titluRef = useRef(null); // titlul paginii
  const navigate = useNavigate(); // navigarea după plasare

  // La deschidere, focusul merge pe titlu: cititorul de ecran anunță pagina nouă
  useEffect(() => { // rulează o dată, după prima randare
    titluRef.current?.focus({ preventScroll: true }); // titlul are tabIndex -1
  }, []); // fără dependențe: doar la deschidere

  const produse = numarProduse(linii); // câte produse sunt în coș
  const total = totalCos(linii); // totalul de plată

  // Butonul apăsat (− la 1 sau coșul de gunoi) dispare odată cu linia; mutăm focusul pe titlu înainte
  function handleSchimba(linie, delta) { // „−” / „+” pe o linie
    if (linie.cantitate + delta <= 0) titluRef.current.focus(); // linia va dispărea
    schimba(linie.id, delta); // starea comună
  } // sfârșitul funcției

  function handleScoate(id) { // coșul de gunoi de pe o linie
    titluRef.current.focus(); // linia va dispărea
    scoate(id); // starea comună
  } // sfârșitul funcției

  // Enter pe un buton radio ar trimite formularul și ar plasa comanda din greșeală; comanda se plasează doar din buton
  function handleKeyDown(e) { // tastă apăsată oriunde în formular
    if (e.key === "Enter" && e.target.type === "radio") e.preventDefault(); // fără trimiterea implicită
  } // sfârșitul funcției

  // Etapa 7: plasarea așteaptă serverul. Butonul rămâne focalizabil (aria-disabled, nu disabled); a doua apăsare e ignorată.
  async function handleSubmit(e) { // trimiterea formularului = plasarea comenzii
    e.preventDefault(); // fără reîncărcarea paginii
    const deTrimis = linii; // liniile din randarea curentă
    if (trimite || deTrimis.length === 0) return; // o trimitere e deja în curs sau nu e nimic de plasat
    setTrimite(true); // butonul arată „Se trimite…”
    setEroare(null); // ascundem eroarea unei încercări anterioare
    const comenziNoi = cosInComenzi(deTrimis, livrare, new Date().toISOString()); // o comandă fără id pentru fiecare linie
    const rezultate = await Promise.allSettled(comenziNoi.map((c) => createComanda(c))); // toate cererile pornesc deodată
    const liniiSalvate = deTrimis.filter((_, i) => rezultate[i].status === "fulfilled"); // liniile care au ajuns
    const erori = rezultate.filter((r) => r.status === "rejected").map((r) => r.reason); // motivele celor eșuate
    if (liniiSalvate.length > 0) { // măcar o comandă a ajuns
      setCos((prev) => liniiSalvate.reduce((cos, l) => schimbaCantitate(cos, l.id, -l.cantitate), prev)); // scădem exact cantitatea trimisă
      setConfirmare({ produse: numarProduse(liniiSalvate), total: totalCos(liniiSalvate) }); // „Comanda a fost plasată”, pe orice pagină
    } // sfârșitul if
    setTrimite(false); // butonul revine la normal
    if (erori.length === 0) { navigate("/#comenzi"); return; } // totul a ajuns: lista de comenzi, cu focus pe titlul ei
    const motiv = erori[0]?.message ?? "eroare necunoscută"; // primul motiv e de obicei același pentru toate
    setEroare(liniiSalvate.length === 0 // nimic nu a ajuns
      ? `Comanda nu a fost plasată: ${motiv}. Produsele au rămas în coș; încearcă din nou.` // totul a eșuat
      : `Am plasat ${formatProduse(numarProduse(liniiSalvate))}, dar restul nu: ${motiv}. Ce nu s-a trimis a rămas în coș.`); // doar o parte
  } // sfârșitul funcției

  return ( // JSX-ul paginii
    <div className={`wrap ${styles.pagina}`}>{/* containerul centrat */}
      <div className="section-header">{/* titlul paginii și numărul de produse */}
        <h1 id="cos-pagina-titlu" className={`titlu-focus ${styles.titlu}`} ref={titluRef} tabIndex={-1}>Coșul tău</h1>{/* tabIndex -1: focus doar din cod */}
        {!incarcareMeniu && !eroareMeniu && linii.length > 0 && <span className="section-meta">{formatProduse(produse)}</span>}{/* ex. „3 produse” */}
      </div>

      {incarcareMeniu ? ( // meniul nu a sosit: nu știm încă ce e în coș
        <p className="info" role="status" data-testid="loading">Se încarcă coșul…</p>// mesajul de încărcare
      ) : eroareMeniu ? ( // meniul nu s-a putut încărca
        <div className="error">{/* panoul de eroare */}
          <CircleAlert size={22} aria-hidden="true" />{/* iconiță decorativă */}
          <div className="error-body">{/* textul și butonul */}
            <p role="alert" data-testid="error">Nu am putut încărca meniul: {eroareMeniu}. Produsele din coș apar după ce se încarcă.</p>{/* ce s-a întâmplat */}
            <button type="button" className="btn-primary" onClick={reincarcaMeniu}>{/* ce poate face utilizatorul */}
              <RotateCw size={18} aria-hidden="true" />{/* iconiță decorativă */}
              Încearcă din nou{/* textul butonului */}
            </button>
          </div>
        </div>
      ) : linii.length === 0 ? ( // coșul e gol
        <div className="empty">{/* starea goală */}
          <span className={styles.golIcon} aria-hidden="true"><ShoppingBag size={26} /></span>{/* iconiță decorativă */}
          <p>Coșul e gol</p>{/* mesajul principal */}
          <p className="empty-hint">Adaugă preparate din meniu și le găsești aici.</p>{/* indicația */}
          <Link to="/#meniu" className="btn-primary">Vezi meniul</Link>{/* drumul spre meniu */}
        </div>
      ) : ( // coșul are produse
        <form className={styles.grila} onSubmit={handleSubmit} onKeyDown={handleKeyDown} aria-labelledby="cos-pagina-titlu">{/* formular: se trimite doar din butonul „Plasează comanda” */}
          <ul className={styles.lista}>{/* liniile coșului */}
            {linii.map((linie) => ( // un rând pentru fiecare linie
              <li key={linie.id} className={styles.linie}>{/* id-ul preparatului e unic în coș */}
                <Miniatura preparat={linie.preparat} categorie={linie.categorie} />{/* fotografia mică */}
                <div className={styles.info}>{/* numele și detaliile */}
                  <h2 className={styles.nume}>{linie.preparat}</h2>{/* numele preparatului */}
                  <p className={styles.detalii}>{linie.restaurant}</p>{/* restaurantul */}
                  <p className={styles.detalii}><span className="price">{formatLei(linie.pret)}</span> bucata</p>{/* prețul unitar */}
                </div>
                <div className={styles.actiuni}>{/* selectorul și ștergerea */}
                  <Stepper preparat={linie.preparat} cantitate={linie.cantitate} onSchimba={(delta) => handleSchimba(linie, delta)} />{/* − cantitate + */}
                  <button type="button" className="btn-danger" onClick={() => handleScoate(linie.id)} aria-label={`Scoate ${linie.preparat} din coș`} title="Scoate din coș">{/* scoate toată linia */}
                    <Trash2 size={18} aria-hidden="true" />{/* iconiță decorativă */}
                  </button>
                </div>
                <span className={`price ${styles.subtotal}`}>{formatLei(linie.subtotal)}</span>{/* subtotalul liniei */}
              </li>
            ))}{/* sfârșitul map-ului */}
          </ul>

          <aside className={`panel ${styles.rezumat}`} aria-label="Rezumatul comenzii">{/* foaia din dreapta: livrarea și totalul */}
            <AlegereLivrare valoare={livrare} onAlege={setLivrare} nume="livrare-cos" />{/* aceeași alegere ca în hero */}
            <dl className={styles.sume}>{/* perechi termen / valoare */}
              <div><dt>Produse</dt><dd>{formatProduse(produse)}</dd></div>{/* numărul de produse */}
              <div className={styles.total}><dt>Total</dt><dd className="price">{formatLei(total)}</dd></div>{/* totalul, fără taxe inventate */}
            </dl>
            {eroare && <p className={styles.eroare} role="alert"><CircleAlert size={18} aria-hidden="true" />{eroare}</p>}{/* Etapa 7: liniile care n-au ajuns au rămas în coș */}
            <button type="submit" className={`btn-primary ${styles.plaseaza}`} aria-disabled={trimite}>{trimite ? "Se trimite…" : "Plasează comanda"}</button>{/* trimite formularul; aria-disabled cât se trimite */}
          </aside>
        </form>
      )}{/* sfârșitul randării condiționate */}
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
