/**
 * Utility-Funktionen zur einheitlichen Datumsbehandlung.
 * Da die Datenbank nun DATE-Felder verwendet, sind UTC-Konvertierungen für reine Datumsfelder überflüssig.
 */

/**
 * Stellt sicher, dass das übergebene Datum ein valides Date-Objekt ist.
 * @param date Das Datum
 */
export function toUTCDate(date: Date | string | number | null | undefined): Date | null {
  if (date === null || date === undefined || date === "") return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  // Wir erstellen ein neues Date-Objekt, das die gleichen J/M/T Werte in UTC hat
  // Dies verhindert, dass Zeitzonenverschiebungen (z.B. UTC+1) das Datum auf den Vortag schieben,
  // wenn Prisma/MySQL das Datum als UTC interpretiert.
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
}

/**
 * Gibt das Datum direkt zurück, da DATE-Felder bereits lokal interpretiert werden.
 * @param date Das Datum
 */
export function fromUTCDate(date: Date | string | number | null | undefined): Date | null {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;

  // Wenn das Datum aus der DB kommt (als UTC 00:00:00), konvertieren wir es 
  // zurück in ein lokales Datum mit 00:00:00 Uhrzeit.
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
}

/**
 * Formatiert ein Datum für die Anzeige als lokales Datum.
 */
export function formatLocalDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("de-DE");
}
