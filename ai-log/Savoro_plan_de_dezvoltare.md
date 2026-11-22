# Savoro --- Propunere de dezvoltare și integrare în arhitectură

**Tip proiect:** dezvoltare incrementală a unei aplicații existente de
food delivery\
**Context:** proiect universitar realizat pe etape, cu integrarea
succesivă a unor componente într-o arhitectură nouă\
**Direcție propusă:** păstrăm aplicația Savoro și interfața actuală;
adăugăm funcționalități reale, organizate modular, astfel încât fiecare
etapă academică să poată introduce și demonstra o componentă nouă.

------------------------------------------------------------------------

## 1. Viziunea proiectului

Savoro va evolua dintr-un prototip de food delivery într-o platformă
demonstrabilă, cu patru tipuri principale de utilizatori:

1.  **Client** --- descoperă restaurante, comandă, plătește și urmărește
    livrarea.
2.  **Restaurant** --- gestionează meniul, comenzile și timpul de
    preparare.
3.  **Livrator Savoro** --- primește curse, actualizează statusul și
    transmite poziția în timpul livrării.
4.  **Administrator / operator** --- monitorizează comenzile,
    restaurantele, livratorii și indicatorii operaționali.

Aplicația va fi dezvoltată incremental. Nu încercăm să construim toate
funcționalitățile simultan. Fiecare etapă trebuie să adauge o capacitate
clară, să aibă o justificare arhitecturală și să poată fi testată
separat.

## 2. Principii și decizii de produs

Acestea sunt ipotezele de lucru propuse, nu decizii tehnice
ireversibile:

-   **Piață inițială:** București.
-   **Model de livrare:** flotă proprie Savoro.
-   **Relația cu livratorii:** angajați Savoro.
-   **Monetizare principală:** comision per comandă de la restaurante.
-   **Experiența existentă:** păstrăm identitatea vizuală și fluxurile
    deja implementate; nu facem redesign doar de dragul schimbării.
-   **Arhitectură:** modulară și extensibilă, cu separarea
    responsabilităților între domenii.
-   **Prioritate:** întâi un flux complet de comandă și livrare care
    funcționează, apoi funcționalități avansate precum AI și loyalty.

## 3. Ce construim

### 3.1. Funcționalități pentru client

**Prioritate ridicată** - Înregistrare, autentificare și profil. -
Adrese salvate și date de contact. - Coș persistent și plasarea
comenzii. - Plată online printr-un furnizor de plăți, în mod sandbox
pentru demonstrație. - Istoric comenzi și detalii pentru fiecare
comandă. - Statusuri clare: plasată, acceptată, în preparare, preluată,
în livrare, livrată sau anulată. - Notificări privind schimbarea
statusului.

**Prioritate ulterioară** - Review și rating pentru restaurante și
comenzi. - Cupoane și promoții. - Puncte de loialitate. - Programarea
unei comenzi. - Comenzi de grup. - Recomandări personalizate.

### 3.2. Funcționalități pentru restaurante

-   Cont și autentificare restaurant.
-   Profil restaurant și program de funcționare.
-   Administrarea meniului: categorii, produse, prețuri, disponibilitate
    și imagini.
-   Primirea comenzilor noi.
-   Acceptarea sau respingerea comenzilor.
-   Estimarea timpului de preparare.
-   Actualizarea statusului comenzii.
-   Vizualizarea istoricului și a unor indicatori de bază.

### 3.3. Aplicația livratorului

Aceasta este o componentă importantă deoarece Savoro își gestionează
propria flotă.

-   Autentificare livrator.
-   Trecere online/offline.
-   Primirea unei propuneri de livrare.
-   Acceptarea sau refuzarea cursei.
-   Afișarea punctului de ridicare și a adresei de livrare.
-   Actualizarea etapelor: spre restaurant, comandă preluată, spre
    client, livrată.
-   Transmiterea poziției GPS în timpul unei curse active.
-   Confirmarea livrării.
-   Istoric curse și indicatori simpli de performanță.

Pentru un proiect universitar, GPS-ul poate fi simulat inițial.
Integrarea cu poziția reală a telefonului poate fi făcută într-o etapă
separată.

### 3.4. Dashboard de administrare și operațiuni

-   Vizualizarea tuturor comenzilor și a statusurilor.
-   Gestionarea clienților, restaurantelor și livratorilor.
-   Alocarea manuală a unui livrator.
-   Monitorizarea comenzilor întârziate.
-   Vizualizarea indicatorilor: comenzi, valoarea comenzilor, timp mediu
    de preparare și timp mediu de livrare.
-   Jurnal de evenimente pentru acțiunile importante.

### 3.5. Funcționalități inteligente --- după stabilizarea fluxului de bază

-   Recomandări de restaurante și produse.
-   Oferte personalizate în funcție de comportamentul clientului.
-   Estimarea timpului de livrare.
-   Asistență conversațională pentru întrebări despre comenzi.
-   Prognoza cererii pentru restaurante și operațiuni.

AI-ul nu trebuie introdus doar ca element decorativ. Fiecare funcție AI
trebuie să aibă o problemă concretă, date de intrare, un rezultat
măsurabil și o variantă de rezervă dacă serviciul AI nu este disponibil.

------------------------------------------------------------------------

## 4. Arhitectura-țintă propusă

Propunerea inițială este un **modular monolith**: o singură aplicație
backend la nivel de deploy, dar împărțită intern în module cu
responsabilități și interfețe clare. Este mai ușor de dezvoltat, testat
și prezentat într-un proiect universitar decât o arhitectură cu multe
microservicii pornite prematur.

Arhitectura poate evolua ulterior: un modul poate fi extras ca serviciu
separat dacă există un motiv justificat.

### 4.1. Tehnologii propuse

  -----------------------------------------------------------------------
  Zonă                    Tehnologie propusă      Rol
  ----------------------- ----------------------- -----------------------
  Frontend web            React                   Interfața clientului și
                                                  dashboard-uri

  Backend                 Java 21 + Spring Boot   API și logica
                                                  aplicației

  Bază de date            PostgreSQL              Date persistente

  Cache / date temporare  Redis                   Cache, sesiuni sau date
                                                  temporare, dacă sunt
                                                  necesare

  Comunicare live         WebSocket / SSE         Actualizări de status
                                                  și tracking

  Geolocalizare           PostGIS + serviciu de   Coordonate și distanțe
                          hărți                   

  Autentificare           Spring Security         Autorizare și
                                                  protejarea
                                                  endpoint-urilor

  Testare                 JUnit + teste API +     Teste backend și
                          Playwright              fluxuri UI

  Livrare aplicație       Docker                  Mediu reproductibil de
                                                  rulare
  -----------------------------------------------------------------------

Tehnologiile sunt o propunere. Înainte de implementare trebuie comparate
cu cerințele exacte ale disciplinei și cu arhitectura impusă la
facultate.

### 4.2. Module backend

1.  **Identity & Access** --- utilizatori, roluri, autentificare și
    autorizare.
2.  **Restaurant** --- restaurante, program și profiluri.
3.  **Catalog** --- categorii, produse, prețuri și disponibilitate.
4.  **Cart** --- coș și validarea produselor.
5.  **Order Management** --- plasarea și ciclul de viață al comenzilor.
6.  **Payment** --- inițiere, confirmare, rambursare și evidența
    plăților.
7.  **Delivery & Dispatch** --- curse și alocarea livratorilor.
8.  **Tracking** --- poziție și actualizări de livrare.
9.  **Notification** --- notificări în aplicație și, ulterior, push.
10. **Reviews & Loyalty** --- evaluări și puncte.
11. **Recommendation** --- recomandări și personalizare.
12. **Analytics** --- indicatori operaționali și rapoarte.

Modulele nu trebuie să acceseze arbitrar tabelele sau clasele interne
ale altor module. Comunicarea se face prin interfețe/API-uri interne și
evenimente de domeniu acolo unde are sens.

### 4.3. Separarea responsabilităților

-   Frontend-ul nu decide dacă o comandă este validă; backend-ul
    verifică regulile.
-   Modulul Order Management coordonează comanda, dar nu trebuie să
    conțină logica internă a plăților sau a alocării livratorilor.
-   Modulul Payment gestionează starea plății.
-   Modulul Delivery gestionează cursa și livratorul.
-   Administratorul poate interveni prin acțiuni autorizate, care sunt
    înregistrate.
-   Datele sensibile și locația livratorilor sunt accesibile numai în
    scopul operațional justificat.

------------------------------------------------------------------------

## 5. Fluxul principal care trebuie să funcționeze

Acesta este firul roșu al proiectului. Celelalte funcționalități se
construiesc în jurul lui.

1.  Clientul își selectează adresa și restaurantul.
2.  Adaugă produse în coș.
3.  Backend-ul validează disponibilitatea, prețurile și regulile
    comenzii.
4.  Clientul confirmă comanda și metoda de plată.
5.  Modulul Payment procesează plata sau înregistrează plata simulată.
6.  Restaurantul primește comanda și o acceptă.
7.  Restaurantul comunică timpul estimat de preparare.
8.  Modulul Dispatch caută un livrator disponibil.
9.  Livratorul acceptă cursa.
10. Restaurantul marchează comanda ca pregătită.
11. Livratorul confirmă preluarea.
12. Clientul vede actualizările de livrare.
13. Livratorul confirmă predarea.
14. Comanda este închisă, iar sistemul păstrează istoricul.

**Important:** starea comenzii, starea plății și starea livrării sunt
trei lucruri distincte. Nu le combinăm într-un singur câmp `status`.

------------------------------------------------------------------------

## 6. Etapele de implementare propuse

Etapele de mai jos sunt o ordine recomandată de lucru. Le vom adapta la
cerințele și calendarul facultății. Fiecare etapă trebuie să poată fi
prezentată separat.

### Etapa 0 --- Analiza aplicației existente și cerințele facultății

**Obiectiv:** înțelegem ce există înainte să schimbăm arhitectura.

Activități: - inventarierea paginilor și funcționalităților actuale; -
identificarea componentelor frontend și a datelor folosite; -
verificarea backend-ului existent, dacă există; - identificarea
funcționalităților care sunt doar demonstrative; - colectarea cerințelor
exacte pentru arhitectura nouă; - stabilirea diagramei arhitecturii
inițiale și a limitărilor ei.

**Livrabile:** document de analiză, diagramă „as-is", listă de cerințe
și backlog prioritizat.

### Etapa 1 --- Fundația arhitecturală

**Obiectiv:** pregătim structura în care vor fi integrate etapele
următoare.

Activități: - inițializarea backend-ului; - configurarea bazei de
date; - definirea modulelor și a regulilor de dependență; - stabilirea
convențiilor API și a formatului erorilor; - configurarea migrațiilor
bazei de date; - configurarea testelor și a mediului Docker; -
integrarea frontend--backend.

**Livrabile:** aplicație pornibilă, structură modulară, documentație API
și teste de bază.

### Etapa 2 --- Utilizatori și restaurante

**Obiectiv:** introducem date reale și roluri diferite.

Activități: - autentificare și autorizare; - roluri client, restaurant,
livrator și administrator; - profiluri și adrese; - administrarea
restaurantelor; - administrarea meniului și disponibilității produselor.

**Livrabile:** utilizatori autentificați și restaurante care își pot
gestiona meniul.

### Etapa 3 --- Comenzi și plăți

**Obiectiv:** construim un proces complet de comandă.

Activități: - coș persistent; - validarea prețurilor și disponibilității
pe server; - creare și anulare comandă; - tranziții controlate între
statusuri; - integrarea plății în sandbox sau simularea documentată a
acesteia; - tratarea erorilor și a comenzilor duplicate.

**Livrabile:** clientul poate plasa o comandă, restaurantul o poate
accepta, iar plata are o stare verificabilă.

### Etapa 4 --- Livrare proprie și tracking

**Obiectiv:** implementăm diferențiatorul operațional al Savoro:
propriii livratori.

Activități: - profil și disponibilitate livrator; - creare cursă; -
alocare manuală, apoi reguli simple automate; - acceptarea cursei; -
actualizarea statusurilor; - simulare GPS și tracking live; -
confirmarea livrării.

**Livrabile:** un flux complet de la restaurant la client, cu livrator
alocat și status vizibil.

### Etapa 5 --- Dashboard-uri și operațiuni

**Obiectiv:** facem platforma administrabilă.

Activități: - dashboard restaurant; - dashboard livrator; - dashboard
administrator; - monitorizarea comenzilor și întârzierilor; - indicatori
operaționali; - jurnal de evenimente și intervenții manuale.

**Livrabile:** fiecare rol are interfața și permisiunile potrivite.

### Etapa 6 --- Funcționalități de retenție și experiență

**Obiectiv:** creștem utilitatea produsului după ce fluxul de bază este
stabil.

Activități: - review-uri și ratinguri; - cupoane și promoții; - loyalty
points; - notificări; - programarea comenzilor; - comenzi de grup.

**Livrabile:** funcționalități care încurajează utilizarea repetată și
pot fi demonstrate independent.

### Etapa 7 --- AI și optimizare

**Obiectiv:** adăugăm inteligență acolo unde există date și valoare
măsurabilă.

Ordinea recomandată: 1. recomandări simple bazate pe reguli și istoricul
comenzilor; 2. estimarea timpului de livrare; 3. recomandări
personalizate; 4. prognoza cererii; 5. asistent conversațional pentru
suport.

**Livrabile:** cel puțin o funcționalitate AI evaluată printr-un set de
scenarii și indicatori, nu doar un demo vizual.

### Etapa 8 --- Stabilizare și prezentare

**Obiectiv:** demonstrăm că sistemul este coerent și robust.

Activități: - teste unitare, integrare și end-to-end; - teste pentru
permisiuni și acces la date; - scenarii de erori: plată eșuată,
restaurant indisponibil, lipsă livrator, anulare; - verificarea
performanței pentru scenariile proiectului; - documentarea arhitecturii
și a deciziilor; - pregătirea demonstrației.

**Livrabile:** versiune demonstrabilă, documentație tehnică, diagrame și
scenariu de prezentare.

------------------------------------------------------------------------

## 7. Ce nu construim de la început

Pentru a evita extinderea necontrolată a proiectului, amânăm:

-   microservicii separate pentru fiecare modul;
-   algoritmi AI complecși înainte să existe date;
-   optimizare avansată a rutelor;
-   aplicații native iOS și Android, dacă o aplicație web responsive
    este suficientă pentru demonstrație;
-   integrare cu flote sau servicii externe de livrare;
-   sistem financiar complet de companie.

Acestea pot deveni direcții ulterioare, dar nu sunt condiții pentru un
MVP universitar solid.

## 8. Criterii de succes

Proiectul va fi considerat funcțional când putem demonstra următoarele:

-   un client se autentifică și plasează o comandă;
-   restaurantul primește și acceptă comanda;
-   sistemul alocă un livrator;
-   livratorul actualizează cursa;
-   clientul vede statusul actualizat;
-   comanda se finalizează și rămâne în istoric;
-   fiecare rol poate accesa doar funcțiile și datele permise;
-   erorile importante sunt tratate și testate;
-   modulele sunt suficient de independente încât să poată fi explicate
    și extinse.

Indicatori suplimentari pentru demonstrație: - timpul dintre plasarea și
acceptarea comenzii; - timpul de preparare; - timpul de la preluare la
livrare; - rata comenzilor finalizate; - rata comenzilor anulate; -
numărul comenzilor gestionate per livrator într-un interval de timp.

## 9. Riscuri și măsuri de control

  -----------------------------------------------------------------------
  Risc                                Măsură propusă
  ----------------------------------- -----------------------------------
  Prea multe funcționalități pentru   MVP și prioritizare pe etape
  timpul disponibil                   

  Arhitectură prea complexă           Modular monolith inițial

  Date inconsistente între module     reguli clare de ownership și
                                      API-uri interne

  Plăți reale greu de integrat        sandbox sau simulare documentată

  GPS dificil de demonstrat           simulator de poziție înainte de GPS
                                      real

  AI fără date suficiente             începem cu reguli și seturi de date
                                      controlate

  Modificări care strică interfața    teste de regresie și păstrarea
  actuală                             fluxurilor existente
  -----------------------------------------------------------------------

## 10. Cum vom lucra împreună

Pentru fiecare etapă vom urma același proces:

1.  **Clarificăm cerința academică** --- ce trebuie integrat și ce
    trebuie demonstrat.
2.  **Analizăm arhitectura existentă** --- identificăm exact unde se
    face integrarea.
3.  **Proiectăm înainte să codăm** --- diagramă, responsabilități, date
    și interfețe.
4.  **Împărțim etapa în taskuri mici** --- implementare frontend,
    backend, bază de date și testare.
5.  **Implementăm incremental** --- fără să rescriem inutil ce
    funcționează.
6.  **Testăm și documentăm** --- fiecare etapă trebuie să aibă dovezi că
    funcționează.
7.  **Pregătim prezentarea** --- explicăm ce problemă rezolvă componenta
    și de ce a fost integrată astfel.

Nu vom genera prompturi de implementare și nu vom alege tehnologii
finale înainte să vedem cerințele etapei și arhitectura impusă de
facultate.

------------------------------------------------------------------------

## 11. Decizii care trebuie confirmate înainte de implementare

1.  Care este arhitectura nouă cerută la facultate și ce concepte
    trebuie integrate?
2.  Ce tehnologii sunt obligatorii sau deja folosite?
3.  Ce livrabile se cer la fiecare etapă: cod, diagrame, documentație,
    teste, prezentare?
4.  Ce părți din Savoro sunt deja funcționale și ce părți sunt doar
    interfață demonstrativă?
5.  Care este calendarul și cât timp avem pentru fiecare etapă?

## 12. Propunerea mea finală

Aș construi Savoro în jurul unui singur scenariu demonstrabil:
**clientul comandă de la un restaurant, restaurantul acceptă, un
livrator Savoro preia comanda, iar clientul urmărește livrarea până la
final**.

Acest scenariu oferă o bază solidă pentru integrarea ulterioară a
autentificării, plăților, notificărilor, tracking-ului, dashboard-urilor
și AI-ului. În același timp, fiecare componentă poate fi introdusă și
evaluată separat, conform etapelor de la facultate.

**Următorul pas:** înainte de a începe Etapa 0, trebuie să comparăm
acest plan cu cerințele oficiale ale proiectului și cu arhitectura nouă
pe care trebuie să o integrați. Planul de mai sus este propunerea de
produs și dezvoltare, nu o presupunere despre cerințele profesorului.
