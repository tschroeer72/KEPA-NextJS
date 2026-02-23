import { getCurrentMeisterschaft } from "../get-current-meisterschaft";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tblSettings: {
      findFirst: jest.fn(),
    },
  },
}));

const prismaMock = prisma as any;

describe("getCurrentMeisterschaft", () => {
  it("should return the current meisterschaft value", async () => {
    prismaMock.tblSettings.findFirst.mockResolvedValue({ Parameterwert: "2024" });

    const result = await getCurrentMeisterschaft();

    expect(result).toBe("2024");
    expect(prismaMock.tblSettings.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { Parametername: "AktiveMeisterschaft" }
    }));
  });

  it("should return null if no setting found", async () => {
    prismaMock.tblSettings.findFirst.mockResolvedValue(null);

    const result = await getCurrentMeisterschaft();

    expect(result).toBeNull();
  });
});
