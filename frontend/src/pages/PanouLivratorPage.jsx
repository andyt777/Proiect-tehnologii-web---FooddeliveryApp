import { useEffect, useRef, useState } from "react";
import { CircleAlert, Power, RotateCw, X } from "lucide-react";
import ComandaPanou from "../components/ComandaPanou.jsx";
import PoartaRol from "../components/PoartaRol.jsx";
import TraseuSimulat from "../components/TraseuSimulat.jsx";
import { patchPasLivrare } from "../actiuniComenzi.js";
import { fetchLivratori, updateLivrator } from "../api.js";
import { useComenziLive } from "../comenziLive.js";
import { acelasiId, actiuneUrmatoare, curataLivratori, curseDisponibile, curseLivrator, motivFaraAcceptare, numarLivrate, poateRenunta } from "../livrator.js";
import { useMagazin } from "../magazin.js";
import { ETICHETE_PAS_LIVRARE, normalizeazaComanda } from "../stari.js";
import styles from "../components/Panou.module.css";

// Pachetul B: pagina /livrator (rolul demo Livrator). Livratorii sunt demo, traseul e o simulare, fără hartă și fără GPS.
export default function PanouLivratorPage() {
  return <PoartaRol rol="livrator" titlu="Cursele livratorului"><PanouLivrator /></PoartaRol>;
}

function PanouLivrator() {
  const { noteazaComanda } = useMagazin();
  const { comenzi, incarcare, eroare, acum, reincarca, aplica } = useComenziLive(noteazaComanda);
  const [livratori, setLivratori] = useState([]);
  const [incarcareLivratori, setIncarcareLivratori] = useState(true);
  const [eroareLivratori, setEroareLivratori] = useState(null);
  const [incercariLivratori, setIncercariLivratori] = useState(0);
  const [alesId, setAlesId] = useState(null);
  const [schimbaOnline, setSchimbaOnline] = useState(false);
  const [inLucru, setInLucru] = useState(null);
  const [eroareActiune, setEroareActiune] = useState(null);
  const [aviz, setAviz] = useState("");
  const titluRef = useRef(null);
  const focusDupa = useRef(null);

  useEffect(() => {
    titluRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchLivratori()
      .then((date) => { if (!ignore) { setLivratori(curataLivratori(date)); setEroareLivratori(null); } })
      .catch((err) => { if (!ignore) setEroareLivratori(err.message); })
      .finally(() => { if (!ignore) setIncarcareLivratori(false); });
    return () => { ignore = true; };
  }, [incercariLivratori]);

  // După o acțiune cardul se mută între secțiuni; focusul îl urmează (altfel merge pe titlul paginii)
  useEffect(() => {
    if (focusDupa.current === null) return;
    const tinta = document.querySelector(`#panou-comanda-${focusDupa.current} a`);
    focusDupa.current = null;
    (tinta ?? titluRef.current)?.focus({ preventScroll: Boolean(!tinta) });
  }, [comenzi]);

  function reincarcaLivratori() {
    setEroareLivratori(null);
    setIncarcareLivratori(true);
    setIncercariLivratori((n) => n + 1);
  }

  const livrator = livratori.find((l) => acelasiId(l.id, alesId)) ?? livratori[0] ?? null;
  const active = livrator ? curseLivrator(comenzi, livrator.id) : [];
  const disponibile = curseDisponibile(comenzi);
  const motivAcceptare = motivFaraAcceptare(livrator, active.length);

  function alegeLivrator(id) {
    setAlesId(id);
    setAviz("");
    setEroareActiune(null);
  }

  async function handleOnline() {
    if (!livrator || schimbaOnline) return;
    setSchimbaOnline(true);
    try {
      const actualizat = await updateLivrator(livrator.id, { online: !livrator.online });
      const [curat] = curataLivratori([actualizat]);
      if (curat) setLivratori((prev) => prev.map((l) => (acelasiId(l.id, curat.id) ? curat : l)));
      setEroareActiune(null);
      setAviz(curat?.online ? `${livrator.nume} e online și poate accepta curse.` : `${livrator.nume} e offline.`);
    } catch (err) {
      setAviz("");
      setEroareActiune(`Nu am putut schimba starea livratorului: ${err.message}`);
    } finally {
      setSchimbaOnline(false);
    }
  }

  // O acțiune pe o cursă: comanda proaspătă, apoi corpul PATCH din stari.js (aruncă dacă pasul nu mai e permis)
  async function executa(comanda, construieste, mesaj) {
    if (inLucru !== null) return;
    setInLucru(comanda.id);
    try {
      await aplica(comanda.id, construieste);
      focusDupa.current = comanda.id;
      setEroareActiune(null);
      setAviz(mesaj);
    } catch (err) {
      setAviz("");
      setEroareActiune(`Nu am putut actualiza cursa „${comanda.preparat}”: ${err.message}`);
    } finally {
      setInLucru(null);
    }
  }

  function accepta(comanda) {
    const id = livrator.id;
    return executa(comanda, (proaspata) => patchPasLivrare(proaspata, "asignata", new Date(), { livratorId: id }), `Ai acceptat cursa „${comanda.preparat}”.`);
  }

  function avanseaza(comanda, pas, text) {
    return executa(comanda, (proaspata) => patchPasLivrare(proaspata, pas, new Date()), `${text}: „${comanda.preparat}”.`);
  }

  function renunta(comanda) {
    return executa(comanda, (proaspata) => patchPasLivrare(proaspata, "neasignata", new Date()), `Ai renunțat la cursa „${comanda.preparat}”. A revenit în lista curselor disponibile.`);
  }

  function cardCursaActiva(bruta) {
    const c = normalizeazaComanda(bruta);
    const actiune = actiuneUrmatoare(c);
    const ocupat = inLucru === c.id;
    return (
      <ComandaPanou comanda={bruta} acum={acum} arataRestaurant>
        <dl className={styles.detalii}>
          <div><dt>Pasul curent</dt><dd>{ETICHETE_PAS_LIVRARE[c.livrareStare]}</dd></div>
          <div><dt>Ridici de la</dt><dd>{c.restaurant}</dd></div>
          <div><dt>Duci la</dt><dd>{c.adresa ?? "Adresă necunoscută (comandă veche)"}</dd></div>
          {c.contact && <div><dt>Client</dt><dd>{c.contact.nume}, {c.contact.telefon}</dd></div>}
        </dl>
        <TraseuSimulat key={`${c.id}-${c.livrareStare}`} pas={c.livrareStare} />
        <div className={styles.actiuni}>
          {actiune?.permis && (
            <button type="button" className="btn-primary" aria-disabled={ocupat} onClick={() => avanseaza(bruta, actiune.pas, actiune.text)}>
              {ocupat ? "Se trimite…" : actiune.text}
            </button>
          )}
          {poateRenunta(c) && (
            <button type="button" className="btn-secondary" aria-disabled={ocupat} onClick={() => renunta(bruta)}>Renunță la cursă</button>
          )}
          {actiune && !actiune.permis && <p className={styles.indiciu}>{actiune.motiv}</p>}
        </div>
      </ComandaPanou>
    );
  }

  function continutComenzi() {
    if (incarcare) return <p className="info" role="status">Se încarcă cursele…</p>;
    if (eroare && comenzi.length === 0) {
      return (
        <div className={`error ${styles.avertisment}`}>
          <CircleAlert size={22} aria-hidden="true" />
          <div className="error-body">
            <p role="alert">Nu am putut încărca comenzile: {eroare}. Pornește serverul cu <code>npm run api</code> și încearcă din nou.</p>
            <button type="button" className="btn-primary" onClick={reincarca}><RotateCw size={18} aria-hidden="true" />Încearcă din nou</button>
          </div>
        </div>
      );
    }
    return (
      <>
        {eroare && <p className={styles.indiciu} role="status">Ultima actualizare a eșuat ({eroare}). Încercăm din nou în câteva secunde.</p>}
        <section className={styles.sectiune} aria-labelledby="livrator-active">
          <h2 id="livrator-active" className={styles.sectiuneTitlu}>Cursa ta</h2>
          {active.length === 0 ? (
            <p className={styles.gol}>Nu ai nicio cursă în lucru. Acceptă una din lista de mai jos.</p>
          ) : (
            <ul className={styles.lista}>
              {active.map((c) => <li key={c.id}>{cardCursaActiva(c)}</li>)}
            </ul>
          )}
        </section>
        <section className={styles.sectiune} aria-labelledby="livrator-disponibile">
          <h2 id="livrator-disponibile" className={styles.sectiuneTitlu}>Curse disponibile</h2>
          {disponibile.length > 0 && motivAcceptare && <p className={styles.indiciu}>{motivAcceptare}</p>}
          {disponibile.length === 0 ? (
            <p className={styles.gol}>Nicio cursă disponibilă acum. Apar aici comenzile cu livrare aflate în preparare sau gata, fără livrator.</p>
          ) : (
            <ul className={styles.lista}>
              {disponibile.map((bruta) => (
                <li key={bruta.id}>
                  <ComandaPanou comanda={bruta} acum={acum} arataRestaurant>
                    <dl className={styles.detalii}>
                      <div><dt>Ridici de la</dt><dd>{bruta.restaurant}</dd></div>
                      <div><dt>Duci la</dt><dd>{normalizeazaComanda(bruta).adresa ?? "Adresă necunoscută (comandă veche)"}</dd></div>
                    </dl>
                    {!motivAcceptare && (
                      <div className={styles.actiuni}>
                        <button type="button" className="btn-primary" aria-disabled={inLucru === bruta.id} onClick={() => accepta(bruta)}>
                          {inLucru === bruta.id ? "Se trimite…" : "Acceptă cursa"}
                        </button>
                      </div>
                    )}
                  </ComandaPanou>
                </li>
              ))}
            </ul>
          )}
        </section>
      </>
    );
  }

  return (
    <div className={`wrap ${styles.pagina}`}>
      <h1 ref={titluRef} tabIndex={-1} className={`titlu-focus ${styles.titlu}`}>Cursele livratorului</h1>
      <p className={styles.intro}>Alege un livrator, intră online și acceptă o cursă. Apoi treci prin pași: spre restaurant, preluată, spre client, livrată. Lista se actualizează singură la 10 secunde.</p>
      <p className={styles.nota}>Livratorii sunt conturi demo, iar traseul e o simulare pe un plan desenat: nu e o hartă reală și nu folosește GPS.</p>

      {incarcareLivratori ? (
        <p className="info" role="status">Se încarcă livratorii…</p>
      ) : eroareLivratori ? (
        <div className={`error ${styles.avertisment}`}>
          <CircleAlert size={22} aria-hidden="true" />
          <div className="error-body">
            <p role="alert">Nu am putut încărca livratorii: {eroareLivratori}.</p>
            <button type="button" className="btn-primary" onClick={reincarcaLivratori}><RotateCw size={18} aria-hidden="true" />Încearcă din nou</button>
          </div>
        </div>
      ) : livratori.length === 0 ? (
        <div className="empty">
          <p>Niciun livrator demo</p>
          <p className="empty-hint">Resursa „livratori” din db.json e goală. Adaugă un livrator demo și reîncarcă pagina.</p>
        </div>
      ) : (
        <>
          <div className={styles.bara}>
            <div className={styles.alegere}>
              <label htmlFor="panou-livrator">Livratorul</label>
              <select id="panou-livrator" value={String(livrator.id)} onChange={(e) => alegeLivrator(e.target.value)}>
                {livratori.map((l) => <option key={l.id} value={String(l.id)}>{l.nume}</option>)}
              </select>
            </div>
            <button type="button" className={livrator.online ? "btn-secondary" : "btn-primary"} aria-disabled={schimbaOnline} onClick={handleOnline}>
              <Power size={18} aria-hidden="true" />
              {schimbaOnline ? "Se trimite…" : livrator.online ? "Ieși offline" : "Intră online"}
            </button>
            <p className={styles.indiciu}>
              Acum: <strong>{livrator.online ? "online" : "offline"}</strong>. Comenzi predate: {numarLivrate(comenzi, livrator.id)}.
            </p>
          </div>

          {eroareActiune && (
            <div className={`error ${styles.avertisment}`}>
              <CircleAlert size={20} aria-hidden="true" />
              <p role="alert">{eroareActiune}</p>
              <button type="button" className="btn-close" onClick={() => setEroareActiune(null)} aria-label="Închide mesajul de eroare"><X size={18} aria-hidden="true" /></button>
            </div>
          )}
          <p className={styles.aviz} role="status">{aviz}</p>

          {continutComenzi()}
        </>
      )}
    </div>
  );
}
