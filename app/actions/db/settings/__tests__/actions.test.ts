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
  });

  describe("updateSetting", () => {
    it("should update setting and log it", async () => {
      prismaMock.tblSettings.update.mockResolvedValue({ ID: 1, Parameterwert: "new" });

      const result = await updateSetting(1, "new");

      expect(prismaMock.tblSettings.update).toHaveBeenCalledWith({
        where: { ID: 1 },
        data: { Parameterwert: "new" },
      });
      expect(createChangeLogAction).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });
});
