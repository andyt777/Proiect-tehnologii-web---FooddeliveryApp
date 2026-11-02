import { StrictMode } from "react"; // StrictMode: mod de dezvoltare care semnalează probleme (ex. efecte rulate de două ori)
import { createRoot } from "react-dom/client"; // createRoot: API-ul React 18+ care leagă React de DOM-ul real
import App from "./App.jsx"; // componenta principală a aplicației
import "./App.css"; // stilurile globale; Vite le injectează în pagină

createRoot(document.getElementById("root")).render( // găsim <div id="root"> din index.html și randăm aplicația în el
  <StrictMode>{/* învelim totul în StrictMode (doar verificări, nu apare nimic pe ecran) */}
    <App />{/* aici pornește tot UI-ul */}
  </StrictMode>
); // închide apelul render()
