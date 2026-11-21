import { Route, Routes } from "react-router-dom"; // Etapa 8: harta rutelor, cu React Router
import Layout from "./components/Layout.jsx"; // antetul, navigația, subsolul și starea comună tuturor paginilor
import ComenziPage from "./pages/ComenziPage.jsx"; // „/”: hero, categorii, restaurante, meniu și comenzile
import RestaurantPage from "./pages/RestaurantPage.jsx"; // redesign: „/restaurante/:slug”, un restaurant și preparatele lui
import CosPage from "./pages/CosPage.jsx"; // redesign: „/cos”, coșul și plasarea comenzii
import FavoritePage from "./pages/FavoritePage.jsx"; // redesign: „/favorite”, preparatele salvate
import ComandaDetaliuPage from "./pages/ComandaDetaliuPage.jsx"; // „/comenzi/:id”: o singură comandă
import DesprePage from "./pages/DesprePage.jsx"; // „/despre”: pagina de prezentare
import NotFoundPage from "./pages/NotFoundPage.jsx"; // orice altă adresă: pagina 404

// Etapa 8: App conține doar harta rutelor. Layout înconjoară fiecare pagină; pagina se desenează în locul <Outlet /> din Layout.
// Ruta de detaliu folosește exact numele resursei din tw.json („comenzi”): /comenzi/:id.
export default function App() { // componenta principală
  return ( // JSX-ul rutelor
    <Routes>{/* alege prima rută potrivită adresei curente */}
      <Route element={<Layout />}>{/* ruta fără path: doar layout-ul comun */}
        <Route path="/" element={<ComenziPage />} />{/* pagina principală */}
        <Route path="/restaurante/:slug" element={<RestaurantPage />} />{/* :slug, ex. „sushi-kyo”; unul necunoscut arată 404 */}
        <Route path="/cos" element={<CosPage />} />{/* coșul */}
        <Route path="/favorite" element={<FavoritePage />} />{/* favoritele */}
        <Route path="/comenzi/:id" element={<ComandaDetaliuPage />} />{/* :id e un parametru; useParams() îl întoarce ca text */}
        <Route path="/despre" element={<DesprePage />} />{/* pagina de prezentare */}
        <Route path="*" element={<NotFoundPage />} />{/* * prinde orice adresă care nu s-a potrivit mai sus */}
      </Route>
    </Routes>
  ); // sfârșitul JSX-ului
} // sfârșitul componentei
