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
    tblMeisterschaften: {
      findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(),
      update: jest.fn(), updateMany: jest.fn(), delete: jest.fn(),
    },
    tblMeisterschaftstyp: { findMany: jest.fn(), create: jest.fn() },
    tblTeilnehmer: { findMany: jest.fn(), create: jest.fn(), updateMany: jest.fn(), deleteMany: jest.fn() },
    tblSpieltag: { findMany: jest.fn() },
    tblSpielMeisterschaft: { findFirst: jest.fn() },
    tblSpielBlitztunier: { findFirst: jest.fn() },
    tblSpielKombimeisterschaft: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const p = prisma as any;
const log = createChangeLogAction as jest.Mock;
const reval = revalidatePath as jest.Mock;
const boom = new Error("boom");

describe("Meisterschaften Actions (full)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    p.$transaction.mockImplementation(async (cb: any) => cb(p));
  });
  afterEach(() => jest.restoreAllMocks());

  describe("getMeisterschaften", () => {
    it("converts dates, nulls invalid ones, empty list ok", async () => {
      p.tblMeisterschaften.findMany.mockResolvedValue([
        { ID: 1, Beginn: new Date("2025-01-01T00:00:00.000Z"), Ende: new Date("x") },
        { ID: 2, Beginn: "2025-01-01", Ende: null },
      ]);
      const r: any = await actions.getMeisterschaften();
      expect(r.data[0]).toMatchObject({ Beginn: "2025-01-01T00:00:00.000Z", Ende: null });
      expect(r.data[1]).toMatchObject({ Beginn: null, Ende: null });
      p.tblMeisterschaften.findMany.mockResolvedValue([]);
      expect(await actions.getMeisterschaften()).toEqual({ success: true, data: [] });
    });
    it("returns error on rejection", async () => {
      p.tblMeisterschaften.findMany.mockRejectedValue(boom);
      expect(await actions.getMeisterschaften()).toEqual({ success: false, error: "Fehler beim Abrufen der Meisterschaften" });
    });
  });

  describe("getMeisterschaftById", () => {
    it("returns serialized data", async () => {
      p.tblMeisterschaften.findUnique.mockResolvedValue({ ID: 5, Beginn: new Date("2025-02-03T00:00:00.000Z"), Ende: new Date("2025-03-03T00:00:00.000Z") });
      const r: any = await actions.getMeisterschaftById(5);
      expect(r.success).toBe(true);
      expect(r.data.Beginn).toBe("2025-02-03T00:00:00.000Z");
      expect(r.data.Ende).toBe("2025-03-03T00:00:00.000Z");
      expect(p.tblMeisterschaften.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { ID: 5 } }));
    });
    it("nulls invalid dates", async () => {
      p.tblMeisterschaften.findUnique.mockResolvedValue({ ID: 5, Beginn: null, Ende: new Date("x") });
      const r: any = await actions.getMeisterschaftById(5);
      expect(r.data.Beginn).toBeNull();
      expect(r.data.Ende).toBeNull();
    });
    it("not found", async () => {
      p.tblMeisterschaften.findUnique.mockResolvedValue(null);
      expect(await actions.getMeisterschaftById(1)).toEqual({ success: false, error: "Meisterschaft nicht gefunden" });
    });
    it("error", async () => {
      p.tblMeisterschaften.findUnique.mockRejectedValue(boom);
      expect(await actions.getMeisterschaftById(1)).toEqual({ success: false, error: "Fehler beim Abrufen der Meisterschaft" });
    });
  });

  describe("createMeisterschaft", () => {
    const created = (extra = {}) => ({ ID: 1, Beginn: new Date("2025-06-15T00:00:00.000Z"), Ende: null, ...extra });

    it("creates, deactivates others when Aktiv=1, logs and revalidates", async () => {
      p.tblMeisterschaften.create.mockResolvedValue(created());
      const r: any = await actions.createMeisterschaft({
        Bezeichnung: "M1", Beginn: new Date(2025, 5, 15, 13, 45), Ende: "2025-12-24T10:00:00",
        MeisterschaftstypID: "2", TurboDBNummer: "7", Aktiv: 1, Bemerkungen: "x",
      } as any);
      expect(r.success).toBe(true);
      expect(r.data.Beginn).toBe("2025-06-15T00:00:00.000Z");
      expect(p.tblMeisterschaften.updateMany).toHaveBeenCalledWith({ where: { Aktiv: 1 }, data: { Aktiv: 0 } });
      const data = p.tblMeisterschaften.create.mock.calls[0][0].data;
      expect(data).toMatchObject({ Bezeichnung: "M1", MeisterschaftstypID: 2, TurboDBNummer: 7, Aktiv: 1, Bemerkungen: "x" });
      expect(data.Beginn.toISOString()).toBe("2025-06-15T00:00:00.000Z");
      expect(data.Ende.toISOString()).toBe("2025-12-24T00:00:00.000Z");
      expect(log).toHaveBeenCalledWith("tblMeisterschaften", "insert", expect.any(String));
      expect(reval).toHaveBeenCalledWith("/verwaltung/meisterschaften");
      expect(reval).toHaveBeenCalledWith("/verwaltung/eingabe");
      expect(reval).toHaveBeenCalledWith("/verwaltung/ausgabe");
    });

    it("applies defaults (no Beginn/Ende, inactive) and does not deactivate others", async () => {
      p.tblMeisterschaften.create.mockResolvedValue(created({ Ende: new Date("x") }));
      const r: any = await actions.createMeisterschaft({ MeisterschaftstypID: 1 } as any);
      expect(r.data.Ende).toBeNull();
      expect(p.tblMeisterschaften.updateMany).not.toHaveBeenCalled();
      const data = p.tblMeisterschaften.create.mock.calls[0][0].data;
      expect(data).toMatchObject({ Bezeichnung: "", Ende: null, TurboDBNummer: 0, Aktiv: 0, Bemerkungen: "" });
      expect(data.Beginn).toBeInstanceOf(Date);
    });

    it("serializes null result dates as null", async () => {
      p.tblMeisterschaften.create.mockResolvedValue({ ID: 1, Beginn: null, Ende: null });
      const r: any = await actions.createMeisterschaft({ MeisterschaftstypID: 1 } as any);
      expect(r.data.Beginn).toBeNull();
    });

    it("rejects invalid start date", async () => {
      const r = await actions.createMeisterschaft({ Beginn: "not-a-date", MeisterschaftstypID: 1 } as any);
      expect(r).toEqual({ success: false, error: "Ungültiges Startdatum" });
      expect(p.$transaction).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
    });

    it("returns error on db failure without logging", async () => {
      p.tblMeisterschaften.create.mockRejectedValue(boom);
      const r = await actions.createMeisterschaft({ MeisterschaftstypID: 1 } as any);
      expect(r).toEqual({ success: false, error: "Fehler beim Erstellen der Meisterschaft" });
      expect(log).not.toHaveBeenCalled();
      expect(reval).not.toHaveBeenCalled();
    });
  });

  describe("updateMeisterschaft", () => {
    const updated = { ID: 4, Beginn: new Date("2025-01-01T00:00:00.000Z"), Ende: new Date("2025-02-01T00:00:00.000Z") };

    it("maps all fields, deactivates other active ones, logs and revalidates", async () => {
      p.tblMeisterschaften.update.mockResolvedValue(updated);
      const r: any = await actions.updateMeisterschaft(4, {
        Bezeichnung: 12, Beginn: "2025-01-01T08:00:00", Ende: "2025-02-01T08:00:00", MeisterschaftstypID: "3",
        TurboDBNummer: "9", Aktiv: "1", Bemerkungen: "b",
      } as any);
      expect(r.success).toBe(true);
      expect(r.data.Ende).toBe("2025-02-01T00:00:00.000Z");
      expect(p.tblMeisterschaften.updateMany).toHaveBeenCalledWith({ where: { Aktiv: 1, ID: { not: 4 } }, data: { Aktiv: 0 } });
      const arg = p.tblMeisterschaften.update.mock.calls[0][0];
      expect(arg.where).toEqual({ ID: 4 });
      expect(arg.data).toMatchObject({ Bezeichnung: "12", MeisterschaftstypID: 3, TurboDBNummer: 9, Aktiv: 1, Bemerkungen: "b" });
      expect(log).toHaveBeenCalledWith("tblMeisterschaften", "update", expect.stringContaining("ID=4"));
      expect(reval).toHaveBeenCalledTimes(3);
    });

    it("only updates provided fields; Ende null -> null; no deactivation for Aktiv=0", async () => {
      p.tblMeisterschaften.update.mockResolvedValue({ ID: 4, Beginn: null, Ende: null });
      const r: any = await actions.updateMeisterschaft(4, { Ende: null, Aktiv: 0 } as any);
      expect(p.tblMeisterschaften.update.mock.calls[0][0].data).toEqual({ Ende: null, Aktiv: 0 });
      expect(p.tblMeisterschaften.updateMany).not.toHaveBeenCalled();
      expect(r.data.Beginn).toBeNull();
      expect(r.data.Ende).toBeNull();
    });

    it("empty body yields empty update data", async () => {
      p.tblMeisterschaften.update.mockResolvedValue(updated);
      await actions.updateMeisterschaft(4, {});
      expect(p.tblMeisterschaften.update.mock.calls[0][0].data).toEqual({});
    });

    it("rejects empty or invalid Beginn", async () => {
      expect(await actions.updateMeisterschaft(4, { Beginn: null } as any)).toEqual({ success: false, error: "Ungültiges Startdatum" });
      expect(await actions.updateMeisterschaft(4, { Beginn: "zzz" } as any)).toEqual({ success: false, error: "Ungültiges Startdatum" });
      expect(p.tblMeisterschaften.update).not.toHaveBeenCalled();
    });

    it("returns error on db failure", async () => {
      p.tblMeisterschaften.update.mockRejectedValue(boom);
      expect(await actions.updateMeisterschaft(4, { Bezeichnung: "a" })).toEqual({ success: false, error: "Fehler beim Aktualisieren der Meisterschaft" });
      expect(log).not.toHaveBeenCalled();
    });
  });

  describe("deleteMeisterschaft", () => {
    it("deletes, logs, revalidates", async () => {
      p.tblMeisterschaften.delete.mockResolvedValue({});
      expect(await actions.deleteMeisterschaft(8)).toEqual({ success: true });
      expect(p.tblMeisterschaften.delete).toHaveBeenCalledWith({ where: { ID: 8 } });
      expect(log).toHaveBeenCalledWith("tblMeisterschaften", "delete", "delete from tblMeisterschaften where ID=8");
      expect(reval).toHaveBeenCalledTimes(3);
    });
    it("error", async () => {
      p.tblMeisterschaften.delete.mockRejectedValue(boom);
      expect(await actions.deleteMeisterschaft(8)).toEqual({ success: false, error: "Fehler beim Löschen der Meisterschaft" });
      expect(log).not.toHaveBeenCalled();
    });
  });

  describe("Meisterschaftstypen", () => {
    it("get ok / error", async () => {
      p.tblMeisterschaftstyp.findMany.mockResolvedValue([{ ID: 1 }]);
      expect(await actions.getMeisterschaftstypen()).toEqual({ success: true, data: [{ ID: 1 }] });
      p.tblMeisterschaftstyp.findMany.mockRejectedValue(boom);
      expect(await actions.getMeisterschaftstypen()).toEqual({ success: false, error: "Fehler beim Abrufen der Meisterschaftstypen" });
    });
    it("create logs; error path", async () => {
      p.tblMeisterschaftstyp.create.mockResolvedValue({ ID: 2, Meisterschaftstyp: "T" });
      expect(await actions.createMeisterschaftstyp("T")).toEqual({ success: true, data: { ID: 2, Meisterschaftstyp: "T" } });
      expect(p.tblMeisterschaftstyp.create).toHaveBeenCalledWith({ data: { Meisterschaftstyp: "T" } });
      expect(log).toHaveBeenCalledWith("tblMeisterschaftstyp", "insert", expect.any(String));
      p.tblMeisterschaftstyp.create.mockRejectedValue(boom);
      expect(await actions.createMeisterschaftstyp("T")).toEqual({ success: false, error: "Fehler beim Erstellen des Meisterschaftstyps" });
    });
  });

  describe("getTeilnehmerByMeisterschaft", () => {
    it("builds display names with and without nickname", async () => {
      p.tblTeilnehmer.findMany.mockResolvedValue([
        { NurHinrunde: false, tblMitglieder: { ID: 1, Vorname: "A", Nachname: "B", Spitzname: "Ab" } },
        { NurHinrunde: true, tblMitglieder: { ID: 2, Vorname: "C", Nachname: "D", Spitzname: null } },
      ]);
      const r: any = await actions.getTeilnehmerByMeisterschaft(3);
      expect(p.tblTeilnehmer.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { MeisterschaftsID: 3 } }));
      expect(r.data).toEqual([
        { ID: 1, Anzeigename: 'A "Ab" B', Vorname: "A", Nachname: "B", Spitzname: "Ab", NurHinrunde: false },
        { ID: 2, Anzeigename: "C D", Vorname: "C", Nachname: "D", Spitzname: "", NurHinrunde: true },
      ]);
    });
    it("empty and error", async () => {
      p.tblTeilnehmer.findMany.mockResolvedValue([]);
      expect(await actions.getTeilnehmerByMeisterschaft(3)).toEqual({ success: true, data: [] });
      p.tblTeilnehmer.findMany.mockRejectedValue(boom);
      expect(await actions.getTeilnehmerByMeisterschaft(3)).toEqual({ success: false, error: "Fehler beim Abrufen der Teilnehmer" });
    });
  });

  describe("addTeilnehmer", () => {
    it("creates, logs, revalidates", async () => {
      p.tblTeilnehmer.create.mockResolvedValue({ ID: 1 });
      expect(await actions.addTeilnehmer(3, 9)).toEqual({ success: true, data: { ID: 1 } });
      expect(p.tblTeilnehmer.create).toHaveBeenCalledWith({ data: { MeisterschaftsID: 3, SpielerID: 9 } });
      expect(log).toHaveBeenCalledWith("tblTeilnehmer", "insert", expect.any(String));
      expect(reval).toHaveBeenCalledTimes(3);
    });
    it("error", async () => {
      p.tblTeilnehmer.create.mockRejectedValue(boom);
      expect(await actions.addTeilnehmer(3, 9)).toEqual({ success: false, error: "Fehler beim Hinzufügen des Teilnehmers" });
      expect(log).not.toHaveBeenCalled();
    });
  });

  describe("removeTeilnehmer", () => {
    const tables = ["tblSpielMeisterschaft", "tblSpielBlitztunier", "tblSpielKombimeisterschaft"];

    it("deletes when there are no spieltage", async () => {
      p.tblSpieltag.findMany.mockResolvedValue([]);
      expect(await actions.removeTeilnehmer(3, 9)).toEqual({ success: true, action: "deleted" });
      expect(p.tblSpielMeisterschaft.findFirst).not.toHaveBeenCalled();
      expect(p.tblTeilnehmer.deleteMany).toHaveBeenCalledWith({ where: { MeisterschaftsID: 3, SpielerID: 9 } });
      expect(log).toHaveBeenCalledWith("tblTeilnehmer", "delete", expect.any(String));
      expect(reval).toHaveBeenCalledTimes(3);
    });
    it("deletes when spieltage exist but player has no games", async () => {
      p.tblSpieltag.findMany.mockResolvedValue([{ ID: 1 }, { ID: 2 }]);
      tables.forEach((t) => p[t].findFirst.mockResolvedValue(null));
      expect(((await actions.removeTeilnehmer(3, 9)) as any).action).toBe("deleted");
      expect(p.tblSpielMeisterschaft.findFirst).toHaveBeenCalledWith({
        where: { SpieltagID: { in: [1, 2] }, OR: [{ SpielerID1: 9 }, { SpielerID2: 9 }] },
      });
    });
    it.each(tables)("marks NurHinrunde instead of deleting when a game exists in %s", async (table) => {
      p.tblSpieltag.findMany.mockResolvedValue([{ ID: 1 }]);
      tables.forEach((t) => p[t].findFirst.mockResolvedValue(t === table ? { ID: 1 } : null));
      expect(await actions.removeTeilnehmer(3, 9)).toEqual({ success: true, action: "marked" });
      expect(p.tblTeilnehmer.updateMany).toHaveBeenCalledWith({
        where: { MeisterschaftsID: 3, SpielerID: 9 }, data: { NurHinrunde: true },
      });
      expect(p.tblTeilnehmer.deleteMany).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith("tblTeilnehmer", "update", expect.any(String));
      expect(reval).toHaveBeenCalledWith("/verwaltung/meisterschaften");
    });
    it("error", async () => {
      p.tblSpieltag.findMany.mockRejectedValue(boom);
      expect(await actions.removeTeilnehmer(3, 9)).toEqual({ success: false, error: "Fehler beim Entfernen des Teilnehmers" });
    });
  });

  describe("updateTeilnehmerNurHinrunde", () => {
    it.each([true, false])("updates flag %s and logs", async (flag) => {
      expect(await actions.updateTeilnehmerNurHinrunde(3, 9, flag)).toEqual({ success: true });
      expect(p.tblTeilnehmer.updateMany).toHaveBeenCalledWith({ where: { MeisterschaftsID: 3, SpielerID: 9 }, data: { NurHinrunde: flag } });
      expect(log).toHaveBeenCalledWith("tblTeilnehmer", "update", expect.stringContaining(`NurHinrunde=${flag}`));
    });
    it("error", async () => {
      p.tblTeilnehmer.updateMany.mockRejectedValue(boom);
      expect(await actions.updateTeilnehmerNurHinrunde(3, 9, true)).toEqual({ success: false, error: "Fehler beim Aktualisieren des NurHinrunde-Flags" });
    });
  });
});
