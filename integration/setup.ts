// Läuft in jedem Test-Worker. Prisma/DB bleiben ECHT – nur Next-interne Request-Kontexte
// (headers(), revalidatePath) existieren außerhalb eines Requests nicht und werden ersetzt.
import { buildEnv } from "./env.cjs";

Object.assign(process.env, buildEnv());

const mockHeaders = new Map<string, string>([
  ["user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Integrationstest"],
  ["x-forwarded-for", "10.0.0.1"],
]);

jest.mock("next/headers", () => ({
  headers: async () => mockHeaders,
  cookies: async () => new Map(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.setTimeout(30000);

// Die Actions fangen erwartete Fehler (FK-Verletzung, Rollback ...) ab und loggen sie per console.error.
// Diese erwarteten Meldungen blenden wir aus, alles andere bleibt sichtbar.
// Gleiches gilt für die Debug-Ausgaben (console.log/warn) in den Mitglieder-Actions.
const originalError = console.error;
const originalLog = console.log;
const originalWarn = console.warn;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const first = String(args[0] ?? "");
    if (/^(Database error|Save error|Delete error|getStatistik|Fehler beim|Changelog error)/.test(first)) return;
    originalError(...args);
  };
  console.log = (...args: unknown[]) => {
    if (/^(getMitgliedById aufgerufen|Mitglied erfolgreich serialisiert)/.test(String(args[0] ?? ""))) return;
    originalLog(...args);
  };
  console.warn = (...args: unknown[]) => {
    if (/^Mitglied nicht gefunden/.test(String(args[0] ?? ""))) return;
    originalWarn(...args);
  };
});
afterAll(() => {
  console.error = originalError;
  console.log = originalLog;
  console.warn = originalWarn;
});

// Offene DB-Verbindungen würden Jest sonst am Beenden hindern
afterAll(async () => {
  const { prisma } = await import("@/lib/prisma");
  await prisma.$disconnect();
});
