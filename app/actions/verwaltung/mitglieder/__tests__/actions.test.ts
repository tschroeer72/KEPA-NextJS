import { getMitglieder, createMitglied, deleteMitglied } from "../actions";
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
    tblMitglieder: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    tblDBChangeLog: {
      create: jest.fn(),
    },
  },
}));

const prismaMock = prisma as any;

describe("Mitglieder Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMitglieder", () => {
    it("should return all members", async () => {
      const mockMembers = [{ ID: 1, Vorname: "Max" }];
      prismaMock.tblMitglieder.findMany.mockResolvedValue(mockMembers);

      const result = await getMitglieder();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMembers);
      expect(prismaMock.tblMitglieder.findMany).toHaveBeenCalled();
    });
  });

  describe("createMitglied", () => {
    it("should create a new member", async () => {
      const newMember = { Vorname: "Max", Nachname: "Mustermann", MitgliedSeit: new Date() };
      prismaMock.tblMitglieder.create.mockResolvedValue({ ID: 1, ...newMember });

      const result = await createMitglied(newMember as any);

      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({ ID: 1, Vorname: "Max", Nachname: "Mustermann" });
      expect(prismaMock.tblMitglieder.create).toHaveBeenCalled();
    });
  });

  describe("deleteMitglied", () => {
    it("should delete a member", async () => {
      prismaMock.tblMitglieder.delete.mockResolvedValue({ ID: 1 });

      const result = await deleteMitglied(1);

      expect(result.success).toBe(true);
      expect(prismaMock.tblMitglieder.delete).toHaveBeenCalledWith({
        where: { ID: 1 }
      });
    });
  });
});
