import { StrictMode } from "react"; // StrictMode: mod de dezvoltare care semnalează probleme (ex. efecte rulate de două ori)
import { createRoot } from "react-dom/client"; // createRoot: API-ul React 18+ care leagă React de DOM-ul real
import { BrowserRouter } from "react-router-dom"; // Etapa 8: rutele citesc adresa din bara browserului (History API)
import "./index.css"; // Etapa 8: stilurile globale (fostul App.css); importate primele, ca modulele componentelor să vină după ele și să le poată suprascrie
import App from "./App.jsx"; // componenta principală a aplicației (harta rutelor)

createRoot(document.getElementById("root")).render( // găsim <div id="root"> din index.html și randăm aplicația în el
  <StrictMode>{/* învelim totul în StrictMode (doar verificări, nu apare nimic pe ecran) */}
    <BrowserRouter>{/* Etapa 8: fără el, useParams, Link și NavLink nu funcționează */}
      <App />{/* aici pornește tot UI-ul */}
    </BrowserRouter>
  </StrictMode>
); // închide apelul render()
