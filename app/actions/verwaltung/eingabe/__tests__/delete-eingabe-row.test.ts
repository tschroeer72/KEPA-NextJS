import { deleteEingabeRowAction } from "../delete-eingabe-row";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    $transaction: jest.fn(),
    tbl9erRatten: { delete: jest.fn() },
    tblSpiel6TageRennen: { delete: jest.fn() },
    tblDBChangeLog: { create: jest.fn() },
  },
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const prismaMock = prisma as any;

describe("deleteEingabeRowAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      return await callback(prismaMock);
    });
  });

  it("should delete 9er-ratten row and log it", async () => {
    const result = await deleteEingabeRowAction(1, "9er-ratten-kranz8");

    expect(prismaMock.tbl9erRatten.delete).toHaveBeenCalledWith({ where: { ID: 1 } });
    expect(prismaMock.tblDBChangeLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        Changetype: "delete",
        Tablename: "tbl9erRatten"
      })
    }));
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/verwaltung/eingabe");
  });

  it("should return success: false for unknown game type", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await deleteEingabeRowAction(1, "unknown");
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unbekannter Spieltyp");
  });

  it("should handle database errors", async () => {
    prismaMock.tbl9erRatten.delete.mockRejectedValue(new Error("DB Error"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await deleteEingabeRowAction(1, "9er-ratten-kranz8");
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect(result.error).toContain("DB Error");
  });
});
