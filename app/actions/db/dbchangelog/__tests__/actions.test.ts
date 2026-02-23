/**
 * @jest-environment node
 */
import { getChangeLogs } from "../actions";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tblDBChangeLog: {
      findMany: jest.fn(),
    },
  },
}));

const prismaMock = prisma as any;

describe("getChangeLogs", () => {
  it("should return change logs successfully", async () => {
    const mockLogs = [{ ID: 1, Tablename: "test" }];
    prismaMock.tblDBChangeLog.findMany.mockResolvedValue(mockLogs);

    const result = await getChangeLogs();

    expect(result).toEqual({ success: true, data: mockLogs });
    expect(prismaMock.tblDBChangeLog.findMany).toHaveBeenCalledWith({
      orderBy: { ID: "desc" },
    });
  });

  it("should return error on failure", async () => {
    prismaMock.tblDBChangeLog.findMany.mockRejectedValue(new Error("DB Error"));

    const result = await getChangeLogs();

    expect(result).toEqual({ success: false, error: "Fehler beim Abrufen der ChangeLogs" });
  });
});
