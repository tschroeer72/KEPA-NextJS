/**
 * @jest-environment node
 */
import { getMeisterschaften, getSpieltageByMeisterschaft } from "../actions";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tblMeisterschaften: { findMany: jest.fn() },
    tblSpieltag: { findMany: jest.fn() },
  },
}));

const prismaMock = prisma as any;

describe("Common Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMeisterschaften", () => {
    it("should return meisterschaften with typ and shifted ISO date", async () => {
      const beginn = new Date(2024, 2, 5, 0, 0, 0);
      prismaMock.tblMeisterschaften.findMany.mockResolvedValue([
        { ID: 1, Bezeichnung: "M1", Beginn: beginn, tblMeisterschaftstyp: { Meisterschaftstyp: "Typ1" } },
      ]);

      const result = await getMeisterschaften();

      expect(prismaMock.tblMeisterschaften.findMany).toHaveBeenCalledWith({
        orderBy: { Beginn: "desc" },
        include: { tblMeisterschaftstyp: true },
      });
      expect(result[0].Meisterschaftstyp).toBe("Typ1");
      expect(result[0].Bezeichnung).toBe("M1");
      // local midnight is rendered as the same wall-clock date in ISO form
      expect(result[0].Beginn).toBe("2024-03-05T00:00:00.000Z");
    });

    it("should use Unbekannt when typ is missing and null for invalid date", async () => {
      prismaMock.tblMeisterschaften.findMany.mockResolvedValue([
        { ID: 2, Bezeichnung: "M2", Beginn: new Date("invalid"), tblMeisterschaftstyp: null },
        { ID: 3, Bezeichnung: "M3", Beginn: null, tblMeisterschaftstyp: null },
      ]);

      const result = await getMeisterschaften();

      expect(result[0].Meisterschaftstyp).toBe("Unbekannt");
      expect(result[0].Beginn).toBeNull();
      expect(result[1].Beginn).toBeNull();
    });

    it("should return empty list", async () => {
      prismaMock.tblMeisterschaften.findMany.mockResolvedValue([]);
      expect(await getMeisterschaften()).toEqual([]);
    });
  });

  describe("getSpieltageByMeisterschaft", () => {
    it("should return spieltage for meisterschaft", async () => {
      prismaMock.tblSpieltag.findMany.mockResolvedValue([
        { ID: 10, Spieltag: new Date(2024, 0, 15), MeisterschaftsID: 1 },
      ]);

      const result = await getSpieltageByMeisterschaft(1);

      expect(prismaMock.tblSpieltag.findMany).toHaveBeenCalledWith({
        where: { MeisterschaftsID: 1 },
        orderBy: { Spieltag: "asc" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].ID).toBe(10);
      expect(result[0].MeisterschaftsID).toBe(1);
      expect(result[0].Spieltag).toBe("2024-01-15T00:00:00.000Z");
    });

    it("should return null Spieltag for invalid date", async () => {
      prismaMock.tblSpieltag.findMany.mockResolvedValue([
        { ID: 11, Spieltag: new Date("invalid"), MeisterschaftsID: 1 },
      ]);
      const result = await getSpieltageByMeisterschaft(1);
      expect(result[0].Spieltag).toBeNull();
    });
  });
});
