import { useEffect, useRef, useState } from "react"; // useState: câmpurile și mesajele; useRef: focus; useEffect: focus la deschidere
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react"; // iconițele paginii
import { useMagazin } from "../magazin.js"; // starea comună: profilul (salvat în localStorage de Layout)
import { ADRESE_MAXIME, ADRESA_MAX, ETICHETA_MAX, NUME_MAX, adaugaAdresa, alegeImplicita, editeazaAdresa, salveazaContact, stergeAdresa, valideazaAdresa, valideazaContact } from "../profil.js"; // logica pură a contului
import styles from "./ContPage.module.css"; // stilurile paginii (CSS Modules)

// Fluxul complet: /cont, datele clientului folosite la plasare (nume, telefon, adrese salvate, adresa implicită).
// Nu e un cont real: fără parolă și fără server; totul stă în localStorage, doar în acest browser.
export default function ContPage() { // componenta rutei /cont
  const { profil, setProfil } = useMagazin(); // profilul și funcția care îl schimbă
  const titluRef = useRef(null); // titlul paginii
  const adreseTitluRef = useRef(null); // titlul „Adrese salvate”, primește focus când butonul apăsat dispare
  const [editata, setEditata] = useState(null); // id-ul adresei în editare (null = niciuna)
  const [adaugare, setAdaugare] = useState(false); // formularul de adăugare e deschis?
  const [aviz, setAviz] = useState(""); // confirmarea ultimei acțiuni pe adrese

  // La deschidere, focusul merge pe titlu: cititorul de ecran anunță pagina nouă
  useEffect(() => { // rulează o dată, după prima randare
    titluRef.current?.focus({ preventScroll: true }); // titlul are tabIndex -1
  }, []); // fără dependențe

  function handleSterge(adresa) { // coșul de gunoi de pe o adresă
    adreseTitluRef.current?.focus(); // butonul dispare odată cu rândul
    setProfil((p) => stergeAdresa(p, adresa.id)); // profil nou
    if (editata === adresa.id) setEditata(null); // nu mai edităm o adresă ștearsă
    setAviz(`Adresa „${adresa.eticheta || adresa.text}” a fost ștearsă.`); // confirmarea
  } // sfârșitul funcției

  function handleImplicita(adresa) { // „Folosește implicit”
    adreseTitluRef.current?.focus(); // butonul dispare (adresa devine implicită)
    setProfil((p) => alegeImplicita(p, adresa.id)); // profil nou
    setAviz(`„${adresa.eticheta || adresa.text}” e acum adresa implicită.`); // confirmarea
  } // sfârșitul funcției

  function handleSalvareAdresa(id, valori) { // adăugare (id nou) sau editare (id existent)
    const exista = profil.adrese.some((a) => a.id === id); // editare?
    if (!exista && profil.adrese.some((a) => a.text === valori.text.trim())) { // aceeași adresă e deja salvată
      setAdaugare(false); // închidem adăugarea
      adreseTitluRef.current?.focus(); // formularul dispare
      setAviz("Adresa există deja în listă."); // fără dubluri
      return; // ne oprim
    } // sfârșitul if
    setProfil((p) => (exista ? editeazaAdresa(p, id, valori) : adaugaAdresa(p, valori, id))); // profil nou
    setEditata(null); // închidem editarea
    setAdaugare(false); // și adăugarea
    adreseTitluRef.current?.focus(); // formularul dispare
    setAviz(exista ? "Adresa a fost actualizată." : "Adresa a fost salvată."); // confirmarea
  } // sfârșitul funcției

  function inchideFormular() { // „Renunță”
    setEditata(null); // fără editare
    setAdaugare(false); // fără adăugare
    adreseTitluRef.current?.focus(); // formularul dispare
  } // sfârșitul funcției

  const plin = profil.adrese.length >= ADRESE_MAXIME; // plafonul de adrese

  return ( // JSX-ul paginii
    <div className={`wrap ${styles.pagina}`}>{/* containerul centrat */}
      <h1 className={`titlu-focus ${styles.titlu}`} ref={titluRef} tabIndex={-1}>Contul tău</h1>{/* tabIndex -1: focus doar din cod */}
      <p className={styles.intro}>Datele de aici completează coșul la plasare. Stau doar în acest browser: nu există parolă sau cont pe server.</p>{/* ce este și ce nu este */}

      <div className={styles.grila}>{/* contactul și adresele */}
        <FormularContact profil={profil} onSalveaza={(valori) => setProfil((p) => salveazaContact(p, valori))} />{/* numele și telefonul */}

        <section className={styles.sectiune} aria-labelledby="cont-adrese-titlu">{/* adresele */}
          <h2 id="cont-adrese-titlu" className={`titlu-focus ${styles.sectiuneTitlu}`} ref={adreseTitluRef} tabIndex={-1}>Adrese salvate</h2>{/* titlul secțiunii */}
          <p className={styles.aviz} role="status">{aviz}</p>{/* confirmările; regiunea există mereu */}
          {profil.adrese.length === 0 && !adaugare && ( // nicio adresă
            <div className={styles.gol}>{/* starea goală */}
              <MapPin size={22} aria-hidden="true" />{/* iconiță decorativă */}
              <p>Nu ai nicio adresă salvată. Adaug-o aici sau bifează „Salvează” în coș.</p>{/* ce poate face utilizatorul */}
            </div>
          )}{/* sfârșitul randării condiționate */}
          {profil.adrese.length > 0 && ( // lista de adrese
            <ul className={styles.lista}>{/* o adresă pe rând */}
              {profil.adrese.map((a) => ( // un rând pentru fiecare adresă
                <li key={a.id} className={styles.adresa}>{/* rândul */}
                  {editata === a.id ? ( // adresa e în editare
                    <FormularAdresa initial={a} titlu="Editează adresa" onSalveaza={(valori) => handleSalvareAdresa(a.id, valori)} onRenunta={inchideFormular} />// formularul, pe locul rândului
                  ) : ( // afișarea obișnuită
                    <>{/* textele și acțiunile */}
                      <div className={styles.adresaText}>{/* eticheta și adresa */}
                        <p className={styles.adresaTitlu}>{a.eticheta || a.text}{profil.implicita === a.id && <span className="tag tag-speciala">Implicită</span>}</p>{/* eticheta (sau adresa) și marcajul implicitei */}
                        {a.eticheta && <p className={styles.adresaDetaliu}>{a.text}</p>}{/* adresa, sub etichetă */}
                      </div>
                      <div className={styles.adresaActiuni}>{/* acțiunile */}
                        {profil.implicita !== a.id && <button type="button" className={styles.linkBtn} onClick={() => handleImplicita(a)}>Folosește implicit<span className="sr-only">: {a.eticheta || a.text}</span></button>}{/* alegerea implicitei */}
                        <button type="button" className="btn-close" onClick={() => { setAdaugare(false); setEditata(a.id); }} aria-label={`Editează ${a.eticheta || a.text}`} title="Editează">{/* deschide editarea */}
                          <Pencil size={18} aria-hidden="true" />{/* iconiță decorativă */}
                        </button>
                        <button type="button" className="btn-danger" onClick={() => handleSterge(a)} aria-label={`Șterge ${a.eticheta || a.text}`} title="Șterge adresa">{/* ștergere directă */}
                          <Trash2 size={18} aria-hidden="true" />{/* iconiță decorativă */}
                        </button>
                      </div>
                    </>
                  )}{/* sfârșitul randării condiționate */}
                </li>
              ))}{/* sfârșitul map-ului */}
            </ul>
          )}{/* sfârșitul randării condiționate */}
          {adaugare ? ( // formularul de adăugare
            <FormularAdresa initial={null} titlu="Adresă nouă" onSalveaza={(valori) => handleSalvareAdresa(`a${Date.now().toString(36)}`, valori)} onRenunta={inchideFormular} />// id nou, creat la salvare (în handler)
          ) : plin ? ( // plafonul atins
            <p className={styles.indicatie}>Poți salva cel mult {ADRESE_MAXIME} adrese. Șterge una ca să adaugi alta.</p>// ce poate face utilizatorul
          ) : ( // butonul de adăugare
            <button type="button" className="btn-secondary" onClick={() => { setEditata(null); setAdaugare(true); }}>{/* deschide formularul */}
              <Plus size={18} aria-hidden="true" />{/* iconiță decorativă */}
              Adaugă o adresă{/* textul butonului */}
            </button>
          )}{/* sfârșitul randării condiționate */}
        </section>
      </div>
    </div>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Numele și telefonul: formular controlat, validat cu valideazaContact (aceleași reguli ca în coș)
function FormularContact({ profil, onSalveaza }) { // profilul curent și funcția de salvare
  const [nume, setNume] = useState(profil.nume); // numele din câmp
  const [telefon, setTelefon] = useState(profil.telefon); // telefonul din câmp
  const [problema, setProblema] = useState(null); // { camp, mesaj } sau null
  const [salvat, setSalvat] = useState(""); // confirmarea
  const numeRef = useRef(null); // pentru focus la eroare
  const telefonRef = useRef(null); // la fel

  function handleSubmit(e) { // „Salvează”
    e.preventDefault(); // fără reîncărcarea paginii
    const gresit = valideazaContact({ nume, telefon }); // null sau { camp, mesaj }
    if (gresit) { // date greșite
      setProblema(gresit); // mesajul
      setSalvat(""); // fără confirmare veche
      (gresit.camp === "nume" ? numeRef : telefonRef).current?.focus(); // câmpul de corectat
      return; // ne oprim
    } // sfârșitul if
    setProblema(null); // fără erori
    onSalveaza({ nume, telefon }); // profilul nou
    setSalvat("Datele de contact au fost salvate."); // confirmarea
  } // sfârșitul funcției

  return ( // JSX-ul formularului
    <section className={styles.sectiune} aria-labelledby="cont-contact-titlu">{/* contactul */}
      <h2 id="cont-contact-titlu" className={styles.sectiuneTitlu}>Date de contact</h2>{/* titlul secțiunii */}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>{/* noValidate: mesajele sunt cele din cod */}
        <div className={styles.camp}>{/* numele */}
          <label htmlFor="cont-nume">Nume</label>{/* eticheta */}
          <input id="cont-nume" ref={numeRef} type="text" value={nume} onChange={(e) => setNume(e.target.value)} autoComplete="name" maxLength={NUME_MAX} aria-invalid={problema?.camp === "nume"} aria-describedby={problema?.camp === "nume" ? "cont-eroare" : undefined} />{/* câmp controlat */}
        </div>
        <div className={styles.camp}>{/* telefonul */}
          <label htmlFor="cont-telefon">Telefon</label>{/* eticheta */}
          <input id="cont-telefon" ref={telefonRef} type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} autoComplete="tel" inputMode="tel" maxLength={20} placeholder="0722 123 456" aria-invalid={problema?.camp === "telefon"} aria-describedby={problema?.camp === "telefon" ? "cont-eroare" : undefined} />{/* câmp controlat */}
        </div>
        {problema && <p id="cont-eroare" className={styles.eroare} role="alert">{problema.mesaj}</p>}{/* mesajul de validare */}
        <p className={styles.aviz} role="status">{salvat}</p>{/* confirmarea; regiunea există mereu */}
        <button type="submit" className="btn-primary">Salvează</button>{/* acțiunea principală a formularului */}
      </form>
    </section>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei

// Adăugarea sau editarea unei adrese: eticheta (opțională) și textul, validate cu valideazaAdresa
function FormularAdresa({ initial, titlu, onSalveaza, onRenunta }) { // initial = adresa editată (sau null), funcțiile de salvare și renunțare
  const [eticheta, setEticheta] = useState(initial?.eticheta ?? ""); // eticheta din câmp
  const [text, setText] = useState(initial?.text ?? ""); // adresa din câmp
  const [problema, setProblema] = useState(null); // { camp, mesaj } sau null
  const etichetaRef = useRef(null); // primul câmp: primește focus la deschidere
  const textRef = useRef(null); // câmpul adresei
  const id = initial?.id ?? "noua"; // pentru id-urile câmpurilor (unice pe pagină)

  useEffect(() => { // la deschidere
    etichetaRef.current?.focus(); // utilizatorul poate scrie imediat
  }, []); // o singură dată

  function handleSubmit(e) { // „Salvează adresa”
    e.preventDefault(); // fără reîncărcarea paginii
    const gresit = valideazaAdresa({ eticheta, text }); // null sau { camp, mesaj }
    if (gresit) { // date greșite
      setProblema(gresit); // mesajul
      (gresit.camp === "eticheta" ? etichetaRef : textRef).current?.focus(); // câmpul de corectat
      return; // ne oprim
    } // sfârșitul if
    onSalveaza({ eticheta, text }); // profilul nou (funcțiile pure curăță spațiile)
  } // sfârșitul funcției

  return ( // JSX-ul formularului
    <form className={`${styles.form} ${styles.formAdresa}`} onSubmit={handleSubmit} noValidate aria-label={titlu}>{/* formularul, cu nume accesibil */}
      <div className={styles.camp}>{/* eticheta */}
        <label htmlFor={`adresa-eticheta-${id}`}>Etichetă (opțional)</label>{/* eticheta câmpului */}
        <input id={`adresa-eticheta-${id}`} ref={etichetaRef} type="text" value={eticheta} onChange={(e) => setEticheta(e.target.value)} maxLength={ETICHETA_MAX} placeholder="Acasă, Birou" autoComplete="off" aria-invalid={problema?.camp === "eticheta"} aria-describedby={problema?.camp === "eticheta" ? `adresa-eroare-${id}` : undefined} />{/* câmp controlat */}
      </div>
      <div className={styles.camp}>{/* adresa */}
        <label htmlFor={`adresa-text-${id}`}>Adresa</label>{/* eticheta câmpului */}
        <input id={`adresa-text-${id}`} ref={textRef} type="text" value={text} onChange={(e) => setText(e.target.value)} maxLength={ADRESA_MAX} placeholder="Strada, numărul, blocul, orașul" autoComplete="street-address" aria-invalid={problema?.camp === "text"} aria-describedby={problema?.camp === "text" ? `adresa-eroare-${id}` : undefined} />{/* câmp controlat */}
      </div>
      {problema && <p id={`adresa-eroare-${id}`} className={styles.eroare} role="alert">{problema.mesaj}</p>}{/* mesajul de validare */}
      <div className={styles.butoane}>{/* salvarea și renunțarea */}
        <button type="submit" className="btn-primary">Salvează adresa</button>{/* acțiunea principală */}
        <button type="button" className="btn-secondary" onClick={onRenunta}>Renunță</button>{/* închide formularul */}
      </div>
    </form>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
