import { getMeisterschaften, createMeisterschaft, deleteMeisterschaft } from "../actions";
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
    tblMeisterschaften: {
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
    tblDBChangeLog: { create: jest.fn() },
  },
}));

const prismaMock = prisma as any;

describe("Meisterschaften Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: any) => {
      return await callback(prismaMock);
    });
  });

  describe("getMeisterschaften", () => {
    it("should return all meisterschaften", async () => {
      const mockData = [{ ID: 1, Bezeichnung: "Test" }];
      prismaMock.tblMeisterschaften.findMany.mockResolvedValue(mockData);

      const result = await getMeisterschaften();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
    });
  });

  describe("deleteMeisterschaft", () => {
    it("should delete meisterschaft", async () => {
      prismaMock.tblMeisterschaften.delete.mockResolvedValue({ ID: 1 });

      const result = await deleteMeisterschaft(1);

      expect(prismaMock.tblMeisterschaften.delete).toHaveBeenCalledWith({
        where: { ID: 1 }
      });
      expect(result.success).toBe(true);
    });
  });
});
