/**
 * @jest-environment node
 */
import { getComputerInfoFromHeaders, createChangeLogAction } from "../change-log-action";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

jest.mock("next/headers", () => ({ headers: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: { tblDBChangeLog: { create: jest.fn() } },
}));

const prismaMock = prisma as any;
const setHeaders = (h: Record<string, string>) => (headers as jest.Mock).mockResolvedValue(new Headers(h));

describe("getComputerInfoFromHeaders", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns unknown values without headers", async () => {
    setHeaders({});
    expect(await getComputerInfoFromHeaders()).toBe("Unknown IP-Unknown-Unknown OS");
  });

  it("prefers first x-forwarded-for entry over x-real-ip", async () => {
    setHeaders({ "x-forwarded-for": "1.2.3.4, 5.6.7.8", "x-real-ip": "9.9.9.9" });
    expect(await getComputerInfoFromHeaders()).toMatch(/^1\.2\.3\.4-/);
  });

  it("falls back to x-real-ip", async () => {
    setHeaders({ "x-real-ip": "9.9.9.9" });
    expect(await getComputerInfoFromHeaders()).toMatch(/^9\.9\.9\.9-/);
  });

  it.each([
    ["Windows NT 10.0 Chrome/1", "Chrome", "Windows 10/11"],
    ["Windows NT 6.3 Firefox/1", "Firefox", "Windows 8.1"],
    ["Windows NT 6.1 Safari/1", "Safari", "Windows 7"],
    ["Macintosh Edge/1", "Edge", "macOS"],
    ["Linux X11", "Unknown", "Linux"],
    ["Android 13", "Unknown", "Android"],
    ["iPhone OS", "Unknown", "iOS"],
    ["curl", "Unknown", "Unknown OS"],
  ])("parses %s", async (ua, browser, os) => {
    setHeaders({ "user-agent": ua, "x-real-ip": "1.1.1.1" });
    expect(await getComputerInfoFromHeaders()).toBe(`1.1.1.1-${browser}-${os}`);
  });
});

describe("createChangeLogAction", () => {
  beforeEach(() => jest.clearAllMocks());

  it("writes change log with header info", async () => {
    setHeaders({ "user-agent": "Chrome Linux", "x-real-ip": "2.2.2.2" });
    prismaMock.tblDBChangeLog.create.mockResolvedValue({});
    await createChangeLogAction("tblA", "delete", "delete from tblA");
    expect(prismaMock.tblDBChangeLog.create).toHaveBeenCalledWith({
      data: {
        Computername: "2.2.2.2-Chrome-Linux",
        Tablename: "tblA",
        Changetype: "delete",
        Command: "delete from tblA",
        Zeitstempel: expect.any(Date),
      },
    });
  });

  it("swallows database errors", async () => {
    setHeaders({});
    prismaMock.tblDBChangeLog.create.mockRejectedValue(new Error("fail"));
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(createChangeLogAction("t", "c", "s")).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
