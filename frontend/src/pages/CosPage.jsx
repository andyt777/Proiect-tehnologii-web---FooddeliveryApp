import { useEffect, useRef, useState } from "react"; // useState: câmpurile, trimiterea și erorile; useRef: focus; useEffect: focus la deschidere
import { Link, useNavigate } from "react-router-dom"; // Link: drumul spre meniu și spre cont; useNavigate: după plasare, spre comenzi
import { Banknote, CircleAlert, CreditCard, RotateCw, ShoppingBag, Tag, Trash2, X } from "lucide-react"; // iconițele paginii
import AlegereLivrare from "../components/AlegereLivrare.jsx"; // tipul de livrare
import Miniatura from "../components/Miniatura.jsx"; // fotografia mică a preparatului
import Stepper from "../components/Stepper.jsx"; // selectorul de cantitate
import { createComanda, fetchComenzi } from "../api.js"; // POST /comenzi, prin singurul fișier cu fetch
import { detaliiCheckout, oraMinimaProgramare, valideazaCheckout } from "../checkout.js"; // fluxul complet: validarea și câmpurile noi, pure
import { cosInComenzi, numarProduse, schimbaCantitate, totalCos } from "../cos.js"; // logica pură a coșului
import { COD_MAX, CUPOANE, campuriCupon, gasesteCupon, imparteReducere, normalizeazaCod, numarComenziAnterioare, valideazaCupon } from "../cupoane.js";
import { formatLei, formatProduse } from "../format.js"; // sume și numărul de produse
import { useMagazin } from "../magazin.js"; // starea comună: coșul, meniul, livrarea, confirmarea, contul
import { adaugaAdresa, salveazaContact } from "../profil.js"; // salvarea datelor în cont, la cerere
import { mesajeProbleme, momentVerificare, problemeCos } from "../program.js";
import styles from "./CosPage.module.css"; // stilurile paginii (CSS Modules)

const ALTA = "alta"; // valoarea opțiunii „Altă adresă”

// Redesign „Pădure”: pagina coșului, la /cos: liniile, cantitățile, livrarea, totalul și „Plasează comanda”.
// Plasarea e cea din Etapa 7 (mutată din ComenziPage): câte un POST pentru fiecare linie, cu Promise.allSettled;
// liniile salvate ies din coș, cele eșuate rămân, cu un mesaj. Dacă totul a ajuns, mergem la „Comenzile tale”.
// Fluxul complet: înainte de plasare, contactul, adresa (din cont sau scrisă), programarea și plata (simulată sau numerar).
export default function CosPage() { // componenta rutei /cos
  const { linii, setCos, schimba, scoate, incarcareMeniu, eroareMeniu, reincarcaMeniu, livrare, setLivrare, setConfirmare, profil, setProfil, noteazaComanda, profiluri, ceas } = useMagazin(); // starea comună
  const [trimite, setTrimite] = useState(false); // true cât timp comenzile pleacă spre server
  const [eroare, setEroare] = useState(null); // ce linii n-au ajuns la server (null = nicio eroare)
  const [nume, setNume] = useState(profil.nume); // numele, completat din cont
  const [telefon, setTelefon] = useState(profil.telefon); // telefonul, completat din cont
  const [adresaAleasa, setAdresaAleasa] = useState(profil.implicita ?? ALTA); // id-ul unei adrese salvate sau ALTA
  const [adresaNoua, setAdresaNoua] = useState(""); // adresa scrisă aici
  const [programare, setProgramare] = useState("acum"); // „acum” sau „programat”
  const [ora, setOra] = useState(""); // ora aleasă („HH:MM”)
  const [oraMinima, setOraMinima] = useState(null); // cea mai devreme oră posibilă, calculată când se alege programarea
  const [metodaPlata, setMetodaPlata] = useState("numerar"); // „numerar” sau „card_simulat”
  const [salveazaInCont, setSalveazaInCont] = useState(false); // păstrăm numele, telefonul și adresa nouă?
  const [codCupon, setCodCupon] = useState("");
  const [cuponAplicat, setCuponAplicat] = useState(null);
  const [mesajCupon, setMesajCupon] = useState("");
  const [verificaCupon, setVerificaCupon] = useState(false);
  const [problema, setProblema] = useState(null); // { camp, mesaj } pentru câmpul greșit (null = niciunul)
  const titluRef = useRef(null); // titlul paginii
  const numeRef = useRef(null); // câmpul „Nume”, primește focus la o eroare
  const telefonRef = useRef(null); // câmpul „Telefon”
  const adresaSalvataRef = useRef(null); // prima adresă salvată
  const adresaNouaRef = useRef(null); // câmpul „Adresa”
  const programareRef = useRef(null); // „Cât mai repede”
  const oraRef = useRef(null); // câmpul „Ora”
  const plataRef = useRef(null); // „Numerar”
  const cuponInputRef = useRef(null);
  const problemeRef = useRef(null);
  const cuponEliminaRef = useRef(null);
  const focusCupon = useRef(null);
  const navigate = useNavigate(); // navigarea după plasare

  // La deschidere, focusul merge pe titlu: cititorul de ecran anunță pagina nouă
  useEffect(() => { // rulează o dată, după prima randare
    titluRef.current?.focus({ preventScroll: true }); // titlul are tabIndex -1
  }, []); // fără dependențe: doar la deschidere

  const produse = numarProduse(linii); // câte produse sunt în coș
  const total = totalCos(linii); // totalul de plată

  // Pachetul C: cuponul aplicat se verifică din nou la fiecare randare, fiindcă subtotalul se schimbă odată cu coșul.
  // comenziAnterioare e numărul aflat la „Aplică” (pentru regula primei comenzi); nu se cere din nou la fiecare randare.
  const verificareCupon = cuponAplicat ? valideazaCupon(cuponAplicat.cod, { subtotal: total, comenziAnterioare: cuponAplicat.comenziAnterioare }) : null;
  const reducere = verificareCupon?.ok ? verificareCupon.reducere : 0;
  const totalDePlata = total - reducere;

  // Preparatele indisponibile și restaurantele închise (la ora aleasă) sau în pauză blochează plasarea
  const probleme = problemeCos(linii, profiluri, momentVerificare(programare, ora, ceas));
  const problemaLinie = new Map(probleme.map((p) => [p.produsId, p.motiv]));

  // Câmpul cuponului și butonul „Elimină cuponul” se înlocuiesc unul pe altul; focusul îl urmează pe cel nou
  useEffect(() => {
    if (focusCupon.current === "elimina") cuponEliminaRef.current?.focus();
    if (focusCupon.current === "camp") cuponInputRef.current?.focus();
    focusCupon.current = null;
  }, [cuponAplicat]);
  const ridicare = livrare === "ridicare"; // la ridicare nu cerem adresa
  const adresaSalvata = profil.adrese.find((a) => a.id === adresaAleasa); // adresa din cont aleasă (sau undefined)
  const adresa = adresaSalvata ? adresaSalvata.text : adresaNoua; // textul trimis la server
  const scrieAdresa = !adresaSalvata; // câmpul „Adresa” apare când nu e aleasă una salvată

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
    if (e.key === "Enter" && (e.target.type === "radio" || e.target.type === "checkbox")) e.preventDefault(); // fără trimiterea implicită
  } // sfârșitul funcției

  // Schimbarea unui câmp: noua valoare; marcajul de eroare dispare de pe câmpul corectat
  function schimbaCamp(camp, setter) { // primește numele câmpului și funcția lui de actualizare
    return (valoare) => { // primește valoarea nouă
      setter(valoare); // în state
      if (problema?.camp === camp) setProblema(null); // câmpul corectat nu mai e marcat
    }; // sfârșitul funcției
  } // sfârșitul funcției

  // „La o anumită oră”: calculăm acum cea mai devreme oră (în handler, nu la randare: ora curentă nu e o valoare pură)
  function handleProgramare(valoare) { // „acum” sau „programat”
    schimbaCamp("programare", setProgramare)(valoare); // valoarea nouă
    if (valoare === "programat") setOraMinima(oraMinimaProgramare(new Date())); // ex. „19:35” sau null după 23:30
  } // sfârșitul funcției

  // Atributul aria-describedby: indicația câmpului și, dacă e cazul, mesajul de eroare
  function descriere(camp, extra) { // primește numele câmpului și id-ul indicației (opțional)
    return [extra, problema?.camp === camp ? `cos-eroare-${camp}` : null].filter(Boolean).join(" ") || undefined; // undefined = fără atribut
  } // sfârșitul funcției

  // Mesajul de sub un câmp, doar pentru câmpul greșit
  function mesajCamp(camp) { // primește numele câmpului
    if (problema?.camp !== camp) return null; // alt câmp sau nicio eroare
    return <p id={`cos-eroare-${camp}`} className={styles.eroareCamp} role="alert"><CircleAlert size={16} aria-hidden="true" />{problema.mesaj}</p>; // iconiță + text, nu doar culoare
  } // sfârșitul funcției

  // Pachetul C: „Aplică”. Pentru un cupon de primă comandă citim comenzile de la server, ca să aflăm dacă clientul a mai comandat din coș.
  async function aplicaCupon() {
    if (verificaCupon) return;
    const cod = normalizeazaCod(codCupon);
    const cupon = gasesteCupon(cod);
    let comenziAnterioare = 0;
    if (cupon?.primaComanda) {
      setVerificaCupon(true);
      try {
        comenziAnterioare = numarComenziAnterioare(await fetchComenzi());
      } catch (err) {
        setMesajCupon(`Nu am putut verifica dacă e prima ta comandă: ${err.message}. Încearcă din nou.`);
        return;
      } finally {
        setVerificaCupon(false);
      }
    }
    const rezultat = valideazaCupon(cod, { subtotal: total, comenziAnterioare });
    if (!rezultat.ok) {
      setMesajCupon(rezultat.mesaj);
      cuponInputRef.current?.focus();
      return;
    }
    focusCupon.current = "elimina";
    setMesajCupon("");
    setCodCupon("");
    setCuponAplicat({ cod: rezultat.cupon.cod, comenziAnterioare });
    if (problema?.camp === "cupon") setProblema(null);
  }

  function eliminaCupon() {
    focusCupon.current = "camp";
    setCuponAplicat(null);
    setMesajCupon("");
    if (problema?.camp === "cupon") setProblema(null);
  }

  // Enter în câmpul cuponului aplică codul; altfel ar trimite formularul și ar plasa comanda
  function handleCuponTasta(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    aplicaCupon();
  }

  // Etapa 7: plasarea așteaptă serverul. Butonul rămâne focalizabil (aria-disabled, nu disabled); a doua apăsare e ignorată.
  async function handleSubmit(e) { // trimiterea formularului = plasarea comenzii
    e.preventDefault(); // fără reîncărcarea paginii
    const deTrimis = linii; // liniile din randarea curentă
    if (trimite || deTrimis.length === 0) return; // o trimitere e deja în curs sau nu e nimic de plasat
    const acum = new Date(); // momentul plasării, același pentru validare, `creata` și istoric
    const date = { nume, telefon, livrare, adresa, programare, ora, metodaPlata }; // valorile din formular
    const gresitCupon = verificareCupon && !verificareCupon.ok ? { camp: "cupon", mesaj: `${verificareCupon.mesaj} Elimină cuponul sau schimbă coșul.` } : null;
    const blocaje = problemeCos(deTrimis, profiluri, momentVerificare(programare, ora, acum.getTime()));
    const gresitCos = blocaje.length > 0 ? { camp: "cos", mesaj: mesajeProbleme(blocaje).join(" ") } : null;
    const gresit = valideazaCheckout(date, acum) ?? gresitCupon ?? gresitCos; // null sau { camp, mesaj }
    if (gresit) { // datele nu sunt bune: nu trimitem nimic
      setProblema(gresit); // mesajul, sub câmpul greșit
      const refuri = { nume: numeRef, telefon: telefonRef, adresa: scrieAdresa ? adresaNouaRef : adresaSalvataRef, programare: programareRef, ora: oraRef, plata: plataRef, cupon: cuponEliminaRef, cos: problemeRef }; // referințele câmpurilor (obiectul e creat aici, în handler, nu la randare)
      refuri[gresit.camp]?.current?.focus(); // utilizatorul ajunge direct la câmpul de corectat
      return; // ne oprim
    } // sfârșitul validării
    setProblema(null); // niciun câmp marcat
    setTrimite(true); // butonul arată „Se trimite…”
    setEroare(null); // ascundem eroarea unei încercări anterioare
    const extra = detaliiCheckout(date, acum); // stare, plată, istoric, adresă, contact, programare
    // Pachetul C: fiecare linie devine o comandă separată, deci reducerea coșului se împarte pe linii, proporțional cu prețul lor
    const parti = imparteReducere(reducere, deTrimis.map((l) => l.subtotal));
    const codFolosit = reducere > 0 ? cuponAplicat.cod : null;
    const comenziNoi = cosInComenzi(deTrimis, livrare, acum.toISOString()).map((c, i) => ({ ...c, ...extra, ...(codFolosit ? campuriCupon(codFolosit, parti[i]) : {}) })); // o comandă fără id pentru fiecare linie, cu câmpurile noi
    const rezultate = await Promise.allSettled(comenziNoi.map((c) => createComanda(c))); // toate cererile pornesc deodată
    const liniiSalvate = deTrimis.filter((_, i) => rezultate[i].status === "fulfilled"); // liniile care au ajuns
    const erori = rezultate.filter((r) => r.status === "rejected").map((r) => r.reason); // motivele celor eșuate
    for (const r of rezultate) if (r.status === "fulfilled") noteazaComanda(r.value); // urmărirea pornește pentru comenzile noi
    if (liniiSalvate.length > 0) { // măcar o comandă a ajuns
      setCos((prev) => liniiSalvate.reduce((cos, l) => schimbaCantitate(cos, l.id, -l.cantitate), prev)); // scădem exact cantitatea trimisă
      const reducereSalvata = parti.reduce((suma, parte, i) => (rezultate[i].status === "fulfilled" ? suma + parte : suma), 0);
      setConfirmare({ produse: numarProduse(liniiSalvate), total: totalCos(liniiSalvate) - reducereSalvata }); // „Comanda a fost plasată”, pe orice pagină
      setCuponAplicat(null);
      if (salveazaInCont) { // utilizatorul a cerut să păstrăm datele
        const idAdresa = `a${acum.getTime().toString(36)}`; // id nou, calculat aici (funcția de actualizare trebuie să rămână pură)
        const adresaDeSalvat = !ridicare && scrieAdresa ? adresa : null; // doar o adresă scrisă acum
        setProfil((p) => { // profilul nou, din funcțiile pure
          const cuContact = salveazaContact(p, { nume, telefon }); // numele și telefonul
          return adresaDeSalvat ? adaugaAdresa(cuContact, { text: adresaDeSalvat }, idAdresa) : cuContact; // și adresa nouă (fără dubluri)
        }); // sfârșitul actualizării
      } // sfârșitul if
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
        <form className={styles.grila} onSubmit={handleSubmit} onKeyDown={handleKeyDown} aria-labelledby="cos-pagina-titlu" noValidate>{/* formular: se trimite doar din butonul „Plasează comanda”; noValidate: mesajele sunt cele din cod */}
          <div className={styles.stanga}>{/* liniile și datele de livrare */}
            <ul className={styles.lista}>{/* liniile coșului */}
              {linii.map((linie) => ( // un rând pentru fiecare linie
                <li key={linie.id} className={styles.linie}>{/* id-ul preparatului e unic în coș */}
                  <Miniatura preparat={linie.preparat} categorie={linie.categorie} />{/* fotografia mică */}
                  <div className={styles.info}>{/* numele și detaliile */}
                    <h2 className={styles.nume}>{linie.preparat}</h2>{/* numele preparatului */}
                    <p className={styles.detalii}>{linie.restaurant}</p>{/* restaurantul */}
                    <p className={styles.detalii}><span className="price">{formatLei(linie.pret)}</span> bucata</p>{/* prețul unitar */}
                    {problemaLinie.has(linie.id) && <p className={styles.problemaLinie}><CircleAlert size={16} aria-hidden="true" />{problemaLinie.get(linie.id)}</p>}
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

            <section className={styles.sectiune} aria-labelledby="cos-contact-titlu">{/* contactul */}
              <h2 id="cos-contact-titlu" className={styles.sectiuneTitlu}>Date de contact</h2>{/* titlul secțiunii */}
              <p className={styles.indicatie}>Restaurantul și livratorul te sună doar dacă e nevoie. {profil.nume === "" && <Link to="/cont">Le poți salva în cont.</Link>}</p>{/* de ce le cerem */}
              <div className={styles.campuri2}>{/* numele și telefonul, alăturate pe ecrane late */}
                <div className={styles.camp}>{/* numele */}
                  <label htmlFor="cos-nume">Nume</label>{/* eticheta */}
                  <input id="cos-nume" ref={numeRef} type="text" value={nume} onChange={(e) => schimbaCamp("nume", setNume)(e.target.value)} autoComplete="name" maxLength={60} aria-invalid={problema?.camp === "nume"} aria-describedby={descriere("nume")} />{/* câmp controlat */}
                  {mesajCamp("nume")}{/* eroarea, dacă e cazul */}
                </div>
                <div className={styles.camp}>{/* telefonul */}
                  <label htmlFor="cos-telefon">Telefon</label>{/* eticheta */}
                  <input id="cos-telefon" ref={telefonRef} type="tel" value={telefon} onChange={(e) => schimbaCamp("telefon", setTelefon)(e.target.value)} autoComplete="tel" inputMode="tel" maxLength={20} placeholder="0722 123 456" aria-invalid={problema?.camp === "telefon"} aria-describedby={descriere("telefon")} />{/* câmp controlat */}
                  {mesajCamp("telefon")}{/* eroarea, dacă e cazul */}
                </div>
              </div>
            </section>

            {!ridicare && ( // la ridicare nu există adresă
              <section className={styles.sectiune} aria-labelledby="cos-adresa-titlu">{/* adresa */}
                <h2 id="cos-adresa-titlu" className={styles.sectiuneTitlu}>Adresa de livrare</h2>{/* titlul secțiunii */}
                {profil.adrese.length > 0 && ( // există adrese salvate în cont
                  <fieldset className={styles.grup}>{/* alegerea adresei */}
                    <legend className="sr-only">Alege adresa</legend>{/* numele grupului, pentru cititoarele de ecran */}
                    {profil.adrese.map((a, i) => ( // o opțiune pentru fiecare adresă salvată
                      <label key={a.id} className={styles.optiune}>{/* tot rândul e clicabil */}
                        <input type="radio" name="cos-adresa" value={a.id} checked={adresaAleasa === a.id} onChange={() => schimbaCamp("adresa", setAdresaAleasa)(a.id)} ref={i === 0 ? adresaSalvataRef : undefined} />{/* radio controlat */}
                        <span className={styles.optiuneText}>{/* textele */}
                          {a.eticheta && <span className={styles.optiuneTitlu}>{a.eticheta}</span>}{/* ex. „Acasă” */}
                          <span className={a.eticheta ? styles.optiuneDetaliu : styles.optiuneTitlu}>{a.text}</span>{/* adresa */}
                        </span>
                      </label>
                    ))}{/* sfârșitul map-ului */}
                    <label className={styles.optiune}>{/* adresa scrisă acum */}
                      <input type="radio" name="cos-adresa" value={ALTA} checked={adresaAleasa === ALTA} onChange={() => schimbaCamp("adresa", setAdresaAleasa)(ALTA)} />{/* radio controlat */}
                      <span className={styles.optiuneTitlu}>Altă adresă</span>{/* textul opțiunii */}
                    </label>
                  </fieldset>
                )}{/* sfârșitul randării condiționate */}
                {scrieAdresa && ( // fără adrese salvate sau „Altă adresă”
                  <div className={styles.camp}>{/* adresa scrisă */}
                    <label htmlFor="cos-adresa-noua">Adresa</label>{/* eticheta */}
                    <input id="cos-adresa-noua" ref={adresaNouaRef} type="text" value={adresaNoua} onChange={(e) => schimbaCamp("adresa", setAdresaNoua)(e.target.value)} autoComplete="street-address" maxLength={160} placeholder="Strada, numărul, blocul, orașul" aria-invalid={problema?.camp === "adresa"} aria-describedby={descriere("adresa")} />{/* câmp controlat */}
                  </div>
                )}{/* sfârșitul randării condiționate */}
                {mesajCamp("adresa")}{/* eroarea, dacă e cazul */}
              </section>
            )}{/* sfârșitul randării condiționate */}

            <section className={styles.sectiune} aria-labelledby="cos-cand-titlu">{/* programarea */}
              <h2 id="cos-cand-titlu" className={styles.sectiuneTitlu}>Când</h2>{/* titlul secțiunii */}
              <fieldset className={styles.grup}>{/* cele două variante */}
                <legend className="sr-only">Când vrei comanda</legend>{/* numele grupului */}
                <label className={styles.optiune}>{/* cât mai repede */}
                  <input type="radio" name="cos-programare" value="acum" checked={programare === "acum"} onChange={() => handleProgramare("acum")} ref={programareRef} />{/* radio controlat */}
                  <span className={styles.optiuneTitlu}>Cât mai repede</span>{/* textul opțiunii */}
                </label>
                <label className={styles.optiune}>{/* la o oră anume */}
                  <input type="radio" name="cos-programare" value="programat" checked={programare === "programat"} onChange={() => handleProgramare("programat")} />{/* radio controlat */}
                  <span className={styles.optiuneTitlu}>La o anumită oră, azi</span>{/* textul opțiunii */}
                </label>
              </fieldset>
              {programare === "programat" && ( // ora, doar pentru programare
                <div className={`${styles.camp} ${styles.campOra}`}>{/* ora */}
                  <label htmlFor="cos-ora">Ora</label>{/* eticheta */}
                  <input id="cos-ora" ref={oraRef} type="time" value={ora} min={oraMinima ?? undefined} step={300} onChange={(e) => schimbaCamp("ora", setOra)(e.target.value)} aria-invalid={problema?.camp === "ora"} aria-describedby={descriere("ora", "cos-ora-indiciu")} />{/* câmp controlat, din 5 în 5 minute */}
                  <span id="cos-ora-indiciu" className={styles.indicatie}>{oraMinima ? `Cel mai devreme ${oraMinima}.` : "Azi nu mai poți programa o comandă."}</span>{/* regula de 30 de minute */}
                  {mesajCamp("ora")}{/* eroarea, dacă e cazul */}
                </div>
              )}{/* sfârșitul randării condiționate */}
              {mesajCamp("programare")}{/* eroarea, dacă e cazul */}
            </section>

            <section className={styles.sectiune} aria-labelledby="cos-plata-titlu">{/* plata */}
              <h2 id="cos-plata-titlu" className={styles.sectiuneTitlu}>Plata</h2>{/* titlul secțiunii */}
              <fieldset className={styles.grup}>{/* metodele */}
                <legend className="sr-only">Cum plătești</legend>{/* numele grupului */}
                <label className={styles.optiune}>{/* numerar */}
                  <input type="radio" name="cos-plata" value="numerar" checked={metodaPlata === "numerar"} onChange={() => schimbaCamp("plata", setMetodaPlata)("numerar")} ref={plataRef} />{/* radio controlat */}
                  <Banknote size={20} aria-hidden="true" className={styles.optiuneIcon} />{/* iconiță decorativă */}
                  <span className={styles.optiuneText}>{/* textele */}
                    <span className={styles.optiuneTitlu}>Numerar</span>{/* metoda */}
                    <span className={styles.optiuneDetaliu}>{ridicare ? "Plătești la ridicare." : "Plătești livratorului, la ușă."}</span>{/* când */}
                  </span>
                </label>
                <label className={styles.optiune}>{/* cardul simulat */}
                  <input type="radio" name="cos-plata" value="card_simulat" checked={metodaPlata === "card_simulat"} onChange={() => schimbaCamp("plata", setMetodaPlata)("card_simulat")} aria-describedby="cos-plata-nota" />{/* radio controlat */}
                  <CreditCard size={20} aria-hidden="true" className={styles.optiuneIcon} />{/* iconiță decorativă */}
                  <span className={styles.optiuneText}>{/* textele */}
                    <span className={styles.optiuneTitlu}>Card, simulare</span>{/* metoda */}
                    <span id="cos-plata-nota" className={styles.optiuneDetaliu}>Simulare: nu introduce date reale de card. Comanda apare ca plătită, fără nicio tranzacție.</span>{/* avertismentul cerut */}
                  </span>
                </label>
              </fieldset>
              {mesajCamp("plata")}{/* eroarea, dacă e cazul */}
              <label className={styles.bifa}>{/* salvarea în cont */}
                <input type="checkbox" checked={salveazaInCont} onChange={(e) => setSalveazaInCont(e.target.checked)} />{/* checkbox controlat */}
                {ridicare || !scrieAdresa ? "Salvează numele și telefonul în cont" : "Salvează numele, telefonul și adresa în cont"}{/* ce se salvează */}
              </label>
            </section>
          </div>

          <aside className={`panel ${styles.rezumat}`} aria-label="Rezumatul comenzii">{/* foaia din dreapta: livrarea și totalul */}
            <AlegereLivrare valoare={livrare} onAlege={setLivrare} nume="livrare-cos" />{/* aceeași alegere ca în hero */}
            <section className={styles.cupon} aria-labelledby="cos-cupon-titlu">
              <h2 id="cos-cupon-titlu" className={styles.cuponTitlu}>Cupon de reducere</h2>
              {cuponAplicat ? (
                <div className={styles.cuponAplicat}>
                  <span className={styles.cuponCod}><Tag size={16} aria-hidden="true" />{cuponAplicat.cod}</span>
                  <button type="button" ref={cuponEliminaRef} className="btn-secondary" onClick={eliminaCupon} aria-describedby={descriere("cupon")}>
                    <X size={16} aria-hidden="true" />
                    Elimină cuponul
                  </button>
                </div>
              ) : (
                <div className={styles.cuponRand}>
                  <div className={styles.camp}>
                    <label htmlFor="cos-cupon">Cod</label>
                    <input
                      id="cos-cupon"
                      ref={cuponInputRef}
                      type="text"
                      value={codCupon}
                      onChange={(e) => { setCodCupon(e.target.value); setMesajCupon(""); }}
                      onKeyDown={handleCuponTasta}
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      maxLength={COD_MAX}
                      aria-invalid={mesajCupon !== ""}
                      aria-describedby={mesajCupon ? "cos-cupon-mesaj cos-cupon-reguli" : "cos-cupon-reguli"}
                    />
                  </div>
                  <button type="button" className="btn-secondary" onClick={aplicaCupon} aria-disabled={verificaCupon}>{verificaCupon ? "Se verifică…" : "Aplică"}</button>
                </div>
              )}
              {mesajCupon && <p id="cos-cupon-mesaj" className={styles.eroareCamp} role="alert"><CircleAlert size={16} aria-hidden="true" />{mesajCupon}</p>}
              <p className={styles.cuponStare} role="status">{cuponAplicat && verificareCupon?.ok ? `Cuponul ${cuponAplicat.cod} e aplicat: ${formatLei(reducere)} reducere.` : ""}</p>
              {cuponAplicat && !verificareCupon?.ok && problema?.camp !== "cupon" && <p className={styles.indicatie}>{verificareCupon.mesaj}</p>}
              {mesajCamp("cupon")}
              <ul id="cos-cupon-reguli" className={styles.cuponReguli}>
                {CUPOANE.map((c) => <li key={c.cod}><strong>{c.cod}</strong>: {c.descriere}</li>)}
              </ul>
            </section>
            <dl className={styles.sume}>{/* perechi termen / valoare */}
              <div><dt>Produse</dt><dd>{formatProduse(produse)}</dd></div>{/* numărul de produse */}
              {reducere > 0 && (
                <>
                  <div><dt>Subtotal</dt><dd className="price">{formatLei(total)}</dd></div>
                  <div><dt>Reducere {cuponAplicat.cod}</dt><dd className="price">−{formatLei(reducere)}</dd></div>
                </>
              )}
              <div className={styles.total}><dt>{reducere > 0 ? "De plată" : "Total"}</dt><dd className="price">{formatLei(totalDePlata)}</dd></div>{/* totalul, fără taxe inventate */}
            </dl>
            {probleme.length > 0 && (
              <div ref={problemeRef} tabIndex={-1} className={`titlu-focus ${styles.eroare}`} role={problema?.camp === "cos" ? "alert" : undefined}>
                <CircleAlert size={18} aria-hidden="true" />
                <div>
                  <p>Comanda nu poate fi plasată încă:</p>
                  <ul className={styles.problemeLista}>
                    {mesajeProbleme(probleme).map((m) => <li key={m}>{m}</li>)}
                  </ul>
                </div>
              </div>
            )}
            {problema && problema.camp !== "cos" && <p className={styles.eroare}><CircleAlert size={18} aria-hidden="true" />Verifică datele marcate în formular.</p>}{/* lângă buton: unde e problema */}
            {eroare && <p className={styles.eroare} role="alert"><CircleAlert size={18} aria-hidden="true" />{eroare}</p>}{/* Etapa 7: liniile care n-au ajuns au rămas în coș */}
            <button type="submit" className={`btn-primary ${styles.plaseaza}`} aria-disabled={trimite}>{trimite ? "Se trimite…" : "Plasează comanda"}</button>{/* trimite formularul; aria-disabled cât se trimite */}
          </aside>
        </form>
      )}{/* sfârșitul randării condiționate */}
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
