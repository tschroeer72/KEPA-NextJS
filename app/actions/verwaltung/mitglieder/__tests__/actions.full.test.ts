import * as actions from "../actions";
import { prisma } from "@/lib/prisma";
import { createChangeLogAction } from "@/utils/change-log-action";
import { revalidatePath } from "next/cache";

jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/headers", () => ({ headers: jest.fn(() => ({ get: jest.fn() })) }));
jest.mock("@/utils/change-log-action", () => ({ createChangeLogAction: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tblMitglieder: { findMany: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn() },
    $queryRawUnsafe: jest.fn(),
  },
}));

const p = prisma as any;
const log = createChangeLogAction as jest.Mock;
const reval = revalidatePath as jest.Mock;
const boom = new Error("boom");

const D = (s: string) => new Date(s);

describe("Mitglieder Actions (full)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  describe("getMitglieder", () => {
    it("returns data with select/order", async () => {
      p.tblMitglieder.findMany.mockResolvedValue([{ ID: 1 }]);
      expect(await actions.getMitglieder()).toEqual({ success: true, data: [{ ID: 1 }] });
      expect(p.tblMitglieder.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { ID: "desc" } }));
    });
    it("error", async () => {
      p.tblMitglieder.findMany.mockRejectedValue(boom);
      expect(await actions.getMitglieder()).toEqual({ success: false, error: "Fehler beim Abrufen der Mitglieder" });
    });
  });

  describe.each([
    ["getAktiveMitglieder", "Fehler beim Abrufen der aktiven Mitglieder", "Ehemaliger = 0"],
    ["getAlleMitglieder", "Fehler beim Abrufen aller Mitglieder", "ORDER BY Nachname"],
  ] as const)("%s", (fn, errMsg, sqlPart) => {
    it("transforms rows: names, defaults, dates", async () => {
      p.$queryRawUnsafe.mockResolvedValue([
        {
          ID: 1, Vorname: "A", Nachname: "B", Spitzname: "Ab", Strasse: "S", PLZ: "1", Ort: "O",
          Geburtsdatum: D("1980-01-02T00:00:00.000Z"), MitgliedSeit: D("2000-01-01T00:00:00.000Z"),
          PassivSeit: D("2010-05-05T00:00:00.000Z"), AusgeschiedenAm: D("2020-06-06T00:00:00.000Z"),
          EMail: "e@x.de", TelefonMobil: "1", TelefonPrivat: "2",
        },
        { ID: 2, Vorname: "C", Nachname: "D", Geburtsdatum: null, MitgliedSeit: D("x"), PassivSeit: "str", AusgeschiedenAm: undefined },
      ]);
      const r: any = await (actions as any)[fn]();
      expect(r.success).toBe(true);
      expect(p.$queryRawUnsafe.mock.calls[0][0]).toContain(sqlPart);
      expect(r.data[0]).toEqual({
        ID: 1, Anzeigename: 'A "Ab" B', Vorname: "A", Nachname: "B", Spitzname: "Ab", Strasse: "S", PLZ: "1", Ort: "O",
        Geburtsdatum: "1980-01-02T00:00:00.000Z", MitgliedSeit: "2000-01-01T00:00:00.000Z",
        PassivSeit: "2010-05-05T00:00:00.000Z", AusgeschiedenAm: "2020-06-06T00:00:00.000Z",
        EMail: "e@x.de", TelefonMobil: "1", TelefonPrivat: "2",
      });
      expect(r.data[1]).toEqual({
        ID: 2, Anzeigename: "C D", Vorname: "C", Nachname: "D", Spitzname: "", Strasse: "", PLZ: "", Ort: "",
        Geburtsdatum: null, MitgliedSeit: null, PassivSeit: null, AusgeschiedenAm: null,
        EMail: "", TelefonMobil: "", TelefonPrivat: "",
      });
    });
    it("empty result", async () => {
      p.$queryRawUnsafe.mockResolvedValue([]);
      expect(await (actions as any)[fn]()).toEqual({ success: true, data: [] });
    });
    it("error", async () => {
      p.$queryRawUnsafe.mockRejectedValue(boom);
      expect(await (actions as any)[fn]()).toEqual({ success: false, error: errMsg });
    });
  });

  describe("getMitgliedById", () => {
    it("serializes dates and converts Ehemaliger variants to boolean", async () => {
      const base = { ID: 7, Vorname: "A", Geburtsdatum: D("1980-01-02T00:00:00.000Z"), MitgliedSeit: D("x"), PassivSeit: null, AusgeschiedenAm: D("2020-06-06T00:00:00.000Z") };
      const cases: [any, boolean][] = [[1, true], [true, true], [Buffer.from([1]), true], [0, false], [Buffer.from([0]), false], [null, false]];
      for (const [val, exp] of cases) {
        p.$queryRawUnsafe.mockResolvedValueOnce([{ ...base, Ehemaliger: val }]);
        const r: any = await actions.getMitgliedById(7);
        expect(r.success).toBe(true);
        expect(r.data.Ehemaliger).toBe(exp);
        expect(r.data.Geburtsdatum).toBe("1980-01-02T00:00:00.000Z");
        expect(r.data.MitgliedSeit).toBeNull();
        expect(r.data.PassivSeit).toBeNull();
        expect(r.data.AusgeschiedenAm).toBe("2020-06-06T00:00:00.000Z");
      }
    });
    it("valid MitgliedSeit and PassivSeit are converted", async () => {
      p.$queryRawUnsafe.mockResolvedValue([{ ID: 1, Ehemaliger: 0, MitgliedSeit: D("2001-01-01T00:00:00.000Z"), PassivSeit: D("2002-01-01T00:00:00.000Z") }]);
      const r: any = await actions.getMitgliedById(1);
      expect(r.data.MitgliedSeit).toBe("2001-01-01T00:00:00.000Z");
      expect(r.data.PassivSeit).toBe("2002-01-01T00:00:00.000Z");
    });
    it("not found for empty or null result", async () => {
      p.$queryRawUnsafe.mockResolvedValueOnce([]);
      expect(await actions.getMitgliedById(1)).toEqual({ success: false, error: "Mitglied nicht gefunden" });
      p.$queryRawUnsafe.mockResolvedValueOnce(null);
      expect(await actions.getMitgliedById(1)).toEqual({ success: false, error: "Mitglied nicht gefunden" });
    });
    it("fails when row has no ID", async () => {
      p.$queryRawUnsafe.mockResolvedValue([{ Vorname: "x" }]);
      const r: any = await actions.getMitgliedById(1);
      expect(r.success).toBe(false);
      expect(r.error).toContain("Serialisierung fehlgeschlagen");
    });
    it("error includes message", async () => {
      p.$queryRawUnsafe.mockRejectedValue(boom);
      expect(await actions.getMitgliedById(1)).toEqual({ success: false, error: "Fehler beim Abrufen des Mitglieds: boom" });
    });
  });

  describe("createMitglied", () => {
    const row = { ID: 3, Geburtsdatum: null, MitgliedSeit: D("2024-03-04T00:00:00.000Z"), PassivSeit: D("x"), AusgeschiedenAm: D("2025-01-01T00:00:00.000Z") };

    it.each([
      [{ Nachname: "N", MitgliedSeit: "2024-03-04" }],
      [{ Vorname: "V", MitgliedSeit: "2024-03-04" }],
      [{ Vorname: "V", Nachname: "N" }],
      [{}],
    ])("rejects missing required fields %j", async (body) => {
      expect(await actions.createMitglied(body as any)).toEqual({ success: false, error: "Pflichtfelder fehlen" });
      expect(p.tblMitglieder.create).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
    });

    it("creates with defaults, converts dates, logs and revalidates", async () => {
      p.tblMitglieder.create.mockResolvedValue(row);
      const r: any = await actions.createMitglied({ Vorname: "V", Nachname: "N", MitgliedSeit: new Date(2024, 2, 4, 15, 30) } as any);
      expect(r.success).toBe(true);
      expect(r.data.MitgliedSeit).toBe("2024-03-04T00:00:00.000Z");
      expect(r.data.Geburtsdatum).toBeNull();
      expect(r.data.PassivSeit).toBeNull();
      expect(r.data.AusgeschiedenAm).toBe("2025-01-01T00:00:00.000Z");
      const data = p.tblMitglieder.create.mock.calls[0][0].data;
      expect(data).toMatchObject({
        Vorname: "V", Nachname: "N", Spitzname: "", Strasse: "", Ehemaliger: false, SpAnz: 0, HolzMax: 0, Punkte: 0,
        Geburtsdatum: null, PassivSeit: null, AusgeschiedenAm: null, Login: "", Password: "",
      });
      expect(data.MitgliedSeit.toISOString()).toBe("2024-03-04T00:00:00.000Z");
      expect(log).toHaveBeenCalledWith("tblMitglieder", "insert", expect.stringContaining("3"));
      expect(reval).toHaveBeenCalledWith("/verwaltung/mitglieder");
    });

    it("converts provided values (strings -> numbers, truthy -> boolean)", async () => {
      p.tblMitglieder.create.mockResolvedValue(row);
      await actions.createMitglied({
        Vorname: "V", Nachname: "N", MitgliedSeit: "2024-03-04T10:00:00", Geburtsdatum: "1990-05-06T10:00:00",
        Ehemaliger: 1, SpAnz: "5", HolzGes: "100", TurboDBNummer: "12", Spitzname: "Sp", Platz: "P", Login: "l", Password: "pw",
      } as any);
      const data = p.tblMitglieder.create.mock.calls[0][0].data;
      expect(data).toMatchObject({ Ehemaliger: true, SpAnz: 5, HolzGes: 100, TurboDBNummer: 12, Spitzname: "Sp", Platz: "P", Login: "l", Password: "pw" });
      expect(data.Geburtsdatum.toISOString()).toBe("1990-05-06T00:00:00.000Z");
    });

    it("falls back to today when MitgliedSeit is an unparseable (truthy) value", async () => {
      p.tblMitglieder.create.mockResolvedValue(row);
      await actions.createMitglied({ Vorname: "V", Nachname: "N", MitgliedSeit: "garbage" } as any);
      expect(p.tblMitglieder.create.mock.calls[0][0].data.MitgliedSeit).toBeInstanceOf(Date);
    });

    it("error on db failure, no log", async () => {
      p.tblMitglieder.create.mockRejectedValue(boom);
      expect(await actions.createMitglied({ Vorname: "V", Nachname: "N", MitgliedSeit: "2024-01-01" } as any)).toEqual({ success: false, error: "Fehler beim Erstellen des Mitglieds" });
      expect(log).not.toHaveBeenCalled();
      expect(reval).not.toHaveBeenCalled();
    });
  });

  describe("updateMitglied", () => {
    const row = { ID: 2, Geburtsdatum: D("1990-01-01T00:00:00.000Z"), MitgliedSeit: null, PassivSeit: D("x"), AusgeschiedenAm: D("2020-02-02T00:00:00.000Z") };

    it("maps string fields, dates, boolean and numeric fields", async () => {
      p.tblMitglieder.update.mockResolvedValue(row);
      const r: any = await actions.updateMitglied(2, {
        Vorname: "V", Nachname: null, Spitzname: 5, Login: "l",
        Geburtsdatum: "1990-01-01T09:00:00", MitgliedSeit: "2000-02-03T09:00:00", PassivSeit: null, AusgeschiedenAm: "2020-02-02T09:00:00",
        Ehemaliger: 1, SpAnz: "3", Punkte: null, TurboDBNummer: 4,
      } as any);
      expect(r.success).toBe(true);
      expect(r.data.Geburtsdatum).toBe("1990-01-01T00:00:00.000Z");
      expect(r.data.MitgliedSeit).toBeNull();
      expect(r.data.PassivSeit).toBeNull();
      expect(r.data.AusgeschiedenAm).toBe("2020-02-02T00:00:00.000Z");
      const arg = p.tblMitglieder.update.mock.calls[0][0];
      expect(arg.where).toEqual({ ID: 2 });
      expect(arg.data).toMatchObject({ Vorname: "V", Nachname: "", Spitzname: "5", Login: "l", PassivSeit: null, Ehemaliger: true, SpAnz: 3, Punkte: 0, TurboDBNummer: 4 });
      expect(arg.data.Geburtsdatum.toISOString()).toBe("1990-01-01T00:00:00.000Z");
      expect(arg.data.MitgliedSeit.toISOString()).toBe("2000-02-03T00:00:00.000Z");
      expect(arg.data.AusgeschiedenAm.toISOString()).toBe("2020-02-02T00:00:00.000Z");
      expect(log).toHaveBeenCalledWith("tblMitglieder", "update", "update tblMitglieder set ... where ID=2");
      expect(reval).toHaveBeenCalledWith("/verwaltung/mitglieder");
    });

    it("sends only provided fields (empty body -> empty data); invalid MitgliedSeit becomes undefined", async () => {
      p.tblMitglieder.update.mockResolvedValue({ ID: 2, Geburtsdatum: D("2000-01-01T00:00:00.000Z"), MitgliedSeit: D("2000-01-01T00:00:00.000Z"), PassivSeit: D("2000-01-01T00:00:00.000Z"), AusgeschiedenAm: null });
      const r: any = await actions.updateMitglied(2, {});
      expect(p.tblMitglieder.update.mock.calls[0][0].data).toEqual({});
      expect(r.data.MitgliedSeit).toBe("2000-01-01T00:00:00.000Z");
      expect(r.data.PassivSeit).toBe("2000-01-01T00:00:00.000Z");
      await actions.updateMitglied(2, { MitgliedSeit: "garbage" } as any);
      expect(p.tblMitglieder.update.mock.calls[1][0].data).toEqual({ MitgliedSeit: undefined });
    });

    it("Ehemaliger=0 becomes false", async () => {
      p.tblMitglieder.update.mockResolvedValue(row);
      await actions.updateMitglied(2, { Ehemaliger: 0 } as any);
      expect(p.tblMitglieder.update.mock.calls[0][0].data).toEqual({ Ehemaliger: false });
    });

    it("error on db failure", async () => {
      p.tblMitglieder.update.mockRejectedValue(boom);
      expect(await actions.updateMitglied(2, { Vorname: "x" })).toEqual({ success: false, error: "Fehler beim Aktualisieren des Mitglieds" });
      expect(log).not.toHaveBeenCalled();
      expect(reval).not.toHaveBeenCalled();
    });
  });

  describe("deleteMitglied", () => {
    it("deletes, logs, revalidates", async () => {
      p.tblMitglieder.delete.mockResolvedValue({});
      expect(await actions.deleteMitglied(5)).toEqual({ success: true });
      expect(p.tblMitglieder.delete).toHaveBeenCalledWith({ where: { ID: 5 } });
      expect(log).toHaveBeenCalledWith("tblMitglieder", "delete", "delete from tblMitglieder where ID=5");
      expect(reval).toHaveBeenCalledWith("/verwaltung/mitglieder");
    });
    it("error", async () => {
      p.tblMitglieder.delete.mockRejectedValue(boom);
      expect(await actions.deleteMitglied(5)).toEqual({ success: false, error: "Fehler beim Löschen des Mitglieds" });
      expect(log).not.toHaveBeenCalled();
    });
  });
});
