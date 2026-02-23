import { getStatistik9er } from "../actions";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tbl9erRatten: {
      findMany: jest.fn(),
    },
  },
}));

const prismaMock = prisma as any;

describe("getStatistik9er", () => {
  it("should return aggregated 9er statistics", async () => {
    prismaMock.tbl9erRatten.findMany.mockResolvedValue([
      { SpielerID: 1, Neuner: 5, tblMitglieder: { Vorname: "Max", Nachname: "M" } },
      { SpielerID: 1, Neuner: 3, tblMitglieder: { Vorname: "Max", Nachname: "M" } },
      { SpielerID: 2, Neuner: 2, tblMitglieder: { Vorname: "Erika", Nachname: "E" } },
    ]);

    const result = await getStatistik9er(0); // zeitbereich 0 (kein filter)

    expect(result).toHaveLength(2);
    expect(result[0].Gesamt).toBe(8);
    expect(result[1].Gesamt).toBe(2);
  });
});
