import { getSettings, updateSetting } from "../actions";
import { prisma } from "@/lib/prisma";
import { createChangeLogAction } from "@/utils/change-log-action";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tblSettings: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("@/utils/change-log-action", () => ({
  createChangeLogAction: jest.fn(),
}));

const prismaMock = prisma as any;

describe("Settings Actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSettings", () => {
    it("should return settings", async () => {
      const mockSettings = [{ ID: 1, Parameterwert: "test" }];
      prismaMock.tblSettings.findMany.mockResolvedValue(mockSettings);

      const result = await getSettings();

      expect(result).toEqual({ success: true, data: mockSettings });
    });

    it("should return error result when query fails", async () => {
      prismaMock.tblSettings.findMany.mockRejectedValue(new Error("DB"));

      const result = await getSettings();

      expect(result).toEqual({ success: false, error: "Fehler beim Abrufen der Einstellungen" });
    });
  });

  describe("updateSetting", () => {
    it("should update setting and log it", async () => {
      prismaMock.tblSettings.update.mockResolvedValue({ ID: 1, Parameterwert: "new" });

      const result = await updateSetting(1, "new");

      expect(prismaMock.tblSettings.update).toHaveBeenCalledWith({
        where: { ID: 1 },
        data: { Parameterwert: "new" },
      });
      expect(createChangeLogAction).toHaveBeenCalledWith(
        "tblSettings",
        "update",
        "update tblSettings set Parameterwert='new' where ID=1"
      );
      expect(result).toEqual({ success: true, data: { ID: 1, Parameterwert: "new" } });
    });

    it("should return error and skip change log when update fails", async () => {
      prismaMock.tblSettings.update.mockRejectedValue(new Error("DB"));

      const result = await updateSetting(1, "x");

      expect(result).toEqual({ success: false, error: "Fehler beim Aktualisieren der Einstellung" });
      expect(createChangeLogAction).not.toHaveBeenCalled();
    });

    it("should return error when change log throws", async () => {
      prismaMock.tblSettings.update.mockResolvedValue({ ID: 1 });
      (createChangeLogAction as jest.Mock).mockRejectedValueOnce(new Error("log"));

      const result = await updateSetting(1, "x");

      expect(result.success).toBe(false);
    });
  });
});
