import { getKontrollausgabeAction } from "../get-eingabe";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tblSpieltag: { findFirst: jest.fn() },
    tbl9erRatten: { findMany: jest.fn() },
    tblSpiel6TageRennen: { findMany: jest.fn() },
    tblSpielPokal: { findMany: jest.fn() },
    tblSpielSargKegeln: { findMany: jest.fn() },
    tblSpielMeisterschaft: { findMany: jest.fn() },
    tblSpielBlitztunier: { findMany: jest.fn() },
    tblSpielKombimeisterschaft: { findMany: jest.fn() },
  },
}));

const prismaMock = prisma as any;

const TABLES = [
  "tbl9erRatten",
  "tblSpiel6TageRennen",
  "tblSpielPokal",
  "tblSpielSargKegeln",
  "tblSpielMeisterschaft",
  "tblSpielBlitztunier",
  "tblSpielKombimeisterschaft",
];

const testDate = new Date(2024, 0, 1);
const A = { Vorname: "Anna", Spitzname: "Anni" };
const B = { Vorname: "Bernd", Spitzname: "  " };
const C = { Vorname: "Carl", Spitzname: null };

describe("getKontrollausgabeAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const t of TABLES) prismaMock[t].findMany.mockResolvedValue([]);
  });

  it("returns error for invalid date", async () => {
    const result = await getKontrollausgabeAction(new Date("invalid"));
    expect(result).toEqual({ success: false, data: null, error: "Ungültiges Datum" });
    expect(prismaMock.tblSpieltag.findFirst).not.toHaveBeenCalled();
  });

  it("should return null data if no spieltag is found", async () => {
    prismaMock.tblSpieltag.findFirst.mockResolvedValue(null);

    const result = await getKontrollausgabeAction(testDate);

    expect(result).toEqual({ success: true, data: null });
    expect(prismaMock.tblSpieltag.findFirst).toHaveBeenCalledWith({
      where: { Spieltag: new Date(Date.UTC(2024, 0, 1)) },
    });
    expect(prismaMock.tbl9erRatten.findMany).not.toHaveBeenCalled();
  });

  it("returns empty lists when spieltag exists without entries", async () => {
    prismaMock.tblSpieltag.findFirst.mockResolvedValue({ ID: 1, Spieltag: testDate });
    const result = await getKontrollausgabeAction(testDate);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      neunerRatten: [],
      sechsTageRennen: [],
      pokal: [],
      sargkegeln: [],
      meisterschaft: [],
      blitztunier: [],
      kombimeisterschaft: [],
    });
    expect(prismaMock.tbl9erRatten.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { SpieltagID: 1 } })
    );
  });

  it("should return formatted data for 9er Ratten (Spitzname preferred)", async () => {
    prismaMock.tblSpieltag.findFirst.mockResolvedValue({ ID: 1, Spieltag: testDate });
    prismaMock.tbl9erRatten.findMany.mockResolvedValue([
      { ID: 10, SpieltagID: 1, SpielerID: 100, Neuner: 5, Ratten: 2, Kranzacht: 1, tblMitglieder: { Vorname: "Max", Spitzname: "Mäxchen" } },
    ]);

    const result = await getKontrollausgabeAction(testDate);

    expect(result.data?.neunerRatten).toHaveLength(1);
    expect(result.data?.neunerRatten[0]).toMatchObject({
      ID: 10,
      SpielerID: 100,
      Spielername: "Mäxchen",
      Neuner: 5,
      Ratten: 2,
      Kranz8: 1,
      Spieltag: testDate.toLocaleDateString("de-DE"),
    });
  });

  it("falls back to Vorname for blank/null Spitzname and Unbekannt without member", async () => {
    prismaMock.tblSpieltag.findFirst.mockResolvedValue({ ID: 1, Spieltag: testDate });
    prismaMock.tblSpielPokal.findMany.mockResolvedValue([
      { ID: 1, SpieltagID: 1, SpielerID: 1, Platzierung: 1, tblMitglieder: B },
      { ID: 2, SpieltagID: 1, SpielerID: 2, Platzierung: 2, tblMitglieder: C },
      { ID: 3, SpieltagID: 1, SpielerID: 3, Platzierung: 3, tblMitglieder: null },
    ]);

    const result = await getKontrollausgabeAction(testDate);
    expect(result.data?.pokal.map(p => p.Spielername)).toEqual(["Bernd", "Carl", "Unbekannt"]);
  });

  it("maps all other game types", async () => {
    prismaMock.tblSpieltag.findFirst.mockResolvedValue({ ID: 1, Spieltag: testDate });
    const pair = { tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B };
    prismaMock.tblSpiel6TageRennen.findMany.mockResolvedValue([
      { ID: 1, SpieltagID: 1, SpielerID1: 10, SpielerID2: 20, Runden: 5, Punkte: 7, Spielnummer: 2, ...pair },
    ]);
    prismaMock.tblSpielSargKegeln.findMany.mockResolvedValue([
      { ID: 2, SpieltagID: 1, SpielerID: 10, Platzierung: 4, tblMitglieder: A },
    ]);
    prismaMock.tblSpielMeisterschaft.findMany.mockResolvedValue([
      { ID: 3, SpieltagID: 1, SpielerID1: 10, SpielerID2: 20, HolzSpieler1: 100, HolzSpieler2: 90, HinRueckrunde: 0, ...pair },
      { ID: 4, SpieltagID: 1, SpielerID1: 10, SpielerID2: 20, HolzSpieler1: 1, HolzSpieler2: 2, HinRueckrunde: 1, ...pair },
    ]);
    prismaMock.tblSpielBlitztunier.findMany.mockResolvedValue([
      { ID: 5, SpieltagID: 1, SpielerID1: 10, SpielerID2: 20, PunkteSpieler1: 3, PunkteSpieler2: 1, HinR_ckrunde: 1, ...pair },
    ]);
    prismaMock.tblSpielKombimeisterschaft.findMany.mockResolvedValue([
      {
        ID: 6, SpieltagID: 1, SpielerID1: 10, SpielerID2: 20,
        Spieler1Punkte3bis8: 1, Spieler1Punkte5Kugeln: 2, Spieler2Punkte3bis8: 3, Spieler2Punkte5Kugeln: 4,
        HinRueckrunde: 0, ...pair,
      },
    ]);

    const { data } = await getKontrollausgabeAction(testDate);

    expect(data?.sechsTageRennen[0]).toMatchObject({
      ID: 1, Spieler1ID: 10, Spieler1Name: "Anni", Spieler2ID: 20, Spieler2Name: "Bernd", Runden: 5, Punkte: 7, Spielnr: 2,
    });
    expect(data?.sargkegeln[0]).toMatchObject({ ID: 2, Spielername: "Anni", Platzierung: 4 });
    expect(data?.meisterschaft.map(m => m.HinRueckrunde)).toEqual(["Hinrunde", "Rückrunde"]);
    expect(data?.meisterschaft[0]).toMatchObject({ HolzSpieler1: 100, HolzSpieler2: 90 });
    expect(data?.blitztunier[0]).toMatchObject({
      PunkteSpieler1: 3, PunkteSpieler2: 1, HinRueckrunde: "Rückrunde", Spieler2Name: "Bernd",
    });
    expect(data?.kombimeisterschaft[0]).toMatchObject({
      Spieler1Punkte3bis8: 1, Spieler1Punkte5Kugeln: 2, Spieler2Punkte3bis8: 3, Spieler2Punkte5Kugeln: 4,
      HinRueckrunde: "Hinrunde",
    });
  });

  it("should handle errors and return success: false", async () => {
    prismaMock.tblSpieltag.findFirst.mockRejectedValue(new Error("DB Error"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await getKontrollausgabeAction(testDate);
    consoleSpy.mockRestore();

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Fehler beim Laden der Kontrolldaten",
    });
  });
});
