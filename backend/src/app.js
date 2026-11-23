// Aplicația Express: middleware-uri, rutele celor cinci resurse, 404 și handler-ul central de erori.
// createApp() face o aplicație cu datele ei (testele pornesc fiecare de la seed); `app` e cea folosită de server.js.
import express from "express";
import cors from "cors";
import { creeazaStore } from "./data/store.js";
import { routerComenzi } from "./routes/comenzi.js";
import { routerMeniu } from "./routes/meniu.js";
import { routerLivratori } from "./routes/livratori.js";
import { routerRecenzii } from "./routes/recenzii.js";
import { routerRestaurante } from "./routes/restaurante.js";

export function createApp({ store = creeazaStore() } = {}) {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/comenzi", routerComenzi(store));
  app.use("/meniu", routerMeniu(store));
  app.use("/livratori", routerLivratori(store));
  app.use("/recenzii", routerRecenzii(store));
  app.use("/restaurante", routerRestaurante(store));

  app.use((req, res) => {
    res.status(404).json({ error: "Ruta nu există" });
  });

  // Express recunoaște handler-ul de erori după cei 4 parametri, deci `next` rămâne chiar dacă nu e folosit.
  // express.json() marchează JSON-ul stricat cu type „entity.parse.failed” (status 400, mesaj în engleză).
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Corpul cererii nu este JSON valid" });
    if (err.type === "entity.too.large") return res.status(413).json({ error: "Corpul cererii este prea mare" });
    const status = err.status || 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: status === 500 ? "Eroare internă" : err.message });
  });

  return app;
}

const app = createApp();
export default app;
