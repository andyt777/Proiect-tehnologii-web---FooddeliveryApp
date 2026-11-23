// Parsarea id-urilor din adresă. Fiecare router își alege parserul; un id invalid dă 400, nu 404.
import { cerereGresita } from "./erori.js";

const FORMAT_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FORMAT_ID_TEXT = /^[A-Za-z0-9_-]{1,40}$/;

// „7” -> 7; „abc”, „0”, „-1”, „1.5”, „007” -> 400
export function parseId(text) {
  if (!/^[1-9]\d{0,15}$/.test(text)) throw cerereGresita("Id invalid: trebuie să fie un număr întreg pozitiv");
  return Number(text);
}

// Id-urile de text ale meniului („p1”)
export function parseIdText(text) {
  if (!FORMAT_ID_TEXT.test(text)) throw cerereGresita("Id invalid: doar litere, cifre, „-” și „_”");
  return text;
}

// Slug-ul unui restaurant („pizzeria-napoli”)
export function parseSlug(text) {
  if (typeof text !== "string" || text.length > 60 || !FORMAT_SLUG.test(text)) throw cerereGresita("Id invalid: slug-ul are doar litere mici, cifre și „-”");
  return text;
}
