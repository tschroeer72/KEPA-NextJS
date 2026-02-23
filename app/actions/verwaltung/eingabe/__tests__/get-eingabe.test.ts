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

describe("getKontrollausgabeAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return null data if no spieltag is found", async () => {
    const testDate = new Date("2024-01-01");
    (prismaMock.tblSpieltag.findFirst as jest.Mock).mockResolvedValue(null);

    const result = await getKontrollausgabeAction(testDate);

    expect(result).toEqual({ success: true, data: null });
    expect(prismaMock.tblSpieltag.findFirst).toHaveBeenCalledWith({
      where: {
        Spieltag: expect.any(Date),
      },
    });
  });

  it("should return formatted data if spieltag and entries are found", async () => {
    const testDate = new Date("2024-01-01");
    const mockSpieltag = { ID: 1, Spieltag: testDate };
    
    (prismaMock.tblSpieltag.findFirst as jest.Mock).mockResolvedValue(mockSpieltag);
    (prismaMock.tbl9erRatten.findMany as jest.Mock).mockResolvedValue([
      {
        ID: 10,
        SpieltagID: 1,
        SpielerID: 100,
        Neuner: 5,
        Ratten: 2,
        Kranzacht: 1,
        tblMitglieder: { Vorname: "Max", Spitzname: "Mäxchen" }
      }
    ]);
    (prismaMock.tblSpiel6TageRennen.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.tblSpielPokal.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.tblSpielSargKegeln.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.tblSpielMeisterschaft.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.tblSpielBlitztunier.findMany as jest.Mock).mockResolvedValue([]);
    (prismaMock.tblSpielKombimeisterschaft.findMany as jest.Mock).mockResolvedValue([]);

    const result = await getKontrollausgabeAction(testDate);

    expect(result.success).toBe(true);
    expect(result.data?.neunerRatten).toHaveLength(1);
    expect(result.data?.neunerRatten[0]).toMatchObject({
      ID: 10,
      Spielername: "Mäxchen",
      Neuner: 5
    });
  });

  it("should handle errors and return success: false", async () => {
    const testDate = new Date("2024-01-01");
    (prismaMock.tblSpieltag.findFirst as jest.Mock).mockRejectedValue(new Error("DB Error"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await getKontrollausgabeAction(testDate);
    consoleSpy.mockRestore();

    expect(result).toEqual({
      success: false,
      data: null,
      error: "Fehler beim Laden der Kontrolldaten"
    });
  });
});
