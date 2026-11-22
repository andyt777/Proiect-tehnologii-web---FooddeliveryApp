import { Link } from "react-router-dom"; // titlul duce la pagina comenzii
import { AlarmClock, CircleCheck, CircleX, Clock, Zap } from "lucide-react"; // iconițele stării și ale întârzierii
import { ETICHETE_LIVRARE } from "../livrare.js"; // tipul livrării
import { formatLei, formatOra } from "../format.js"; // prețul și orele
import { arePret } from "../rezumat.js"; // comanda specială fără preț
import { intarziere, momenteStari } from "../metrici.js"; // regula întârzierii și momentele din istoric
import { etichetaStare, normalizeazaComanda } from "../stari.js"; // starea, cu valorile implicite
import styles from "./Panou.module.css"; // stilurile comune ale panourilor (CSS Modules)

// Pachetul B: o comandă pe paginile /restaurant, /livrator și /admin: titlul (link spre detaliu), starea, detaliile
// și, dacă pagina dă `acum`, întârzierea. Acțiunile fiecărei pagini vin ca `children`, sub detalii.
export default function ComandaPanou({ comanda: bruta, acum = null, arataRestaurant = false, children }) { // comanda de la server, ceasul paginii, restaurantul (doar la admin / livrator)
  const comanda = normalizeazaComanda(bruta); // câmpurile noi, cu valorile implicite
  const oprita = comanda.stare === "anulata" || comanda.stare === "respinsa"; // ieșirile laterale
  const Iconita = comanda.stare === "livrata" ? CircleCheck : oprita ? CircleX : Clock; // forma spune starea, nu doar textul
  const momentPlasare = momenteStari(comanda).get("plasata"); // ms sau undefined
  const plasataLa = Number.isFinite(momentPlasare) ? formatOra(new Date(momentPlasare).toISOString()) : null; // „18:30” sau null
  const programataLa = formatOra(comanda.programataLa); // ora programată sau null
  const intarziata = acum === null ? null : intarziere(comanda, acum); // { minute, pas } sau null

  return ( // JSX-ul cardului
    <article className={`${styles.card} ${intarziata ? styles.cardIntarziat : ""}`} aria-labelledby={`panou-comanda-${comanda.id}`}>{/* cardul are numele titlului */}
      <div className={styles.cardSus}>{/* titlul și starea */}
        <h3 id={`panou-comanda-${comanda.id}`} className={styles.cardTitlu}>{/* numele comenzii */}
          <Link to={`/comenzi/${comanda.id}`}>{comanda.preparat}</Link>{/* pagina de detaliu */}
          <span className={styles.numar}>Nr. {comanda.id}</span>{/* numărul comenzii */}
        </h3>
        <span className={`${styles.stare} ${oprita ? styles.stareOprita : ""}`}>{/* starea curentă */}
          <Iconita size={15} aria-hidden="true" />{/* bifă, X sau ceas */}
          {etichetaStare(comanda)}{/* ex. „În preparare”, „Gata de ridicare” */}
        </span>
      </div>
      <p className={styles.meta}>{/* detaliile, fără separatoare între ele */}
        {arataRestaurant && <span>{comanda.restaurant}</span>}{/* restaurantul, pe paginile cu mai multe restaurante */}
        {comanda.livrare === "express" ? <span className="tag tag-express"><Zap size={13} aria-hidden="true" />{ETICHETE_LIVRARE.express}</span> : <span>{ETICHETE_LIVRARE[comanda.livrare] ?? comanda.livrare}</span>}{/* doar Express primește culoare */}
        {arePret(comanda) ? <span className="price">{formatLei(comanda.pret)}</span> : <span className="price-asteptare">Fără preț încă</span>}{/* prețul de listă */}
        {comanda.reducere > 0 && <span>Cupon: −{formatLei(comanda.reducere)}</span>}{/* pachetul C: reducerea */}
        {plasataLa && <span>Plasată la <time dateTime={new Date(momentPlasare).toISOString()}>{plasataLa}</time></span>}{/* ora plasării */}
        {programataLa && <span>Programată pentru <time dateTime={comanda.programataLa}>{programataLa}</time></span>}{/* ora aleasă de client */}
      </p>
      {intarziata && ( // regula din metrici.js
        <p className={styles.intarziere}>{/* avertismentul: iconiță + text, nu doar culoare */}
          <AlarmClock size={16} aria-hidden="true" />{/* ceasul cu alarmă */}
          Întârziată cu {intarziata.minute} min la {intarziata.pas}{/* ex. „Întârziată cu 12 min la preparare” */}
        </p>
      )}{/* sfârșitul randării condiționate */}
      {oprita && comanda.motiv && <p className={styles.motiv}>Motiv: {comanda.motiv}</p>}{/* de ce s-a oprit */}
      {children}{/* acțiunile paginii */}
    </article>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
