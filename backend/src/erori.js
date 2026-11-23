// O eroare cu cod HTTP: handler-ul central din app.js trimite { error: mesaj } cu acest status.
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function cerereGresita(message) {
  return new HttpError(400, message);
}

export function negasit(message) {
  return new HttpError(404, message);
}

export function conflict(message) {
  return new HttpError(409, message);
}
