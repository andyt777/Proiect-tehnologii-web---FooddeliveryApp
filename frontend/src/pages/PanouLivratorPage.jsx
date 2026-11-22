import { useEffect, useRef, useState } from "react";
import { CircleAlert, Power, RotateCw, X } from "lucide-react";
import ComandaPanou from "../components/ComandaPanou.jsx";
import PoartaRol from "../components/PoartaRol.jsx";
import TraseuSimulat from "../components/TraseuSimulat.jsx";
import { patchPasLivrare } from "../actiuniComenzi.js";
import { fetchLivratori, updateLivrator } from "../api.js";
import { useComenziLive } from "../comenziLive.js";
import {
  acelasiId, actiuneUrmatoare, adaugaRefuz, citesteRefuzate, curataLivratori, curseDisponibile, curseInCurand, curseLivrator,
  faraRefuzate, indicatoriLivrator, istoricLivrator, mesajPas, motivFaraAcceptare, numarLivrate, poateRenunta,
} from "../livrator.js";
import { formatLei } from "../format.js";
import { formatMinute } from "../metrici.js";
import { useMagazin } from "../magazin.js";
import { ETICHETE_PAS_LIVRARE, normalizeazaComanda } from "../stari.js";
import styles from "../components/Panou.module.css";

const CHEIE_REFUZATE = "curseRefuzate";
const LIMITA_ISTORIC = 20;

function citesteRefuzateSalvate() {
  try {
    return citesteRefuzate(localStorage.getItem(CHEIE_REFUZATE));
  } catch {
    return {};
  }
}

function salveazaRefuzate(valoare) {
  try {
    localStorage.setItem(CHEIE_REFUZATE, JSON.stringify(valoare));
  } catch {
    // fără localStorage, refuzul ține doar până la reîncărcarea paginii
  }
}

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
  const [refuzate, setRefuzate] = useState(citesteRefuzateSalvate);
  const titluRef = useRef(null);
  const focusDupa = useRef(null);
  const disponibileRef = useRef(null);

  useEffect(() => salveazaRefuzate(refuzate), [refuzate]);

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
  const disponibile = livrator ? faraRefuzate(curseDisponibile(comenzi), refuzate, livrator.id) : [];
  const motivAcceptare = motivFaraAcceptare(livrator, active.length);
  const inCurand = curseInCurand(comenzi);
  const istoric = livrator ? istoricLivrator(comenzi, livrator.id) : [];
  const performanta = livrator ? indicatoriLivrator(comenzi, livrator.id) : null;
  const inactiv = livrator?.activ === false;

  function alegeLivrator(id) {
    setAlesId(id);
    setAviz("");
    setEroareActiune(null);
  }

  async function handleOnline() {
    if (!livrator || schimbaOnline) return;
    if (inactiv && !livrator.online) {
      setAviz("");
      setEroareActiune("Contul e dezactivat de admin: nu poți intra online.");
      return;
    }
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

  function avanseaza(comanda, pas) {
    return executa(comanda, (proaspata) => patchPasLivrare(proaspata, pas, new Date()), mesajPas(pas, comanda.preparat));
  }

  // Refuzul ascunde cursa doar pentru acest livrator (salvat în acest browser); comanda rămâne disponibilă pentru ceilalți
  function refuza(comanda) {
    disponibileRef.current?.focus();
    setRefuzate((prev) => adaugaRefuz(prev, livrator.id, comanda.id));
    setEroareActiune(null);
    setAviz(`Ai refuzat cursa „${comanda.preparat}”. Nu o mai vezi în listă; ceilalți livratori o pot accepta.`);
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
            <button type="button" className="btn-primary" aria-disabled={ocupat} onClick={() => avanseaza(bruta, actiune.pas)}>
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
          <h2 id="livrator-disponibile" ref={disponibileRef} tabIndex={-1} className={`titlu-focus ${styles.sectiuneTitlu}`}>Curse disponibile</h2>
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
                    <div className={styles.actiuni}>
                      {!motivAcceptare && (
                        <button type="button" className="btn-primary" aria-disabled={inLucru === bruta.id} onClick={() => accepta(bruta)}>
                          {inLucru === bruta.id ? "Se trimite…" : "Acceptă cursa"}
                        </button>
                      )}
                      <button type="button" className="btn-secondary" onClick={() => refuza(bruta)} aria-label={`Refuză cursa „${bruta.preparat}”`}>Refuză</button>
                    </div>
                  </ComandaPanou>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className={styles.sectiune} aria-labelledby="livrator-in-curand">
          <h2 id="livrator-in-curand" className={styles.sectiuneTitlu}>În curând</h2>
          <p className={styles.nota}>Comenzi cu livrare pe care restaurantul încă nu a început să le pregătească. Doar le vezi: devin curse disponibile când intră în preparare.</p>
          {inCurand.length === 0 ? (
            <p className={styles.gol}>Nicio comandă în așteptare.</p>
          ) : (
            <ul className={styles.lista}>
              {inCurand.map((bruta) => (
                <li key={bruta.id}>
                  <ComandaPanou comanda={bruta} arataRestaurant>
                    <dl className={styles.detalii}>
                      <div><dt>Ridici de la</dt><dd>{bruta.restaurant}</dd></div>
                      <div><dt>Duci la</dt><dd>{normalizeazaComanda(bruta).adresa ?? "Adresă necunoscută (comandă veche)"}</dd></div>
                    </dl>
                  </ComandaPanou>
                </li>
              ))}
            </ul>
          )}
        </section>
        {performanta && (
          <section className={styles.sectiune} aria-labelledby="livrator-istoric">
            <h2 id="livrator-istoric" className={styles.sectiuneTitlu}>Istoric și performanță</h2>
            <p className={styles.nota}>Timpul mediu de livrare vine din istoricul comenzilor (de la „În livrare” la „Livrată”); comenzile fără istoric intră doar în numărătoare și valoare.</p>
            <dl className={styles.indicatori}>
              <div><dt>Comenzi predate</dt><dd>{performanta.numar}</dd></div>
              <div><dt>Timp mediu de livrare</dt><dd>{formatMinute(performanta.medieLivrareMin)}</dd></div>
              <div><dt>Valoarea comenzilor predate</dt><dd>{formatLei(performanta.valoare)}</dd></div>
            </dl>
            {istoric.length === 0 ? (
              <p className={styles.gol}>Nicio cursă predată încă.</p>
            ) : (
              <ul className={`${styles.lista} ${styles.sectiuneMica}`}>
                {istoric.slice(0, LIMITA_ISTORIC).map((bruta) => <li key={bruta.id}><ComandaPanou comanda={bruta} arataRestaurant /></li>)}
              </ul>
            )}
          </section>
        )}
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
                {livratori.map((l) => <option key={l.id} value={String(l.id)}>{l.activ ? l.nume : `${l.nume}, dezactivat`}</option>)}
              </select>
            </div>
            <button type="button" className={livrator.online ? "btn-secondary" : "btn-primary"} aria-disabled={schimbaOnline || (inactiv && !livrator.online)} aria-describedby={inactiv ? "livrator-inactiv" : undefined} onClick={handleOnline}>
              <Power size={18} aria-hidden="true" />
              {schimbaOnline ? "Se trimite…" : livrator.online ? "Ieși offline" : "Intră online"}
            </button>
            <p className={styles.indiciu}>
              Acum: <strong>{livrator.online ? "online" : "offline"}</strong>. Comenzi predate: {numarLivrate(comenzi, livrator.id)}.
            </p>
            {inactiv && <p id="livrator-inactiv" className={styles.indiciu}>Cont dezactivat de admin: nu poate intra online și nu poate accepta curse.</p>}
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
