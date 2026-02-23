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

describe("getErgebnisse", () => {
  it("should return empty arrays if no spieltagIds provided", async () => {
    const result = await getErgebnisse([]);
    expect(result.neunerRatten).toEqual([]);
  });

  it("should fetch and format results for given IDs", async () => {
    prismaMock.tbl9erRatten.findMany.mockResolvedValue([
      {
        Neuner: 1, Ratten: 0, Kranzacht: 0,
        tblSpieltag: { Spieltag: new Date() },
        tblMitglieder: { Vorname: "Max", Nachname: "Mustermann" }
      }
    ]);
    // Mock other prisma calls as empty arrays
    prismaMock.tblSpiel6TageRennen.findMany.mockResolvedValue([]);
    prismaMock.tblSpielPokal.findMany.mockResolvedValue([]);
    prismaMock.tblSpielSargKegeln.findMany.mockResolvedValue([]);
    prismaMock.tblSpielMeisterschaft.findMany.mockResolvedValue([]);
    prismaMock.tblSpielBlitztunier.findMany.mockResolvedValue([]);
    prismaMock.tblSpielKombimeisterschaft.findMany.mockResolvedValue([]);

    const result = await getErgebnisse([1]);

    expect(result.neunerRatten).toHaveLength(1);
    expect(result.neunerRatten[0].Spielername).toBe("Max Mustermann");
  });
});
