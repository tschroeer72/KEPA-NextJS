/**
 * Spielbetrieb: Ergebnis-Eingabe (alle 7 Spieltypen), Kontrollausgabe, Ausgabe und Statistik
 * – komplett gegen die echte Datenbank.
 */
import { prisma, resetDb, seedBasis } from "./helpers/db";
import { seedSpielbetrieb, SPIELTAGE } from "./helpers/spiele";
import { saveEingabeAction } from "@/app/actions/verwaltung/eingabe/save-eingabe";
import { getKontrollausgabeAction } from "@/app/actions/verwaltung/eingabe/get-eingabe";
import { deleteEingabeRowAction } from "@/app/actions/verwaltung/eingabe/delete-eingabe-row";
import { getErgebnisse } from "@/app/actions/verwaltung/ausgabe/actions";
import { getSpieltageByMeisterschaft } from "@/app/actions/db/spiele/actions";
import { saveGameResult } from "@/app/actions/db/spiele/actions";
import {
  getStatistik6TageRennenBesteMannschaft,
  getStatistik6TageRennenMannschaftMitglied,
  getStatistik6TageRennenPlatz,
  getStatistik9er,
  getStatistikNeunerRattenKoenig,
  getStatistikPokal,
  getStatistikRatten,
  getStatistikSarg,
  getStatistikSpielerById,
  getStatistikSpielerErgebnisse,
  getStatistikSpielerSpieler,
} from "@/app/actions/verwaltung/statistik/actions";

let basis: Awaited<ReturnType<typeof seedBasis>>;
let mid: number;
const [m0, m1, m2, m3] = [0, 1, 2, 3];

beforeAll(async () => {
  await resetDb();
  basis = await seedBasis();
  mid = basis.meisterschaft.ID;
});

describe("Ergebnis-Eingabe", () => {
  it("lehnt ungültiges Datum ab, ohne etwas anzulegen", async () => {
    const res = await saveEingabeAction(mid, new Date("kein-datum"), "pokal", []);
    expect(res).toMatchObject({ success: false });
    expect(await prisma.tblSpieltag.count()).toBe(0);
  });

  it("speichert alle 7 Spieltypen an zwei Spieltagen", async () => {
    await seedSpielbetrieb(basis);

    expect(await prisma.tblSpieltag.count()).toBe(2);
    expect(await prisma.tbl9erRatten.count()).toBe(6);
    expect(await prisma.tblSpiel6TageRennen.count()).toBe(4);
    expect(await prisma.tblSpielPokal.count()).toBe(4);
    expect(await prisma.tblSpielSargKegeln.count()).toBe(4);
    expect(await prisma.tblSpielMeisterschaft.count()).toBe(4);
    expect(await prisma.tblSpielBlitztunier.count()).toBe(4);
    expect(await prisma.tblSpielKombimeisterschaft.count()).toBe(4);
  });

  it("ein neuer Spieltag startet 'in Bearbeitung' und wird im ChangeLog protokolliert", async () => {
    const tag = await prisma.tblSpieltag.findFirst({ where: { MeisterschaftsID: mid } });
    expect(tag?.InBearbeitung).toBe(true);
    const logs = await prisma.tblDBChangeLog.findMany({ where: { Tablename: "tblSpieltag", Changetype: "insert" } });
    expect(logs).toHaveLength(2);
  });

  it("erneutes Speichern derselben Daten erzeugt keine Duplikate und keine Update-Logs", async () => {
    const before = await prisma.tblDBChangeLog.count();
    const res = await saveEingabeAction(mid, SPIELTAGE[0], "pokal", [
      { SpielerID: basis.mitglieder[m0].ID, Platzierung: 1 },
      { SpielerID: basis.mitglieder[m1].ID, Platzierung: 2 },
    ] as any);
    expect(res.success).toBe(true);
    expect(await prisma.tblSpielPokal.count()).toBe(4);
    expect(await prisma.tblDBChangeLog.count()).toBe(before);
    expect(await prisma.tblSpieltag.count()).toBe(2);
  });

  it("geänderte Werte werden aktualisiert (update + ChangeLog)", async () => {
    const res = await saveEingabeAction(mid, SPIELTAGE[0], "meisterschaft", [
      { Spieler1ID: basis.mitglieder[m0].ID, Spieler2ID: basis.mitglieder[m1].ID, Wert1: 150, Wert2: 110, HinRueckrunde: "Hinrunde" },
    ] as any);
    expect(res.success).toBe(true);
    const row = await prisma.tblSpielMeisterschaft.findFirst({
      where: { SpielerID1: basis.mitglieder[m0].ID, SpielerID2: basis.mitglieder[m1].ID, HinRueckrunde: 0 },
    });
    expect(row?.HolzSpieler1).toBe(150);
    expect(await prisma.tblSpielMeisterschaft.count()).toBe(4);
    const logs = await prisma.tblDBChangeLog.findMany({ where: { Tablename: "tblSpielMeisterschaft", Changetype: "update" } });
    expect(logs).toHaveLength(1);
  });

  it("deletedIds entfernen Zeilen innerhalb derselben Transaktion", async () => {
    const victim = await prisma.tblSpielSargKegeln.findFirst({ where: { SpielerID: basis.mitglieder[m3].ID } });
    const res = await saveEingabeAction(mid, SPIELTAGE[0], "sargkegeln", [], [victim!.ID]);
    expect(res.success).toBe(true);
    expect(await prisma.tblSpielSargKegeln.findUnique({ where: { ID: victim!.ID } })).toBeNull();
  });

  it("Fremdschlüsselfehler → success:false und vollständiger Rollback", async () => {
    const countBefore = await prisma.tblSpielPokal.count();
    const res = await saveEingabeAction(mid, SPIELTAGE[1], "pokal", [
      { SpielerID: basis.mitglieder[m2].ID, Platzierung: 3 },
      { SpielerID: 999999, Platzierung: 4 },
    ] as any);
    expect(res.success).toBe(false);
    expect(await prisma.tblSpielPokal.count()).toBe(countBefore);
  });

  it("neuer Spieltag + Fehler → auch der Spieltag wird zurückgerollt", async () => {
    const res = await saveEingabeAction(mid, new Date("2025-03-01"), "pokal", [
      { SpielerID: 999999, Platzierung: 1 },
    ] as any);
    expect(res.success).toBe(false);
    expect(await prisma.tblSpieltag.count()).toBe(2);
  });
});

describe("Kontrollausgabe & Löschen", () => {
  it("getKontrollausgabeAction liefert die Daten des Spieltags mit Anzeigenamen", async () => {
    const res = await getKontrollausgabeAction(SPIELTAGE[1]);
    expect(res.success).toBe(true);
    const d = res.data!;
    expect(d.neunerRatten).toHaveLength(3);
    expect(d.neunerRatten!.find((r) => r.Neuner === 4)?.Spielername).toBe("Hansi"); // Spitzname bevorzugt
    expect(d.neunerRatten!.find((r) => r.Spielername === "Karl")).toBeDefined(); // sonst Vorname
    expect(d.sechsTageRennen).toHaveLength(2);
    expect(d.pokal).toHaveLength(2);
    expect(d.sargkegeln).toHaveLength(2);
    expect(d.meisterschaft).toHaveLength(2);
    expect(d.meisterschaft![0].HinRueckrunde).toBe("Rückrunde");
    expect(d.blitztunier).toHaveLength(2);
    expect(d.kombimeisterschaft).toHaveLength(2);
  });

  it("Tag ohne Spiele → success mit data=null, ungültiges Datum → Fehler", async () => {
    expect(await getKontrollausgabeAction(new Date("2030-01-01"))).toEqual({ success: true, data: null });
    expect((await getKontrollausgabeAction(new Date("x"))).success).toBe(false);
  });

  it.each([
    ["9er-ratten-kranz8", "tbl9erRatten"],
    ["6-tage-rennen", "tblSpiel6TageRennen"],
    ["pokal", "tblSpielPokal"],
    ["sargkegeln", "tblSpielSargKegeln"],
    ["meisterschaft", "tblSpielMeisterschaft"],
    ["blitztunier", "tblSpielBlitztunier"],
    ["kombimeisterschaft", "tblSpielKombimeisterschaft"],
  ])("deleteEingabeRowAction (%s) löscht genau eine Zeile und protokolliert", async (spiel, tabelle) => {
    const model = (prisma as any)[tabelle];
    const before = await model.count();
    const row = await model.findFirst();
    const res = await deleteEingabeRowAction(row.ID, spiel);
    expect(res.success).toBe(true);
    expect(await model.count()).toBe(before - 1);
    const logs = await prisma.tblDBChangeLog.findMany({ where: { Tablename: tabelle, Changetype: "delete" } });
    expect(logs.length).toBeGreaterThanOrEqual(1);
  });

  it("unbekannter Spieltyp bzw. nicht vorhandene ID → success:false", async () => {
    expect((await deleteEingabeRowAction(1, "kegeln-xyz")).success).toBe(false);
    expect((await deleteEingabeRowAction(999999, "pokal")).success).toBe(false);
  });

  it("Daten für die weiteren Tests wiederherstellen", async () => {
    await resetDb();
    basis = await seedBasis();
    mid = basis.meisterschaft.ID;
    await seedSpielbetrieb(basis);
  });
});

describe("Ausgabe", () => {
  it("getErgebnisse([]) liefert leere Listen", async () => {
    const res = await getErgebnisse([]);
    expect(Object.values(res).every((l) => l.length === 0)).toBe(true);
  });

  it("getErgebnisse liefert alle Spieltypen für beide Spieltage", async () => {
    const tage = await getSpieltageByMeisterschaft(mid);
    expect(tage.success).toBe(true);
    const ids = (tage as any).data.map((t: any) => t.ID);
    expect(ids).toHaveLength(2);

    const res = await getErgebnisse(ids);
    expect(res.neunerRatten).toHaveLength(6);
    expect(res.sechsTageRennen).toHaveLength(4);
    expect(res.pokal).toHaveLength(4);
    expect(res.sargkegeln).toHaveLength(4);
    expect(res.meisterschaft).toHaveLength(4);
    expect(res.blitztunier).toHaveLength(4);
    expect(res.kombimeisterschaft).toHaveLength(4);
    expect(res.meisterschaft[0]).toMatchObject({ Spieler1Name: expect.stringContaining("Meier") });
  });

  it("saveGameResult (generischer Pfad) legt an und lehnt unbekannte Typen ab", async () => {
    const tag = await prisma.tblSpieltag.findFirst({ where: { MeisterschaftsID: mid } });
    const ok = await saveGameResult("9erratten", {
      SpieltagID: tag!.ID,
      SpielerID: basis.mitglieder[m3].ID,
      Neuner: 1,
      Ratten: 1,
      Kranzacht: 1,
    });
    expect(ok.success).toBe(true);
    expect((await saveGameResult("unbekannt", {})).success).toBe(false);
    await prisma.tbl9erRatten.deleteMany({ where: { SpielerID: basis.mitglieder[m3].ID } });
  });
});

describe("Statistik (zeitbereich 4 = gesamt)", () => {
  it("9er-Statistik: Summen und Verteilung pro Spieler", async () => {
    const stat = await getStatistik9er(4);
    const meier = stat.find((s: any) => s.Spieler === "Meier, Hans");
    expect(meier).toMatchObject({ Gesamt: 7, AnzTeilnahmen: 2, Drei: 1, Vier: 1 });
    expect(stat[0].Gesamt).toBeGreaterThanOrEqual(stat[stat.length - 1].Gesamt); // absteigend
  });

  it("Ratten-Statistik", async () => {
    const stat = await getStatistikRatten(4);
    expect(stat.length).toBeGreaterThan(0);
    expect(stat.find((s: any) => s.Spieler === "Becker, Otto")?.Gesamt).toBe(4);
  });

  it("Pokal- und Sarg-Statistik", async () => {
    const pokal = await getStatistikPokal(4);
    expect(pokal.find((s: any) => s.Spieler === "Meier, Hans")).toMatchObject({ Eins: 1, Zwei: 1 });
    const sarg = await getStatistikSarg(4);
    expect(sarg.length).toBeGreaterThan(0);
  });

  it("Spieler-gegen-Spieler, 6-Tage-Rennen und Neunerkönig laufen ohne SQL-Fehler und liefern Daten", async () => {
    expect((await getStatistikSpielerSpieler(4)).length).toBeGreaterThan(0);
    const platz = await getStatistik6TageRennenPlatz(4);
    expect(platz).toHaveLength(4); // jeder der 4 Spieler ist an 2 Spieltagen angetreten
    expect(platz.find((p: any) => p.Spieler === "Meier, Hans")).toMatchObject({ AnzTeilnahmen: 2, Eins: 2 });
    expect((await getStatistik6TageRennenBesteMannschaft(4)).length).toBeGreaterThan(0);
    const proMitglied = await getStatistik6TageRennenMannschaftMitglied(4);
    expect(Object.keys(proMitglied).length).toBeGreaterThanOrEqual(4);
    const koenig = await getStatistikNeunerRattenKoenig(4);
    expect(koenig.lstStatistik9erRatten).toHaveLength(2);
    expect(koenig.dictNeunerkönig).toEqual({ "Schmidt, Karl": 2 });
    expect(koenig.dictRattenkönig).toEqual({ "Becker, Otto": 2 });
  });

  it("Zeitbereich 3 (individuell) filtert nach Spieltagsdatum", async () => {
    const nurErster = await getStatistik9er(3, new Date("2025-02-01"), new Date("2025-02-01"));
    const meier = nurErster.find((s: any) => s.Spieler === "Meier, Hans");
    expect(meier?.Gesamt).toBe(3);
    const keine = await getStatistik9er(3, new Date("2030-01-01"), new Date("2030-12-31"));
    expect(keine).toEqual([]);
  });

  it("Zeitbereich 1 (laufende Meisterschaft) nutzt die Einstellung AktiveMeisterschaft", async () => {
    await prisma.tblSettings.create({
      data: { Computername: "int", Parametername: "AktiveMeisterschaft", Parameterwert: String(mid) },
    });
    expect((await getStatistik9er(1)).length).toBeGreaterThan(0);
    await prisma.tblSettings.updateMany({ data: { Parameterwert: "999999" } });
    expect(await getStatistik9er(1)).toEqual([]);
  });

  it("Spielerstatistik (Holz, Ratten, Neuner) stimmt mit den Eingaben überein", async () => {
    const res = await getStatistikSpielerById(basis.mitglieder[m0].ID);
    expect(res.success).toBe(true);
    expect(res.data).toMatchObject({
      HolzMeisterMax: 121,
      HolzMeisterMin: 120,
      HolzMeisterSumme: 241,
      HolzBlitzSumme: 60,
      NeunerSumme: 7,
      NeunerMax: 4,
      RattenSumme: 2,
    });
  });

  it("Spielerergebnisse pro Spieltag (neueste zuerst)", async () => {
    const erg = await getStatistikSpielerErgebnisse(basis.mitglieder[m0].ID);
    expect(erg.length).toBe(2);
    expect(erg[0].Meisterschaft).toBe("Testmeisterschaft");
    expect(new Date(erg[0].Spieltag).getTime()).toBeGreaterThan(new Date(erg[1].Spieltag).getTime());
  });
});
