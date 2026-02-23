import { saveEingabeAction } from "../save-eingabe";
import { prisma } from "@/lib/prisma";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("next/headers", () => ({
  headers: jest.fn(() => ({
    get: jest.fn(),
  })),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as any;

describe("saveEingabeAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return success when transaction completes", async () => {
    prismaMock.$transaction.mockResolvedValue({ success: true });

    const result = await saveEingabeAction(1, "2024-01-01", "9er-ratten-kranz8", [], []);

    expect(result).toEqual({ success: true });
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("should handle transaction error", async () => {
    prismaMock.$transaction.mockRejectedValue(new Error("Tx Error"));

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await saveEingabeAction(1, "2024-01-01", "9er-ratten-kranz8", [], []);
    consoleSpy.mockRestore();

    expect(result.success).toBe(false);
    expect(result.error).toContain("Tx Error");
  });
});
