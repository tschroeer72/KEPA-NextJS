/**
 * @jest-environment node
 */
import { getComputerInfo } from "../get-computer-info";

function req(h: Record<string, string>) {
  return { headers: new Headers(h) } as any;
}

describe("getComputerInfo", () => {
  it("falls back to unknown values without headers", () => {
    expect(getComputerInfo(req({}))).toBe("Unknown IP-Unknown-Unknown OS");
  });

  it("uses first x-forwarded-for entry", () => {
    expect(getComputerInfo(req({ "x-forwarded-for": "1.1.1.1, 2.2.2.2", "x-real-ip": "3.3.3.3" }))).toMatch(/^1\.1\.1\.1-/);
  });

  it("uses x-real-ip when no forwarded header", () => {
    expect(getComputerInfo(req({ "x-real-ip": "3.3.3.3" }))).toMatch(/^3\.3\.3\.3-/);
  });

  it.each([
    ["Mozilla/5.0 (Windows NT 10.0; Win64) Chrome/120 Safari/537", "Chrome", "Windows 10/11"],
    ["Mozilla/5.0 (Windows NT 6.3) Firefox/100", "Firefox", "Windows 8.1"],
    ["Mozilla/5.0 (Windows NT 6.1) Safari/600", "Safari", "Windows 7"],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X) Safari/600", "Safari", "macOS"],
    ["Mozilla/5.0 (X11; Linux x86_64) Firefox/100", "Firefox", "Linux"],
    ["Mozilla/5.0 (Android 12) Edge/100", "Edge", "Android"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 16) Foo/1", "Unknown", "iOS"],
    ["curl/8.0", "Unknown", "Unknown OS"],
  ])("parses %s", (ua, browser, os) => {
    expect(getComputerInfo(req({ "user-agent": ua, "x-real-ip": "9.9.9.9" }))).toBe(`9.9.9.9-${browser}-${os}`);
  });
});
