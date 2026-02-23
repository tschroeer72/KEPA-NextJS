import { saveGameResult, getSpieltageByMeisterschaft } from "../actions";
import { prisma } from "@/lib/prisma";
import { createChangeLogAction } from "@/utils/change-log-action";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tbl9erRatten: { create: jest.fn() },
    tblSpieltag: { create: jest.fn(), findMany: jest.fn() },
  },
}));

jest.mock("@/utils/change-log-action", () => ({
  createChangeLogAction: jest.fn(),
}));

const prismaMock = prisma as any;

describe("Spiele Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("saveGameResult", () => {
    it("should save 9er ratten result", async () => {
      const mockData = { SpielerID: 1, Neuner: 5 };
      prismaMock.tbl9erRatten.create.mockResolvedValue({ ID: 1, ...mockData });

      const result = await saveGameResult("9erratten", mockData);

      expect(prismaMock.tbl9erRatten.create).toHaveBeenCalledWith({ data: mockData });
      expect(createChangeLogAction).toHaveBeenCalledWith("tbl9erRatten", "insert", expect.any(String));
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(mockData);
    });

    it("should save spieltag result", async () => {
      const mockData = { MeisterschaftsID: 1, Spieltag: new Date() };
      prismaMock.tblSpieltag.create.mockResolvedValue({ ID: 1, ...mockData });

      const result = await saveGameResult("spieltag", mockData);

      expect(prismaMock.tblSpieltag.create).toHaveBeenCalledWith({ data: mockData });
      expect(result.success).toBe(true);
    });

    it("should return error for unknown type", async () => {
      const result = await saveGameResult("unknown", {});
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unbekannter Spieltyp");
    });

    it("should handle database errors", async () => {
      prismaMock.tbl9erRatten.create.mockRejectedValue(new Error("DB Error"));

      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const result = await saveGameResult("9erratten", {});
      consoleSpy.mockRestore();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Fehler beim Speichern des Spielergebnisses");
    });
  });

  describe("getSpieltageByMeisterschaft", () => {
    it("should return spieltage for meisterschaft", async () => {
      const mockSpieltage = [{ ID: 1, MeisterschaftsID: 10 }];
      prismaMock.tblSpieltag.findMany.mockResolvedValue(mockSpieltage);

      const result = await getSpieltageByMeisterschaft(10);

      expect(prismaMock.tblSpieltag.findMany).toHaveBeenCalledWith({
        where: { MeisterschaftsID: 10 },
        orderBy: { Spieltag: 'desc' }
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSpieltage);
    });

    it("should handle database errors in getSpieltageByMeisterschaft", async () => {
      prismaMock.tblSpieltag.findMany.mockRejectedValue(new Error("DB Error"));

      const result = await getSpieltageByMeisterschaft(10);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Fehler beim Abrufen der Spieltage");
    });
  });
});
