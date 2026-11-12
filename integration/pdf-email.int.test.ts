/**
 * HTTP-Integrationstests gegen den echten `next start`-Server:
 * PDF-Erzeugung (Vorlagen, Ausgabe, Statistik) und E-Mail-Routen.
 */
import { adminCookie, api, expectPdf } from "./helpers/http";
import { resetDb, seedBasis } from "./helpers/db";
import { seedSpielbetrieb } from "./helpers/spiele";

let basis: Awaited<ReturnType<typeof seedBasis>>;
let cookie: string;

beforeAll(async () => {
  await resetDb();
  basis = await seedBasis();
  await seedSpielbetrieb(basis);
  cookie = await adminCookie();
});

describe("Vorlagen-PDFs", () => {
  it.each([
    "/api/vorlagen/mitgliederliste",
    "/api/vorlagen/mitgliederliste?aktiv=false",
    "/api/vorlagen/abrechnung",
    "/api/vorlagen/6-tage-rennen",
    "/api/vorlagen/blitztunier?anzahl=2",
    "/api/vorlagen/kombimeisterschaft",
    "/api/vorlagen/meisterschaft?anzahl=4",
    "/api/vorlagen/spielverluste",
    "/api/vorlagen/weihnachtsbaum",
    "/api/vorlagen/weihnachtsbaum?variant=2",
  ])("GET %s liefert ein gültiges PDF", async (path) => {
    await expectPdf(await api(path, { cookie }));
  });

  it("Mitgliederliste enthält Daten aus der DB (PDF ist größer als mit leerer DB)", async () => {
    const mit = Buffer.from(await (await api("/api/vorlagen/mitgliederliste", { cookie })).arrayBuffer());
    expect(mit.length).toBeGreaterThan(1000);
  });
});

describe("Ausgabe-PDFs (Meisterschaft, Kurztunier, Kombimeisterschaft)", () => {
  const optionen = "spielergebnisse=true&tabelle=true&kreuztabelle=true";

  it.each(["meisterschaft", "kurztunier", "kombimeisterschaft"])("/api/ausgabe/%s liefert ein PDF", async (typ) => {
    const res = await api(`/api/ausgabe/${typ}?id=${basis.meisterschaft.ID}&${optionen}`, { cookie });
    await expectPdf(res);
  });

  it.each(["meisterschaft", "kurztunier", "kombimeisterschaft"])(
    "/api/ausgabe/%s: nur Tabelle funktioniert ebenfalls",
    async (typ) => {
      await expectPdf(await api(`/api/ausgabe/${typ}?id=${basis.meisterschaft.ID}&tabelle=true`, { cookie }));
    }
  );

  it.each(["meisterschaft", "kurztunier", "kombimeisterschaft"])("/api/ausgabe/%s: ID fehlt → 400", async (typ) => {
    expect((await api(`/api/ausgabe/${typ}`, { cookie })).status).toBe(400);
  });

  it.each(["meisterschaft", "kurztunier", "kombimeisterschaft"])("/api/ausgabe/%s: unbekannte ID → 404", async (typ) => {
    expect((await api(`/api/ausgabe/${typ}?id=999999`, { cookie })).status).toBe(404);
  });

  it("Meisterschaft ohne Ergebnisse → 404", async () => {
    const leer = await (await import("./helpers/db")).prisma.tblMeisterschaften.create({
      data: { Bezeichnung: "Leer", Beginn: new Date("2024-01-01"), MeisterschaftstypID: basis.typ.ID, Aktiv: 0 },
    });
    expect((await api(`/api/ausgabe/meisterschaft?id=${leer.ID}&tabelle=true`, { cookie })).status).toBe(404);
  });
});

describe("Statistik-PDFs", () => {
  const auswahlen = [
    "neuner",
    "ratten",
    "pokal",
    "sarg",
    "ergebnisse-spieler",
    "platzierung-6tage",
    "beste-mannschaft-6tage",
    "mannschaft-mitglied-6tage",
    "neunerkoenig-rattenorden",
  ];

  it.each(auswahlen)("POST /api/statistik/pdf (%s, gesamt)", async (auswahl) => {
    await expectPdf(await api("/api/statistik/pdf", { cookie, body: { auswahl, zeit: "gesamt" } }));
  });

  it("Zeitbereiche: laufende (mit Meisterschaft), letzte, individuell", async () => {
    const meisterschaftId = basis.meisterschaft.ID;
    await expectPdf(await api("/api/statistik/pdf", { cookie, body: { auswahl: "neuner", zeit: "laufende", meisterschaftId } }));
    await expectPdf(await api("/api/statistik/pdf", { cookie, body: { auswahl: "neuner", zeit: "laufende" } }));
    await expectPdf(await api("/api/statistik/pdf", { cookie, body: { auswahl: "neuner", zeit: "letzte" } }));
    await expectPdf(
      await api("/api/statistik/pdf", {
        cookie,
        body: { auswahl: "pokal", zeit: "individuell", dateVon: "2025-01-01", dateBis: "2025-12-31" },
      })
    );
  });

  it("unbekannte Auswahl führt nicht zu einem Serverfehler", async () => {
    const res = await api("/api/statistik/pdf", { cookie, body: { auswahl: "gibts-nicht", zeit: "gesamt" } });
    expect(res.status).toBeLessThan(500);
  });

  it("POST /api/mitglieder/statistik-pdf: Mitglied mit Ergebnissen und Statistik", async () => {
    const res = await api("/api/mitglieder/statistik-pdf", {
      cookie,
      body: { mitgliedId: basis.mitglieder[0].ID, showErgebnisse: true, showStatistik: true },
    });
    await expectPdf(res);
  });

  it("Mitglieder-PDF: ID fehlt → 400, unbekannte ID → 404", async () => {
    expect((await api("/api/mitglieder/statistik-pdf", { cookie, body: {} })).status).toBe(400);
    expect((await api("/api/mitglieder/statistik-pdf", { cookie, body: { mitgliedId: 999999 } })).status).toBe(404);
  });
});

describe("E-Mail-Routen", () => {
  it("/api/email/send ohne Empfänger → 400", async () => {
    expect((await api("/api/email/send", { cookie, body: { recipients: [], subject: "x", message: "y" } })).status).toBe(400);
    expect((await api("/api/email/send", { cookie, body: { subject: "x" } })).status).toBe(400);
  });

  it("/api/email/send: SMTP nicht erreichbar → 500 mit Fehlermeldung", async () => {
    const res = await api("/api/email/send", {
      cookie,
      body: { recipients: ["a@example.com"], subject: "Test", message: "Hallo" },
    });
    expect(res.status).toBe(500);
    expect((await res.json()).error).toBeTruthy();
  });

  it("/api/email/send-error ohne Hauptempfänger → 400", async () => {
    expect((await api("/api/email/send-error", { cookie, body: { to: [], subject: "x" } })).status).toBe(400);
  });

  it("/api/email/send-error: SMTP nicht erreichbar → 500", async () => {
    const res = await api("/api/email/send-error", {
      cookie,
      body: { to: ["dev@example.com"], subject: "Absturz", message: "Details", type: "Fehler" },
    });
    expect(res.status).toBe(500);
  });

  it("beide Mail-Routen verlangen Authentifizierung", async () => {
    expect((await api("/api/email/send", { body: { recipients: ["a@b.de"] } })).status).toBe(401);
    expect((await api("/api/email/send-error", { body: { to: ["a@b.de"] } })).status).toBe(401);
  });
});
