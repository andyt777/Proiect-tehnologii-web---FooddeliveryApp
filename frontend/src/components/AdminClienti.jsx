import { clientiDinComenzi } from "../clienti.js";
import { formatComenzi, formatLei } from "../format.js";
import styles from "./Panou.module.css";

// Clienții în /admin, doar de citit: deduși din datele de contact ale comenzilor plasate din coș
export default function AdminClienti({ comenzi }) {
  const clienti = clientiDinComenzi(comenzi);
  return (
    <section className={styles.sectiune} aria-labelledby="admin-clienti-titlu">
      <h2 id="admin-clienti-titlu" className={styles.sectiuneTitlu}>Clienți</h2>
      <p className={styles.nota}>Demo: aplicația nu are încă conturi de client. Lista e dedusă din numele și telefonul lăsate la plasarea comenzilor din coș (același telefon = același client) și nu poate fi modificată de aici.</p>
      {clienti.length === 0 ? (
        <p className={styles.gol}>Niciun client încă. Apar după prima comandă plasată din coș, cu date de contact.</p>
      ) : (
        <div className={styles.tabelInvelis}>
          <table className={styles.tabel}>
            <caption className="sr-only">Clienții, după numărul de comenzi</caption>
            <thead>
              <tr><th scope="col">Nume</th><th scope="col">Telefon</th><th scope="col">Comenzi</th><th scope="col">Total plătit</th></tr>
            </thead>
            <tbody>
              {clienti.map((c) => (
                <tr key={c.cheie}>
                  <th scope="row">{c.nume}</th>
                  <td>{c.telefon}</td>
                  <td>{formatComenzi(c.numar)}</td>
                  <td className="price">{formatLei(c.totalPlatit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.indiciu}>„Total plătit” adună doar comenzile cu plata „Plătită” (cardul simulat la plasare, numerarul la livrare), după reducere.</p>
    </section>
  );
}
