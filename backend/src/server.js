// Pornește serverul. Toată logica e în app.js, ca testele să poată porni aplicația pe un port liber.
import app from "./app.js";

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Savoro API pe http://localhost:${PORT}`);
});
