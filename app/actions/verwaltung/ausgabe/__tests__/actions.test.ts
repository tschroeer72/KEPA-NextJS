/**
 * @jest-environment node
 */
import { getErgebnisse } from "../actions";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
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

const DAY = new Date(2024, 4, 10);
const DAY_STR = DAY.toLocaleDateString("de-DE");
const M1 = { Vorname: "Max", Nachname: "Mustermann" };
const M2 = { Vorname: "Eva", Nachname: "Beispiel" };
const SPIELTAG = { Spieltag: DAY };

describe("getErgebnisse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    for (const t of TABLES) prismaMock[t].findMany.mockResolvedValue([]);
  });

  it("should return empty arrays without querying if no spieltagIds provided", async () => {
    const result = await getErgebnisse([]);
    expect(result).toEqual({
      neunerRatten: [],
      sechsTageRennen: [],
      pokal: [],
      sargkegeln: [],
      meisterschaft: [],
      blitztunier: [],
      kombimeisterschaft: [],
    });
    for (const t of TABLES) expect(prismaMock[t].findMany).not.toHaveBeenCalled();
  });

  it("queries every table with the given IDs", async () => {
    await getErgebnisse([1, 2]);
    for (const t of TABLES) {
      expect(prismaMock[t].findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { SpieltagID: { in: [1, 2] } } })
      );
    }
  });

  it("should fetch and format 9er Ratten", async () => {
    prismaMock.tbl9erRatten.findMany.mockResolvedValue([
      { Neuner: 1, Ratten: 0, Kranzacht: 2, tblSpieltag: SPIELTAG, tblMitglieder: M1 },
    ]);

    const result = await getErgebnisse([1]);

    expect(result.neunerRatten).toEqual([
      { Spieltag: DAY_STR, Spielername: "Max Mustermann", Neuner: 1, Ratten: 0, Kranz8: 2 },
    ]);
  });

  it("formats 6-Tage-Rennen and defaults Spielnr to 0", async () => {
    const base = { Runden: 3, Punkte: 4, tblSpieltag: SPIELTAG, tblMitglieder_SpielerID1: M1, tblMitglieder_SpielerID2: M2 };
    prismaMock.tblSpiel6TageRennen.findMany.mockResolvedValue([
      { ...base, Spielnummer: 5 },
      { ...base, Spielnummer: null },
    ]);

    const result = await getErgebnisse([1]);

    expect(result.sechsTageRennen[0]).toEqual({
      Spieltag: DAY_STR,
      Spieler1Name: "Max Mustermann",
      Spieler2Name: "Eva Beispiel",
      Runden: 3,
      Punkte: 4,
      Spielnr: 5,
    });
    expect(result.sechsTageRennen[1].Spielnr).toBe(0);
  });

  it("formats Pokal and Sargkegeln", async () => {
    prismaMock.tblSpielPokal.findMany.mockResolvedValue([
      { Platzierung: 1, tblSpieltag: SPIELTAG, tblMitglieder: M1 },
    ]);
    prismaMock.tblSpielSargKegeln.findMany.mockResolvedValue([
      { Platzierung: 2, tblSpieltag: SPIELTAG, tblMitglieder: M2 },
    ]);

    const result = await getErgebnisse([1]);

    expect(result.pokal).toEqual([{ Spieltag: DAY_STR, Spielername: "Max Mustermann", Platzierung: 1 }]);
    expect(result.sargkegeln).toEqual([{ Spieltag: DAY_STR, Spielername: "Eva Beispiel", Platzierung: 2 }]);
  });

  it("formats Meisterschaft, Blitztunier and Kombimeisterschaft", async () => {
    const pair = { tblSpieltag: SPIELTAG, tblMitglieder_SpielerID1: M1, tblMitglieder_SpielerID2: M2 };
    prismaMock.tblSpielMeisterschaft.findMany.mockResolvedValue([
      { HolzSpieler1: 100, HolzSpieler2: 90, HinRueckrunde: 1, ...pair },
    ]);
    prismaMock.tblSpielBlitztunier.findMany.mockResolvedValue([
      { PunkteSpieler1: 3, PunkteSpieler2: 2, HinR_ckrunde: 0, ...pair },
    ]);
    prismaMock.tblSpielKombimeisterschaft.findMany.mockResolvedValue([
      {
        Spieler1Punkte3bis8: 1, Spieler1Punkte5Kugeln: 2,
        Spieler2Punkte3bis8: 3, Spieler2Punkte5Kugeln: 4,
        HinRueckrunde: 1, ...pair,
      },
    ]);

    const result = await getErgebnisse([1]);

    expect(result.meisterschaft).toEqual([
      {
        Spieltag: DAY_STR, Spieler1Name: "Max Mustermann", Spieler2Name: "Eva Beispiel",
        HolzSpieler1: 100, HolzSpieler2: 90, HinRueckrunde: 1,
      },
    ]);
    expect(result.blitztunier).toEqual([
      {
        Spieltag: DAY_STR, Spieler1Name: "Max Mustermann", Spieler2Name: "Eva Beispiel",
        PunkteSpieler1: 3, PunkteSpieler2: 2, HinRueckrunde: 0,
      },
    ]);
    expect(result.kombimeisterschaft).toEqual([
      {
        Spieltag: DAY_STR, Spieler1Name: "Max Mustermann", Spieler2Name: "Eva Beispiel",
        Spieler1Punkte3bis8: 1, Spieler1Punkte5Kugeln: 2,
        Spieler2Punkte3bis8: 3, Spieler2Punkte5Kugeln: 4, HinRueckrunde: 1,
      },
    ]);
  });

  it("propagates database errors", async () => {
    prismaMock.tblSpielPokal.findMany.mockRejectedValue(new Error("DB down"));
    await expect(getErgebnisse([1])).rejects.toThrow("DB down");
  });
});
