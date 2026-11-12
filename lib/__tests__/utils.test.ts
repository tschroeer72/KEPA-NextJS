import { cn } from "../utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("ignores falsy values and supports conditionals/objects/arrays", () => {
    expect(cn("a", false, null, undefined, { b: true, c: false }, ["d"])).toBe("a b d");
  });
  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("p-2 text-red-500", "p-4", "text-blue-500")).toBe("p-4 text-blue-500");
  });
  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
