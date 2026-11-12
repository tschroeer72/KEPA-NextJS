import { deleteEingabeRowAction } from "../delete-eingabe-row";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    $transaction: jest.fn(),
    tbl9erRatten: { delete: jest.fn() },
    tblSpiel6TageRennen: { delete: jest.fn() },
    tblSpielPokal: { delete: jest.fn() },
    tblSpielSargKegeln: { delete: jest.fn() },
    tblSpielMeisterschaft: { delete: jest.fn() },
    tblSpielBlitztunier: { delete: jest.fn() },
    tblSpielKombimeisterschaft: { delete: jest.fn() },
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

  it.each([
    ["9er-ratten-kranz8", "tbl9erRatten"],
    ["6-tage-rennen", "tblSpiel6TageRennen"],
    ["pokal", "tblSpielPokal"],
    ["sargkegeln", "tblSpielSargKegeln"],
    ["meisterschaft", "tblSpielMeisterschaft"],
    ["blitztunier", "tblSpielBlitztunier"],
    ["kombimeisterschaft", "tblSpielKombimeisterschaft"],
  ])("%s: deletes row and writes change log", async (spiel, table) => {
    const result = await deleteEingabeRowAction(42, spiel);

    expect(prismaMock[table].delete).toHaveBeenCalledWith({ where: { ID: 42 } });
    expect(prismaMock.tblDBChangeLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        Changetype: "delete",
        Tablename: table,
        Command: `delete from ${table} where ID = 42`,
        Computername: "Server",
        Zeitstempel: expect.any(Date),
      }),
    });
    expect(result).toEqual({ success: true });
    expect(revalidatePath).toHaveBeenCalledWith("/verwaltung/eingabe");
  });

  it("should return success: false for unknown game type and not log", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await deleteEingabeRowAction(1, "unknown");
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect((result as { error?: string }).error).toContain("Unbekannter Spieltyp");
    expect(prismaMock.tblDBChangeLog.create).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledWith("/verwaltung/eingabe");
  });

  it("should handle database errors", async () => {
    prismaMock.tbl9erRatten.delete.mockRejectedValue(new Error("DB Error"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await deleteEingabeRowAction(1, "9er-ratten-kranz8");
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect((result as { error?: string }).error).toContain("DB Error");
    expect(prismaMock.tblDBChangeLog.create).not.toHaveBeenCalled();
  });

  it("should handle change log failure", async () => {
    prismaMock.tblDBChangeLog.create.mockRejectedValue(new Error("Log Error"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await deleteEingabeRowAction(1, "pokal");
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect((result as { error?: string }).error).toContain("Log Error");
  });
});
