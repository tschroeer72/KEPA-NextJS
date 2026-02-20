/**
 * Utility-Funktionen zur einheitlichen Datumsbehandlung (UTC für DB, Local für UI).
 */

/**
 * Wandelt ein lokales Datum (z.B. 16.02.2026 00:00:00 local) 
 * in ein UTC-Datum mit derselben Datumsangabe (16.02.2026 00:00:00 UTC) um.
 * Dies wird zum Speichern in der Datenbank verwendet, damit der Server (z.B. Vercel)
 * unabhängig von seiner Zeitzone den gleichen Kalendertag erkennt.
 */
export function toUTCDate(date: Date | string | number): Date {
  const d = new Date(date);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
}

/**
 * Wandelt ein UTC-Datum (z.B. 16.02.2026 00:00:00 UTC) 
 * in ein lokales Datum mit derselben Datumsangabe (16.02.2026 00:00:00 local) um.
 * Wird für die Anzeige in UI-Komponenten (z.B. Kalender) verwendet.
 */
export function fromUTCDate(date: Date | string | number): Date {
  const d = new Date(date);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0);
}

/**
 * Formatiert ein Datum für die Anzeige als lokales Datum.
 */
export function formatLocalDate(date: Date | string | number): string {
  const d = new Date(date);
  return d.toLocaleDateString("de-DE");
}
