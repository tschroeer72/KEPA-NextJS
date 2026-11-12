/**
 * @jest-environment node
 */
import { CreateChangeLogAsync } from "../create-change-log";
import { prisma } from "@/lib/prisma";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: { tblDBChangeLog: { create: jest.fn() } },
}));

const prismaMock = prisma as any;
const request = {
  headers: new Headers({ "user-agent": "Mozilla Chrome Windows NT 10.0", "x-real-ip": "5.5.5.5" }),
} as any;

describe("CreateChangeLogAsync", () => {
  beforeEach(() => jest.clearAllMocks());

  it("writes a change log entry with computer info", async () => {
    prismaMock.tblDBChangeLog.create.mockResolvedValue({});
    await CreateChangeLogAsync(request, "tblX", "insert", "insert into tblX");
    expect(prismaMock.tblDBChangeLog.create).toHaveBeenCalledWith({
      data: {
        Computername: "5.5.5.5-Chrome-Windows 10/11",
        Tablename: "tblX",
        Changetype: "insert",
        Command: "insert into tblX",
        Zeitstempel: expect.any(Date),
      },
    });
  });

  it("swallows database errors", async () => {
    prismaMock.tblDBChangeLog.create.mockRejectedValue(new Error("fail"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(CreateChangeLogAsync(request, "t", "update", "sql")).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalledWith("Changelog error:", expect.any(Error));
    spy.mockRestore();
  });
});
