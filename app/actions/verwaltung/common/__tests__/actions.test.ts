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
  it("should return meisterschaften with typ", async () => {
    prismaMock.tblMeisterschaften.findMany.mockResolvedValue([
      { ID: 1, Bezeichnung: "M1", Beginn: new Date(), tblMeisterschaftstyp: { Meisterschaftstyp: "Typ1" } }
    ]);
    const result = await getMeisterschaften();
    expect(result[0].Meisterschaftstyp).toBe("Typ1");
  });

  it("should return spieltage for meisterschaft", async () => {
    prismaMock.tblSpieltag.findMany.mockResolvedValue([
      { ID: 10, Spieltag: new Date(), MeisterschaftsID: 1 }
    ]);
    const result = await getSpieltageByMeisterschaft(1);
    expect(result).toHaveLength(1);
    expect(result[0].ID).toBe(10);
  });
});
