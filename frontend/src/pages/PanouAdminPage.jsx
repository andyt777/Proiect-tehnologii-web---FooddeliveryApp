import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CircleAlert, RotateCw, X } from "lucide-react";
import ComandaPanou from "../components/ComandaPanou.jsx";
import FormularAsignare from "../components/FormularAsignare.jsx";
import FormularMotiv from "../components/FormularMotiv.jsx";
import PoartaRol from "../components/PoartaRol.jsx";
import { patchPasLivrare, patchTranzitie } from "../actiuniComenzi.js";
import { fetchLivratori } from "../api.js";
import { useComenziLive } from "../comenziLive.js";
import { formatComenzi, formatData, formatLei, formatOra } from "../format.js";
import { curataLivratori, livratoriActivi, numeLivrator } from "../livrator.js";
import AdminClienti from "../components/AdminClienti.jsx";
import AdminLivratori from "../components/AdminLivratori.jsx";
import AdminRestaurante from "../components/AdminRestaurante.jsx";
import FilePanou, { PanouFila } from "../components/FilePanou.jsx";
import { useMagazin } from "../magazin.js";
import { FILTRE_GOALE, REGULA_INTARZIERE, filtreazaComenzi, formatMinute, formatProcent, indicatori, intarziere, jurnalEvenimente } from "../metrici.js";
import { RESTAURANTE_INFO } from "../restaurante.js";
import {
  ETICHETE_METODA_PLATA, ETICHETE_PAS_LIVRARE, ETICHETE_STARE, ETICHETE_STARE_PLATA, PASI_LIVRARE, STARI_COMANDA, STARI_PLATA,
  esteRidicare, etichetaPas, normalizeazaComanda, poateAvansaLivrarea, poateTrece,
} from "../stari.js";
import styles from "../components/Panou.module.css";

const LIMITA_JURNAL = 40;
const FILE = [
  { id: "comenzi", titlu: "Comenzi" },
  { id: "livratori", titlu: "Livratori" },
  { id: "restaurante", titlu: "Restaurante" },
  { id: "clienti", titlu: "Clienți" },
];

// Pachetul B: pagina /admin (rolul demo Admin): toate comenzile cu cele trei stări, filtre, întârzieri,
// asignarea manuală a livratorului, anularea, indicatorii din `istoric` și jurnalul de evenimente.
export default function PanouAdminPage() {
  return <PoartaRol rol="admin" titlu="Panoul de administrare"><PanouAdmin /></PoartaRol>;
}

function PanouAdmin() {
  const { noteazaComanda } = useMagazin();
  const { comenzi, incarcare, eroare, acum, reincarca, aplica } = useComenziLive(noteazaComanda);
  const [livratori, setLivratori] = useState([]);
  const [incarcareLivratori, setIncarcareLivratori] = useState(true);
  const [fila, setFila] = useState("comenzi");
  const [filtre, setFiltre] = useState(FILTRE_GOALE);
  const [deschis, setDeschis] = useState(null);
  const [inLucru, setInLucru] = useState(null);
  const [eroareActiune, setEroareActiune] = useState(null);
  const [aviz, setAviz] = useState("");
  const titluRef = useRef(null);
  const focusDupa = useRef(null);

  useEffect(() => {
    titluRef.current?.focus({ preventScroll: true });
  }, []);

  // Livratorii sunt doar pentru nume și asignare; dacă lipsesc, pagina merge mai departe
  useEffect(() => {
    let ignore = false;
    fetchLivratori()
      .then((date) => { if (!ignore) setLivratori(curataLivratori(date)); })
      .catch(() => {})
      .finally(() => { if (!ignore) setIncarcareLivratori(false); });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (focusDupa.current === null) return;
    const tinta = document.querySelector(`#panou-comanda-${focusDupa.current} a`);
    focusDupa.current = null;
    (tinta ?? titluRef.current)?.focus({ preventScroll: Boolean(!tinta) });
  }, [comenzi, deschis]);

  function schimbaFiltru(cheie, valoare) {
    setFiltre((prev) => ({ ...prev, [cheie]: valoare }));
  }

  async function executa(comanda, construieste, mesaj) {
    await aplica(comanda.id, construieste);
    focusDupa.current = comanda.id;
    setDeschis(null);
    setEroareActiune(null);
    setAviz(mesaj);
  }

  async function retrage(comanda) {
    if (inLucru !== null) return;
    setInLucru(comanda.id);
    try {
      await executa(comanda, (p) => patchPasLivrare(p, "neasignata", new Date()), `Livratorul a fost retras de la „${comanda.preparat}”.`);
    } catch (err) {
      setAviz("");
      setEroareActiune(`Nu am putut retrage livratorul de la „${comanda.preparat}”: ${err.message}`);
    } finally {
      setInLucru(null);
    }
  }

  function inchideFormular(id) {
    focusDupa.current = id;
    setDeschis(null);
  }

  const lista = Array.isArray(comenzi) ? comenzi : [];
  const cifre = indicatori(lista);
  const intarziate = acum === null ? 0 : lista.filter((c) => intarziere(c, acum) !== null).length;
  const filtrate = filtreazaComenzi(lista, filtre, acum).slice().reverse();
  const jurnal = jurnalEvenimente(lista, LIMITA_JURNAL);
  const filtreActive = Object.keys(FILTRE_GOALE).some((k) => filtre[k] !== FILTRE_GOALE[k]);

  function actiuniCard(bruta, c) {
    if (deschis?.id === c.id && deschis.tip === "asigneaza") {
      return (
        <FormularAsignare
          id={`asigneaza-${c.id}`}
          livratori={livratoriActivi(livratori)}
          onConfirma={(l) => executa(bruta, (p) => patchPasLivrare(p, "asignata", new Date(), { livratorId: l.id }), `${l.nume} duce comanda „${c.preparat}”.`)}
          onRenunta={() => inchideFormular(c.id)}
        />
      );
    }
    if (deschis?.id === c.id && deschis.tip === "anuleaza") {
      return (
        <FormularMotiv
          id={`anuleaza-${c.id}`}
          intrebare="De ce anulezi comanda?"
          textConfirma="Anulează comanda"
          onConfirma={(motiv) => executa(bruta, (p) => patchTranzitie(p, "anulata", "admin", new Date(), { motiv }), `Comanda „${c.preparat}” a fost anulată.`)}
          onRenunta={() => inchideFormular(c.id)}
        />
      );
    }
    const ocupat = inLucru === c.id;
    const butoane = [
      poateAvansaLivrarea(c, "asignata") && <button key="asigneaza" type="button" className="btn-primary" onClick={() => setDeschis({ id: c.id, tip: "asigneaza" })}>Asignează livrator</button>,
      poateAvansaLivrarea(c, "neasignata") && <button key="retrage" type="button" className="btn-secondary" aria-disabled={ocupat} onClick={() => retrage(bruta)}>{ocupat ? "Se trimite…" : "Retrage livratorul"}</button>,
      poateTrece(c, "anulata", "admin") && <button key="anuleaza" type="button" className="btn-secondary" onClick={() => setDeschis({ id: c.id, tip: "anuleaza" })}>Anulează</button>,
    ].filter(Boolean);
    return butoane.length > 0 ? <div className={styles.actiuni}>{butoane}</div> : null;
  }

  function cardComanda(bruta) {
    const c = normalizeazaComanda(bruta);
    const livrare = esteRidicare(c) ? "Ridicare personală, fără livrator" : ETICHETE_PAS_LIVRARE[c.livrareStare];
    const nume = c.livratorId === null ? null : numeLivrator(livratori, c.livratorId) ?? `Livratorul nr. ${c.livratorId}`;
    return (
      <ComandaPanou comanda={bruta} acum={acum} arataRestaurant>
        <dl className={styles.detalii}>
          <div><dt>Livrare</dt><dd>{livrare}</dd></div>
          {nume && <div><dt>Livrator</dt><dd>{nume}</dd></div>}
          <div><dt>Plată</dt><dd>{ETICHETE_METODA_PLATA[c.plata.metoda]}, {ETICHETE_STARE_PLATA[c.plata.stare].toLowerCase()}</dd></div>
          {c.cupon && <div><dt>Cupon</dt><dd>{c.cupon}</dd></div>}
        </dl>
        {actiuniCard(bruta, c)}
      </ComandaPanou>
    );
  }

  if (incarcare) {
    return (
      <div className={`wrap ${styles.pagina}`}>
        <h1 ref={titluRef} tabIndex={-1} className={`titlu-focus ${styles.titlu}`}>Panoul de administrare</h1>
        <p className="info" role="status">Se încarcă comenzile…</p>
      </div>
    );
  }

  if (eroare && lista.length === 0) {
    return (
      <div className={`wrap ${styles.pagina}`}>
        <h1 ref={titluRef} tabIndex={-1} className={`titlu-focus ${styles.titlu}`}>Panoul de administrare</h1>
        <div className={`error ${styles.avertisment}`}>
          <CircleAlert size={22} aria-hidden="true" />
          <div className="error-body">
            <p role="alert">Nu am putut încărca comenzile: {eroare}. Pornește serverul cu <code>npm run api</code> și încearcă din nou.</p>
            <button type="button" className="btn-primary" onClick={reincarca}><RotateCw size={18} aria-hidden="true" />Încearcă din nou</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`wrap ${styles.pagina}`}>
      <h1 ref={titluRef} tabIndex={-1} className={`titlu-focus ${styles.titlu}`}>Panoul de administrare</h1>
      <p className={styles.intro}>Toate comenzile, cu starea comenzii, a livrării și a plății. Lista se actualizează singură la 10 secunde.</p>
      <p className={styles.nota}>Rolul Admin e un comutator demo, nu un cont: serverul demo acceptă orice modificare.</p>
      {eroare && <p className={styles.indiciu} role="status">Ultima actualizare a eșuat ({eroare}). Încercăm din nou în câteva secunde.</p>}

      <FilePanou prefix="admin" eticheta="Secțiunile panoului" file={FILE} activa={fila} onAlege={setFila} />

      {fila === "livratori" && (
        <PanouFila prefix="admin" id="livratori">
          <AdminLivratori livratori={livratori} setLivratori={setLivratori} comenzi={lista} incarcare={incarcareLivratori} />
        </PanouFila>
      )}
      {fila === "restaurante" && <PanouFila prefix="admin" id="restaurante"><AdminRestaurante /></PanouFila>}
      {fila === "clienti" && <PanouFila prefix="admin" id="clienti"><AdminClienti comenzi={lista} /></PanouFila>}
      {fila === "comenzi" && (
      <PanouFila prefix="admin" id="comenzi">
      <section className={styles.sectiune} aria-labelledby="admin-indicatori">
        <h2 id="admin-indicatori" className={styles.sectiuneTitlu}>Indicatori</h2>
        <p className={styles.nota}>Duratele vin din momentele salvate în istoricul fiecărei comenzi. Comenzile vechi, fără istoric, intră doar în numărătoare și valoare. Ratele se calculează din comenzile încheiate.</p>
        <dl className={styles.indicatori}>
          <div><dt>Comenzi</dt><dd>{cifre.numar}</dd></div>
          <div><dt>Valoare (fără anulate și respinse)</dt><dd>{formatLei(cifre.valoare)}</dd></div>
          <div><dt>Întârziate acum</dt><dd>{intarziate}</dd></div>
          <div><dt>Timp mediu până la acceptare</dt><dd>{formatMinute(cifre.medieAcceptareMin)}</dd></div>
          <div><dt>Timp mediu de preparare</dt><dd>{formatMinute(cifre.mediePreparareMin)}</dd></div>
          <div><dt>Timp mediu de livrare</dt><dd>{formatMinute(cifre.medieLivrareMin)}</dd></div>
          <div><dt>Rata de finalizare</dt><dd>{formatProcent(cifre.rataFinalizare)}</dd></div>
          <div><dt>Rata de anulare și respingere</dt><dd>{formatProcent(cifre.rataAnulare)}</dd></div>
        </dl>
      </section>

      {eroareActiune && (
        <div className={`error ${styles.avertisment}`}>
          <CircleAlert size={20} aria-hidden="true" />
          <p role="alert">{eroareActiune}</p>
          <button type="button" className="btn-close" onClick={() => setEroareActiune(null)} aria-label="Închide mesajul de eroare"><X size={18} aria-hidden="true" /></button>
        </div>
      )}
      <p className={styles.aviz} role="status">{aviz}</p>

      <div className={`${styles.doiColoane} ${styles.sectiune}`}>
        <section aria-labelledby="admin-comenzi">
          <h2 id="admin-comenzi" className={styles.sectiuneTitlu}>Comenzi</h2>
          <fieldset className={styles.filtre}>
            <legend className="sr-only">Filtrează comenzile</legend>
            <div className={styles.alegere}>
              <label htmlFor="filtru-stare">Starea comenzii</label>
              <select id="filtru-stare" value={filtre.stare} onChange={(e) => schimbaFiltru("stare", e.target.value)}>
                <option value="toate">Toate</option>
                {STARI_COMANDA.map((s) => <option key={s} value={s}>{ETICHETE_STARE[s]}</option>)}
              </select>
            </div>
            <div className={styles.alegere}>
              <label htmlFor="filtru-livrare">Livrarea</label>
              <select id="filtru-livrare" value={filtre.livrare} onChange={(e) => schimbaFiltru("livrare", e.target.value)}>
                <option value="toate">Toate</option>
                <option value="ridicare">Ridicare personală</option>
                {PASI_LIVRARE.map((p) => <option key={p} value={p}>{ETICHETE_PAS_LIVRARE[p]}</option>)}
              </select>
            </div>
            <div className={styles.alegere}>
              <label htmlFor="filtru-plata">Plata</label>
              <select id="filtru-plata" value={filtre.plata} onChange={(e) => schimbaFiltru("plata", e.target.value)}>
                <option value="toate">Toate</option>
                {STARI_PLATA.map((s) => <option key={s} value={s}>{ETICHETE_STARE_PLATA[s]}</option>)}
              </select>
            </div>
            <div className={styles.alegere}>
              <label htmlFor="filtru-restaurant">Restaurantul</label>
              <select id="filtru-restaurant" value={filtre.restaurant} onChange={(e) => schimbaFiltru("restaurant", e.target.value)}>
                <option value="toate">Toate</option>
                {RESTAURANTE_INFO.map((r) => <option key={r.slug} value={r.nume}>{r.nume}</option>)}
              </select>
            </div>
            <label className={styles.bifa}>
              <input type="checkbox" checked={filtre.doarIntarziate} onChange={(e) => schimbaFiltru("doarIntarziate", e.target.checked)} />
              Doar întârziate
            </label>
            {filtreActive && <button type="button" className="btn-secondary" onClick={() => setFiltre(FILTRE_GOALE)}>Șterge filtrele</button>}
          </fieldset>
          <details className={styles.regula}>
            <summary>Când e o comandă întârziată</summary>
            <p>{REGULA_INTARZIERE}</p>
          </details>
          <p className={styles.indiciu} role="status">{filtreActive ? `${filtrate.length} din ${formatComenzi(lista.length)}` : formatComenzi(lista.length)}, cele mai noi primele.</p>
          {filtrate.length === 0 ? (
            <p className={styles.gol}>{lista.length === 0 ? "Nu există nicio comandă." : "Nicio comandă nu trece de filtre."}</p>
          ) : (
            <ul className={`${styles.lista} ${styles.listaAdmin}`}>
              {filtrate.map((c) => <li key={c.id}>{cardComanda(c)}</li>)}
            </ul>
          )}
        </section>

        <section aria-labelledby="admin-jurnal">
          <h2 id="admin-jurnal" className={styles.sectiuneTitlu}>Jurnal de evenimente</h2>
          <p className={styles.nota}>Fiecare schimbare de stare din istoricul comenzilor, cele mai noi primele (ultimele {LIMITA_JURNAL}).</p>
          {jurnal.length === 0 ? (
            <p className={styles.gol}>Niciun eveniment încă. Apar după prima comandă plasată din coș.</p>
          ) : (
            <ol className={styles.jurnal}>
              {jurnal.map((e) => (
                <li key={e.cheie}>
                  <time dateTime={e.la} title={formatData(e.la) ?? undefined}>{formatOra(e.la)}</time>
                  <span>
                    {e.comandaId !== null ? <Link to={`/comenzi/${e.comandaId}`}>{e.preparat || `Comanda nr. ${e.comandaId}`}</Link> : e.preparat}
                    : {etichetaPas(e.stare, e.ridicare)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
      </PanouFila>
      )}
    </div>
  );
}
