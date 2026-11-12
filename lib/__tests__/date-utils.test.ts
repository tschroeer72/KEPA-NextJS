import { toUTCDate, fromUTCDate, formatLocalDate } from "../date-utils";

describe("toUTCDate", () => {
  it.each([[null], [undefined], [""], ["not a date"], [new Date("invalid")]])("returns null for %p", (v) => {
    expect(toUTCDate(v as any)).toBeNull();
  });

  it("keeps local Y/M/D as UTC midnight for a Date", () => {
    expect(toUTCDate(new Date(2024, 2, 5, 23, 59, 59))).toEqual(new Date(Date.UTC(2024, 2, 5)));
  });

  it("accepts local-time strings and timestamps", () => {
    expect(toUTCDate("2024-03-05T10:00:00")).toEqual(new Date(Date.UTC(2024, 2, 5)));
    expect(toUTCDate(new Date(2024, 11, 31, 12).getTime())).toEqual(new Date(Date.UTC(2024, 11, 31)));
  });

  it("treats 0 as valid epoch timestamp", () => {
    const d = new Date(0);
    expect(toUTCDate(0)).toEqual(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
  });
});

describe("fromUTCDate", () => {
  it.each([[null], [undefined], [""], [0], ["garbage"]])("returns null for %p", (v) => {
    expect(fromUTCDate(v as any)).toBeNull();
  });

  it("converts UTC midnight into local midnight of the same date", () => {
    expect(fromUTCDate(new Date(Date.UTC(2024, 0, 15)))).toEqual(new Date(2024, 0, 15, 0, 0, 0, 0));
  });

  it("round-trips with toUTCDate", () => {
    const local = new Date(2023, 6, 9, 15, 30);
    expect(fromUTCDate(toUTCDate(local))).toEqual(new Date(2023, 6, 9));
  });
});

describe("formatLocalDate", () => {
  it("formats in de-DE", () => {
    expect(formatLocalDate(new Date(2024, 0, 5))).toBe(new Date(2024, 0, 5).toLocaleDateString("de-DE"));
    expect(formatLocalDate(new Date(2024, 0, 5))).toContain("2024");
  });
  it("accepts strings and timestamps", () => {
    expect(formatLocalDate(new Date(2024, 11, 24).getTime())).toBe(new Date(2024, 11, 24).toLocaleDateString("de-DE"));
    expect(formatLocalDate("2024-02-03T12:00:00")).toBe(new Date(2024, 1, 3, 12).toLocaleDateString("de-DE"));
  });
});
