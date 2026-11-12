import { getFreigabeUrl } from "../get-freigabe-url";
import { getKegelfahrtById } from "../get-kegelfahrt-by-id";
import { getKegelfahrten } from "../get-kegelfahrten";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tblKegelfahrten: { findUnique: jest.fn(), findMany: jest.fn() },
  },
}));

const prismaMock = prisma as any;

describe("Kegelfahrten Actions", () => {
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => errorSpy.mockRestore());

  describe("getFreigabeUrl", () => {
    const original = process.env.FREIGABE;
    afterEach(() => {
      if (original === undefined) delete process.env.FREIGABE;
      else process.env.FREIGABE = original;
    });

    it("returns env value when FREIGABE is set", async () => {
      process.env.FREIGABE = "https://example.com/x";
      await expect(getFreigabeUrl()).resolves.toBe("https://example.com/x");
    });

    it("falls back to default url when unset or empty", async () => {
      delete process.env.FREIGABE;
      await expect(getFreigabeUrl()).resolves.toBe("http://gofile.me/7Sjzc/vHQAiJwDJ");
      process.env.FREIGABE = "";
      await expect(getFreigabeUrl()).resolves.toBe("http://gofile.me/7Sjzc/vHQAiJwDJ");
    });
  });

  describe("getKegelfahrtById", () => {
    it("returns the found record and queries by ID", async () => {
      const row = { ID: 3, Jahr: 2024 };
      prismaMock.tblKegelfahrten.findUnique.mockResolvedValue(row);
      await expect(getKegelfahrtById(3)).resolves.toBe(row);
      expect(prismaMock.tblKegelfahrten.findUnique).toHaveBeenCalledWith({ where: { ID: 3 } });
    });

    it("returns null when nothing is found", async () => {
      prismaMock.tblKegelfahrten.findUnique.mockResolvedValue(null);
      await expect(getKegelfahrtById(99)).resolves.toBeNull();
    });

    it("throws a friendly error when prisma rejects", async () => {
      prismaMock.tblKegelfahrten.findUnique.mockRejectedValue(new Error("db"));
      await expect(getKegelfahrtById(1)).rejects.toThrow("Kegelfahrt konnte nicht geladen werden.");
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe("getKegelfahrten", () => {
    it("returns all records ordered by Jahr desc", async () => {
      const rows = [{ ID: 2, Jahr: 2025 }, { ID: 1, Jahr: 2024 }];
      prismaMock.tblKegelfahrten.findMany.mockResolvedValue(rows);
      await expect(getKegelfahrten()).resolves.toEqual(rows);
      expect(prismaMock.tblKegelfahrten.findMany).toHaveBeenCalledWith({ orderBy: { Jahr: "desc" } });
    });

    it("returns an empty list", async () => {
      prismaMock.tblKegelfahrten.findMany.mockResolvedValue([]);
      await expect(getKegelfahrten()).resolves.toEqual([]);
    });

    it("throws a friendly error when prisma rejects", async () => {
      prismaMock.tblKegelfahrten.findMany.mockRejectedValue(new Error("db"));
      await expect(getKegelfahrten()).rejects.toThrow("Kegelfahrten konnten nicht geladen werden.");
      expect(errorSpy).toHaveBeenCalled();
    });
  });
});
