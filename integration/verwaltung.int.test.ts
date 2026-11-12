/**
 * Server Actions der Verwaltung gegen die echte Datenbank (keine Prisma-Mocks):
 * Mitglieder, Meisterschaften, Teilnehmer, Einstellungen, ChangeLog, Kegelfahrten, E-Mail-Empfänger.
 */
import { NextRequest } from "next/server";
import { prisma, resetDb, seedBasis } from "./helpers/db";
import {
  createMitglied,
  deleteMitglied,
  getAktiveMitglieder,
  getAlleMitglieder,
  getMitgliedById,
  getMitglieder,
  updateMitglied,
} from "@/app/actions/verwaltung/mitglieder/actions";
import {
  addTeilnehmer,
  createMeisterschaft,
  createMeisterschaftstyp,
  deleteMeisterschaft,
  getMeisterschaftById,
  getMeisterschaften,
  getMeisterschaftstypen,
  getTeilnehmerByMeisterschaft,
  removeTeilnehmer,
  updateMeisterschaft,
  updateTeilnehmerNurHinrunde,
} from "@/app/actions/verwaltung/meisterschaften/actions";
import { getMeisterschaften as getMeisterschaftenCommon, getSpieltageByMeisterschaft } from "@/app/actions/verwaltung/common/actions";
import { getCurrentMeisterschaft, setCurrentMeisterschaft } from "@/app/actions/settings";
import { getChangeLogs } from "@/app/actions/db/dbchangelog/actions";
import { getSettings, updateSetting } from "@/app/actions/db/settings/actions";
import { getKegelfahrten } from "@/app/actions/verwaltung/kegelfahrten/get-kegelfahrten";
import { getKegelfahrtById } from "@/app/actions/verwaltung/kegelfahrten/get-kegelfahrt-by-id";
import { getFreigabeUrl } from "@/app/actions/verwaltung/kegelfahrten/get-freigabe-url";
import { getMembersForEmail } from "@/app/actions/verwaltung/email/actions";
import { saveEingabeAction } from "@/app/actions/verwaltung/eingabe/save-eingabe";

let basis: Awaited<ReturnType<typeof seedBasis>>;

beforeAll(async () => {
  await resetDb();
  basis = await seedBasis();
});

const changeLogFor = (tabelle: string, typ: string) =>
  prisma.tblDBChangeLog.findMany({ where: { Tablename: tabelle, Changetype: typ } });

describe("Mitglieder", () => {
  let id: number;

  it("createMitglied verlangt Pflichtfelder", async () => {
    const res = await createMitglied({ Vorname: "Nur", Nachname: "", MitgliedSeit: new Date() } as any);
    expect(res.success).toBe(false);
  });

  it("createMitglied legt an, serialisiert Datumswerte und schreibt ein ChangeLog", async () => {
    const res = await createMitglied({
      Vorname: "Egon",
      Nachname: "Olsen",
      Spitzname: "Boss",
      MitgliedSeit: "2020-03-15",
      Geburtsdatum: "1980-07-01",
      EMail: "egon@example.com",
      Ehemaliger: false,
    } as any);
    expect(res.success).toBe(true);
    id = (res as any).data.ID;
    expect((res as any).data.MitgliedSeit).toContain("2020-03-15");

    const row = await prisma.tblMitglieder.findUnique({ where: { ID: id } });
    expect(row).toMatchObject({ Vorname: "Egon", Nachname: "Olsen", Spitzname: "Boss", Ehemaliger: false });
    expect(await changeLogFor("tblMitglieder", "insert")).toHaveLength(1);
  });

  it("ChangeLog enthält Herkunft (IP-Browser-OS) aus den Request-Headern", async () => {
    const [log] = await changeLogFor("tblMitglieder", "insert");
    expect(log.Computername).toBe("10.0.0.1-Chrome-Windows 10/11");
  });

  it("getMitgliedById liefert das Mitglied, unbekannte ID schlägt fehl", async () => {
    const ok = await getMitgliedById(id);
    expect(ok.success).toBe(true);
    expect((ok as any).data.Nachname).toBe("Olsen");

    const missing = await getMitgliedById(999999);
    expect(missing.success).toBe(false);
  });

  it("updateMitglied ändert nur übergebene Felder", async () => {
    const res = await updateMitglied(id, { Ort: "Hamburg", HolzMax: 42 } as any);
    expect(res.success).toBe(true);
    const row = await prisma.tblMitglieder.findUnique({ where: { ID: id } });
    expect(row).toMatchObject({ Ort: "Hamburg", HolzMax: 42, Vorname: "Egon" });
    expect(await changeLogFor("tblMitglieder", "update")).toHaveLength(1);
  });

  it("getMitglieder / getAlleMitglieder / getAktiveMitglieder liefern echte Daten (inkl. Raw-SQL)", async () => {
    const kurz = await getMitglieder();
    expect(kurz.success).toBe(true);
    expect((kurz as any).data).toHaveLength(5);

    const alle = await getAlleMitglieder();
    expect(alle.success).toBe(true);
    expect((alle as any).data).toHaveLength(5);

    const aktive = await getAktiveMitglieder();
    expect(aktive.success).toBe(true);
    const namen = (aktive as any).data.map((m: any) => m.Anzeigename);
    expect(namen).toContain('Egon "Boss" Olsen');
    expect(namen).toContain("Karl Schmidt");
  });

  it("Ehemalige und passive Mitglieder fehlen in getAktiveMitglieder, nicht in getAlleMitglieder", async () => {
    await updateMitglied(id, { Ehemaliger: true, AusgeschiedenAm: "2024-12-31" } as any);
    const aktive = (await getAktiveMitglieder()) as any;
    expect(aktive.data.map((m: any) => m.ID)).not.toContain(id);
    const alle = (await getAlleMitglieder()) as any;
    expect(alle.data.map((m: any) => m.ID)).toContain(id);

    await updateMitglied(id, { Ehemaliger: false, AusgeschiedenAm: null, PassivSeit: "2024-01-01" } as any);
    const aktive2 = (await getAktiveMitglieder()) as any;
    expect(aktive2.data.map((m: any) => m.ID)).not.toContain(id);
  });

  it("deleteMitglied entfernt den Datensatz und protokolliert", async () => {
    const res = await deleteMitglied(id);
    expect(res.success).toBe(true);
    expect(await prisma.tblMitglieder.findUnique({ where: { ID: id } })).toBeNull();
    expect(await changeLogFor("tblMitglieder", "delete")).toHaveLength(1);
  });

  it("deleteMitglied scheitert, solange Fremdschlüssel (Teilnehmer) existieren", async () => {
    const res = await deleteMitglied(basis.mitglieder[0].ID);
    expect(res.success).toBe(false);
    expect(await prisma.tblMitglieder.findUnique({ where: { ID: basis.mitglieder[0].ID } })).not.toBeNull();
  });
});

describe("Meisterschaften & Teilnehmer", () => {
  it("Meisterschaftstyp anlegen und auflisten", async () => {
    const created = await createMeisterschaftstyp("Blitztunier");
    expect(created.success).toBe(true);
    const list = (await getMeisterschaftstypen()) as any;
    expect(list.data.map((t: any) => t.Meisterschaftstyp)).toEqual(expect.arrayContaining(["Meisterschaft", "Blitztunier"]));
  });

  it("createMeisterschaft mit Aktiv=1 deaktiviert die bisher aktive (Transaktion)", async () => {
    const res = (await createMeisterschaft({
      Bezeichnung: "Neue Saison",
      Beginn: "2026-01-01",
      MeisterschaftstypID: basis.typ.ID,
      Aktiv: 1,
    } as any)) as any;
    expect(res.success).toBe(true);

    const aktive = await prisma.tblMeisterschaften.findMany({ where: { Aktiv: 1 } });
    expect(aktive.map((m) => m.ID)).toEqual([res.data.ID]);
    const alt = await prisma.tblMeisterschaften.findUnique({ where: { ID: basis.meisterschaft.ID } });
    expect(alt?.Aktiv).toBe(0);
  });

  it("updateMeisterschaft: Aktiv=1 verschiebt die aktive Meisterschaft zurück", async () => {
    const res = await updateMeisterschaft(basis.meisterschaft.ID, { Aktiv: 1, Bemerkungen: "wieder aktiv" } as any);
    expect(res.success).toBe(true);
    const aktive = await prisma.tblMeisterschaften.findMany({ where: { Aktiv: 1 } });
    expect(aktive.map((m) => m.ID)).toEqual([basis.meisterschaft.ID]);
  });

  it("updateMeisterschaft lehnt leeres Startdatum ab", async () => {
    const res = await updateMeisterschaft(basis.meisterschaft.ID, { Beginn: null } as any);
    expect(res.success).toBe(false);
  });

  it("getMeisterschaften / getMeisterschaftById (verwaltung + common)", async () => {
    const list = (await getMeisterschaften()) as any;
    expect(list.success).toBe(true);
    expect(list.data).toHaveLength(2);

    const one = (await getMeisterschaftById(basis.meisterschaft.ID)) as any;
    expect(one.success).toBe(true);
    expect(one.data.Bezeichnung).toBe("Testmeisterschaft");

    const common = await getMeisterschaftenCommon();
    expect(common.map((m) => m.Bezeichnung)).toEqual(["Neue Saison", "Testmeisterschaft"]); // Beginn desc
    expect(common[0].Meisterschaftstyp).toBe("Meisterschaft");
  });

  it("Teilnehmer: Liste, Hinzufügen, Entfernen (ohne Spiele = löschen)", async () => {
    const mid = basis.meisterschaft.ID;
    const list = (await getTeilnehmerByMeisterschaft(mid)) as any;
    expect(list.data).toHaveLength(4);
    expect(list.data.find((t: any) => t.Vorname === "Hans").Anzeigename).toBe('Hans "Hansi" Meier');

    const neu = (await createMitglied({ Vorname: "Neu", Nachname: "Dabei", MitgliedSeit: "2025-01-01" } as any)) as any;
    expect((await addTeilnehmer(mid, neu.data.ID)).success).toBe(true);
    expect(((await getTeilnehmerByMeisterschaft(mid)) as any).data).toHaveLength(5);

    const rm = await removeTeilnehmer(mid, neu.data.ID);
    expect(rm).toMatchObject({ success: true, action: "deleted" });
    expect(((await getTeilnehmerByMeisterschaft(mid)) as any).data).toHaveLength(4);
  });

  it("removeTeilnehmer markiert Spieler mit Spielen nur als NurHinrunde statt zu löschen", async () => {
    const mid = basis.meisterschaft.ID;
    const [a, b] = basis.mitglieder;
    const saved = await saveEingabeAction(mid, new Date("2025-02-01"), "meisterschaft", [
      { Spieler1ID: a.ID, Spieler2ID: b.ID, Wert1: 100, Wert2: 90, HinRueckrunde: "Hin" } as any,
    ]);
    expect(saved.success).toBe(true);

    const res = await removeTeilnehmer(mid, a.ID);
    expect(res).toMatchObject({ success: true, action: "marked" });
    const t = await prisma.tblTeilnehmer.findFirst({ where: { MeisterschaftsID: mid, SpielerID: a.ID } });
    expect(t?.NurHinrunde).toBe(true);

    expect((await updateTeilnehmerNurHinrunde(mid, a.ID, false)).success).toBe(true);
    const t2 = await prisma.tblTeilnehmer.findFirst({ where: { MeisterschaftsID: mid, SpielerID: a.ID } });
    expect(t2?.NurHinrunde).toBe(false);
  });

  it("getSpieltageByMeisterschaft liefert den angelegten Spieltag", async () => {
    const tage = await getSpieltageByMeisterschaft(basis.meisterschaft.ID);
    expect(tage).toHaveLength(1);
    expect(tage[0].Spieltag).toContain("2025-02-01");
  });

  it("deleteMeisterschaft: mit Spieltagen blockiert der Fremdschlüssel, ohne Abhängigkeiten klappt es", async () => {
    expect((await deleteMeisterschaft(basis.meisterschaft.ID)).success).toBe(false);

    const leer = (await createMeisterschaft({
      Bezeichnung: "Leer",
      Beginn: "2024-01-01",
      MeisterschaftstypID: basis.typ.ID,
      Aktiv: 0,
    } as any)) as any;
    expect((await deleteMeisterschaft(leer.data.ID)).success).toBe(true);
    expect(await prisma.tblMeisterschaften.findUnique({ where: { ID: leer.data.ID } })).toBeNull();
  });
});

describe("Einstellungen (aktive Meisterschaft)", () => {
  const req = (ua: string) =>
    new NextRequest("http://localhost/x", { headers: { "user-agent": ua, "x-forwarded-for": "1.2.3.4" } });

  it("ohne Eintrag → null", async () => {
    expect(await getCurrentMeisterschaft()).toBeNull();
  });

  it("set legt an, erneutes set vom selben Rechner aktualisiert statt zu duplizieren", async () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0) Firefox/120";
    await setCurrentMeisterschaft(req(ua), "7");
    expect(await getCurrentMeisterschaft()).toBe("7");
    await setCurrentMeisterschaft(req(ua), "9");
    expect(await getCurrentMeisterschaft()).toBe("9");
    expect(await prisma.tblSettings.count({ where: { Parametername: "AktiveMeisterschaft" } })).toBe(1);
  });

  it("anderer Rechner → eigener Eintrag, jüngster gewinnt", async () => {
    await setCurrentMeisterschaft(req("Mozilla/5.0 (Macintosh) Safari/605"), "11");
    expect(await prisma.tblSettings.count({ where: { Parametername: "AktiveMeisterschaft" } })).toBe(2);
    expect(await getCurrentMeisterschaft()).toBe("11");
  });

  it("getSettings / updateSetting", async () => {
    const all = (await getSettings()) as any;
    expect(all.data.length).toBe(2);
    const res = await updateSetting(all.data[0].ID, "42");
    expect(res.success).toBe(true);
    expect((await prisma.tblSettings.findUnique({ where: { ID: all.data[0].ID } }))?.Parameterwert).toBe("42");
  });
});

describe("ChangeLog", () => {
  it("getChangeLogs liefert Einträge absteigend nach ID", async () => {
    const res = (await getChangeLogs()) as any;
    expect(res.success).toBe(true);
    expect(res.data.length).toBeGreaterThan(5);
    const ids = res.data.map((l: any) => l.ID);
    expect(ids).toEqual([...ids].sort((x: number, y: number) => y - x));
  });
});

describe("Kegelfahrten", () => {
  it("Liste (Jahr absteigend) und Abruf per ID", async () => {
    await prisma.tblKegelfahrten.createMany({
      data: [
        { Jahr: 2019, Ziel: "Harz", Von: new Date("2019-05-01"), Bis: new Date("2019-05-04"), Dateiname: "harz.mp4" },
        { Jahr: 2023, Ziel: "Mosel", Von: new Date("2023-06-01"), Bis: new Date("2023-06-04"), Dateiname: "mosel.mp4" },
      ],
    });
    const list = await getKegelfahrten();
    expect(list.map((k) => k.Ziel)).toEqual(["Mosel", "Harz"]);
    expect((await getKegelfahrtById(list[0].ID))?.Dateiname).toBe("mosel.mp4");
    expect(await getKegelfahrtById(999999)).toBeNull();
  });

  it("getFreigabeUrl liefert Fallback-URL", async () => {
    expect(await getFreigabeUrl()).toMatch(/^http/);
  });
});

describe("E-Mail-Empfänger", () => {
  it("nur aktive Mitglieder mit gültiger Adresse", async () => {
    await prisma.tblMitglieder.update({ where: { ID: basis.mitglieder[3].ID }, data: { EMail: "ohne-at" } });
    await prisma.tblMitglieder.update({ where: { ID: basis.mitglieder[2].ID }, data: { Ehemaliger: true } });
    const res = (await getMembersForEmail()) as any;
    expect(res.success).toBe(true);
    const mails = res.data.map((m: any) => m.EMail).sort();
    expect(mails).toEqual(["hans@example.com", "karl@example.com"]);
  });
});
