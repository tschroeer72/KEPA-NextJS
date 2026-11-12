import { saveEingabeAction } from "../save-eingabe";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    $transaction: jest.fn(),
  },
}));

const prismaMock = prisma as any;

const MODELS = [
  "tbl9erRatten",
  "tblSpiel6TageRennen",
  "tblSpielPokal",
  "tblSpielSargKegeln",
  "tblSpielMeisterschaft",
  "tblSpielBlitztunier",
  "tblSpielKombimeisterschaft",
];

function makeTx() {
  const tx: any = {
    tblSpieltag: { findFirst: jest.fn(), create: jest.fn() },
    tblDBChangeLog: { create: jest.fn().mockResolvedValue({}) },
  };
  for (const m of MODELS) {
    tx[m] = {
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ ID: 99 }),
      update: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    };
  }
  return tx;
}

const DATE = new Date(2024, 0, 15);
const RUECK = "Rückrunde";
let tx: any;

function logs(type?: string) {
  const all = tx.tblDBChangeLog.create.mock.calls.map((c: any) => c[0].data);
  return type ? all.filter((d: any) => d.Changetype === type) : all;
}

describe("saveEingabeAction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    tx = makeTx();
    tx.tblSpieltag.findFirst.mockResolvedValue({ ID: 5 });
    prismaMock.$transaction.mockImplementation(async (cb: any) => cb(tx));
  });

  describe("Spieltag", () => {
    it("returns error for invalid date and does not touch Spieltag", async () => {
      const res = await saveEingabeAction(1, new Date("invalid"), "pokal", []);
      expect(res.success).toBe(false);
      expect((res as any).error).toContain("Spieldatum");
      expect(tx.tblSpieltag.findFirst).not.toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/verwaltung/eingabe");
    });

    it("does not delete rows when the date is invalid", async () => {
      const res = await saveEingabeAction(1, new Date("invalid"), "pokal", [], [1, 2]);
      expect(res.success).toBe(false);
      expect(prismaMock.$transaction).not.toHaveBeenCalled();
      expect(tx.tblSpielPokal.deleteMany).not.toHaveBeenCalled();
    });

    it("uses existing Spieltag without creating one", async () => {
      const res = await saveEingabeAction(1, DATE, "pokal", []);
      expect(res).toEqual({ success: true });
      expect(tx.tblSpieltag.create).not.toHaveBeenCalled();
      expect(tx.tblSpieltag.findFirst).toHaveBeenCalledWith({
        where: { MeisterschaftsID: 1, Spieltag: new Date(Date.UTC(2024, 0, 15)) },
      });
    });

    it("creates Spieltag and logs insert when missing", async () => {
      tx.tblSpieltag.findFirst.mockResolvedValue(null);
      tx.tblSpieltag.create.mockResolvedValue({ ID: 77 });
      await saveEingabeAction(3, DATE, "pokal", [{ SpielerID: 1, Platzierung: 1 }]);
      expect(tx.tblSpieltag.create).toHaveBeenCalledWith({
        data: { MeisterschaftsID: 3, Spieltag: new Date(Date.UTC(2024, 0, 15)), InBearbeitung: true },
      });
      const l = logs("insert")[0];
      expect(l.Tablename).toBe("tblSpieltag");
      expect(l.Command).toContain("values(77, 3, '20240115', 0)");
      expect(tx.tblSpielPokal.findFirst).toHaveBeenCalledWith({ where: { SpieltagID: 77, SpielerID: 1 } });
    });

    it("does nothing for unknown game type but succeeds", async () => {
      const res = await saveEingabeAction(1, DATE, "unbekannt", [], [1, 2]);
      expect(res).toEqual({ success: true });
      for (const m of MODELS) expect(tx[m].create).not.toHaveBeenCalled();
      expect(tx.tblDBChangeLog.create).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("returns success false when transaction rejects", async () => {
      prismaMock.$transaction.mockRejectedValue(new Error("Tx Error"));
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const res = await saveEingabeAction(1, DATE, "pokal", []);
      spy.mockRestore();
      expect(res.success).toBe(false);
      expect((res as any).error).toContain("Tx Error");
      expect(revalidatePath).toHaveBeenCalledWith("/verwaltung/eingabe");
    });

    it("returns success false when a create fails inside the transaction", async () => {
      tx.tblSpielPokal.create.mockRejectedValue(new Error("create failed"));
      const spy = jest.spyOn(console, "error").mockImplementation(() => {});
      const res = await saveEingabeAction(1, DATE, "pokal", [{ SpielerID: 1, Platzierung: 1 }]);
      spy.mockRestore();
      expect(res.success).toBe(false);
      expect((res as any).error).toContain("create failed");
    });
  });

  describe("deletedIds", () => {
    const cases: [string, string][] = [
      ["9er-ratten-kranz8", "tbl9erRatten"],
      ["6-tage-rennen", "tblSpiel6TageRennen"],
      ["pokal", "tblSpielPokal"],
      ["sargkegeln", "tblSpielSargKegeln"],
      ["meisterschaft", "tblSpielMeisterschaft"],
      ["blitztunier", "tblSpielBlitztunier"],
      ["kombimeisterschaft", "tblSpielKombimeisterschaft"],
    ];

    it.each(cases)("%s: deletes rows and logs each delete", async (spiel, table) => {
      const res = await saveEingabeAction(1, DATE, spiel, [], [4, 5]);
      expect(res).toEqual({ success: true });
      expect(tx[table].deleteMany).toHaveBeenCalledWith({ where: { ID: { in: [4, 5] } } });
      const del = logs("delete");
      expect(del).toHaveLength(2);
      expect(del[0]).toMatchObject({
        Tablename: table,
        Command: `delete from ${table} where ID = 4`,
        Computername: "Server",
      });
      expect(del[1].Command).toBe(`delete from ${table} where ID = 5`);
    });

    it("does not delete when list is empty", async () => {
      await saveEingabeAction(1, DATE, "pokal", [], []);
      expect(tx.tblSpielPokal.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe("9er-ratten-kranz8", () => {
    const item = { SpielerID: 2, Neuner: 3, Ratten: 1, Kranz8: 2 };

    it("inserts new entry and logs", async () => {
      const res = await saveEingabeAction(1, DATE, "9er-ratten-kranz8", [item]);
      expect(res).toEqual({ success: true });
      expect(tx.tbl9erRatten.findFirst).toHaveBeenCalledWith({ where: { SpieltagID: 5, SpielerID: 2 } });
      expect(tx.tbl9erRatten.create).toHaveBeenCalledWith({
        data: { SpieltagID: 5, SpielerID: 2, Neuner: 3, Ratten: 1, Kranzacht: 2 },
      });
      expect(logs("insert")[0]).toMatchObject({ Tablename: "tbl9erRatten" });
      expect(logs("insert")[0].Command).toContain("values (99, 5, 2, 3, 1, 2)");
    });

    it("looks up by ID when given and updates changed values", async () => {
      tx.tbl9erRatten.findUnique.mockResolvedValue({ ID: 8, Neuner: 0, Ratten: 0, Kranzacht: 0 });
      await saveEingabeAction(1, DATE, "9er-ratten-kranz8", [{ ...item, ID: 8 }]);
      expect(tx.tbl9erRatten.findUnique).toHaveBeenCalledWith({ where: { ID: 8 } });
      expect(tx.tbl9erRatten.update).toHaveBeenCalledWith({
        where: { ID: 8 },
        data: { Neuner: 3, Ratten: 1, Kranzacht: 2 },
      });
      expect(logs("update")[0].Command).toBe("update tbl9erRatten set Neuner = 3, Ratten = 1, Kranzacht = 2 where ID = 8");
    });

    it("skips update and log when unchanged", async () => {
      tx.tbl9erRatten.findFirst.mockResolvedValue({ ID: 8, Neuner: 3, Ratten: 1, Kranzacht: 2 });
      await saveEingabeAction(1, DATE, "9er-ratten-kranz8", [item]);
      expect(tx.tbl9erRatten.update).not.toHaveBeenCalled();
      expect(tx.tbl9erRatten.create).not.toHaveBeenCalled();
      expect(tx.tblDBChangeLog.create).not.toHaveBeenCalled();
    });

    it("updates when only Kranz8 changed", async () => {
      tx.tbl9erRatten.findFirst.mockResolvedValue({ ID: 8, Neuner: 3, Ratten: 1, Kranzacht: 0 });
      await saveEingabeAction(1, DATE, "9er-ratten-kranz8", [item]);
      expect(tx.tbl9erRatten.update).toHaveBeenCalled();
    });

    it("processes multiple items", async () => {
      await saveEingabeAction(1, DATE, "9er-ratten-kranz8", [item, { ...item, SpielerID: 3 }]);
      expect(tx.tbl9erRatten.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("6-tage-rennen", () => {
    const item = { Spieler1ID: 1, Spieler2ID: 2, Runden: 10, Punkte: 20, Spielnr: 3 };

    it("inserts and logs", async () => {
      await saveEingabeAction(1, DATE, "6-tage-rennen", [item]);
      expect(tx.tblSpiel6TageRennen.findFirst).toHaveBeenCalledWith({
        where: { SpieltagID: 5, SpielerID1: 1, SpielerID2: 2 },
      });
      expect(tx.tblSpiel6TageRennen.create).toHaveBeenCalledWith({
        data: { SpieltagID: 5, SpielerID1: 1, SpielerID2: 2, Runden: 10, Punkte: 20, Spielnummer: 3 },
      });
      expect(logs("insert")[0].Tablename).toBe("tblSpiel6TageRennen");
    });

    it("accepts null Spielnr", async () => {
      await saveEingabeAction(1, DATE, "6-tage-rennen", [{ ...item, Spielnr: null }]);
      expect(tx.tblSpiel6TageRennen.create.mock.calls[0][0].data.Spielnummer).toBeNull();
    });

    it("updates by ID when changed", async () => {
      tx.tblSpiel6TageRennen.findUnique.mockResolvedValue({ ID: 4, Runden: 1, Punkte: 1, Spielnummer: 1 });
      await saveEingabeAction(1, DATE, "6-tage-rennen", [{ ...item, ID: 4 }]);
      expect(tx.tblSpiel6TageRennen.update).toHaveBeenCalledWith({
        where: { ID: 4 },
        data: { Runden: 10, Punkte: 20, Spielnummer: 3 },
      });
      expect(logs("update")[0].Tablename).toBe("tblSpiel6TageRennen");
    });

    it("does nothing when unchanged", async () => {
      tx.tblSpiel6TageRennen.findFirst.mockResolvedValue({ ID: 4, Runden: 10, Punkte: 20, Spielnummer: 3 });
      await saveEingabeAction(1, DATE, "6-tage-rennen", [item]);
      expect(tx.tblSpiel6TageRennen.update).not.toHaveBeenCalled();
      expect(tx.tblDBChangeLog.create).not.toHaveBeenCalled();
    });
  });

  describe.each([
    ["pokal", "tblSpielPokal"],
    ["sargkegeln", "tblSpielSargKegeln"],
  ])("%s", (spiel, table) => {
    const item = { SpielerID: 7, Platzierung: 2 };

    it("inserts and logs", async () => {
      await saveEingabeAction(1, DATE, spiel, [item]);
      expect(tx[table].create).toHaveBeenCalledWith({ data: { SpieltagID: 5, SpielerID: 7, Platzierung: 2 } });
      expect(logs("insert")[0]).toMatchObject({ Tablename: table });
      expect(logs("insert")[0].Command).toContain(`insert into ${table}`);
    });

    it("updates by ID when Platzierung changed", async () => {
      tx[table].findUnique.mockResolvedValue({ ID: 3, Platzierung: 1 });
      await saveEingabeAction(1, DATE, spiel, [{ ...item, ID: 3 }]);
      expect(tx[table].update).toHaveBeenCalledWith({ where: { ID: 3 }, data: { Platzierung: 2 } });
      expect(logs("update")[0].Command).toBe(`update ${table} set Platzierung = 2 where ID = 3`);
    });

    it("does nothing when unchanged", async () => {
      tx[table].findFirst.mockResolvedValue({ ID: 3, Platzierung: 2 });
      await saveEingabeAction(1, DATE, spiel, [item]);
      expect(tx[table].update).not.toHaveBeenCalled();
      expect(tx.tblDBChangeLog.create).not.toHaveBeenCalled();
    });
  });

  describe("meisterschaft", () => {
    const item = { Spieler1ID: 1, Spieler2ID: 2, Wert1: 100, Wert2: 90, HinRueckrunde: "Hinrunde" };

    it("inserts with Hinrunde = 0", async () => {
      await saveEingabeAction(1, DATE, "meisterschaft", [item]);
      expect(tx.tblSpielMeisterschaft.findFirst).toHaveBeenCalledWith({
        where: { SpieltagID: 5, SpielerID1: 1, SpielerID2: 2, HinRueckrunde: 0 },
      });
      expect(tx.tblSpielMeisterschaft.create).toHaveBeenCalledWith({
        data: { SpieltagID: 5, SpielerID1: 1, SpielerID2: 2, HolzSpieler1: 100, HolzSpieler2: 90, HinRueckrunde: 0 },
      });
      expect(logs("insert")[0].Tablename).toBe("tblSpielMeisterschaft");
    });

    it("maps Rueckrunde to 1", async () => {
      await saveEingabeAction(1, DATE, "meisterschaft", [{ ...item, HinRueckrunde: RUECK }]);
      expect(tx.tblSpielMeisterschaft.create.mock.calls[0][0].data.HinRueckrunde).toBe(1);
    });

    it("updates when values differ", async () => {
      tx.tblSpielMeisterschaft.findUnique.mockResolvedValue({ ID: 6, HolzSpieler1: 1, HolzSpieler2: 90, HinRueckrunde: 0 });
      await saveEingabeAction(1, DATE, "meisterschaft", [{ ...item, ID: 6 }]);
      expect(tx.tblSpielMeisterschaft.update).toHaveBeenCalledWith({
        where: { ID: 6 },
        data: { HolzSpieler1: 100, HolzSpieler2: 90, HinRueckrunde: 0 },
      });
      expect(logs("update")[0].Command).toContain("where ID = 6");
    });

    it("updates when only round changed", async () => {
      tx.tblSpielMeisterschaft.findUnique.mockResolvedValue({ ID: 6, HolzSpieler1: 100, HolzSpieler2: 90, HinRueckrunde: 1 });
      await saveEingabeAction(1, DATE, "meisterschaft", [{ ...item, ID: 6 }]);
      expect(tx.tblSpielMeisterschaft.update).toHaveBeenCalled();
    });

    it("does nothing when unchanged", async () => {
      tx.tblSpielMeisterschaft.findFirst.mockResolvedValue({ ID: 6, HolzSpieler1: 100, HolzSpieler2: 90, HinRueckrunde: 0 });
      await saveEingabeAction(1, DATE, "meisterschaft", [item]);
      expect(tx.tblSpielMeisterschaft.update).not.toHaveBeenCalled();
      expect(tx.tblDBChangeLog.create).not.toHaveBeenCalled();
    });
  });

  describe("blitztunier", () => {
    const item = { Spieler1ID: 1, Spieler2ID: 2, Wert1: 5, Wert2: 3, HinRueckrunde: "Hinrunde" };

    it("inserts and logs", async () => {
      await saveEingabeAction(1, DATE, "blitztunier", [item]);
      expect(tx.tblSpielBlitztunier.findFirst).toHaveBeenCalledWith({
        where: { SpieltagID: 5, SpielerID1: 1, SpielerID2: 2, HinR_ckrunde: 0 },
      });
      expect(tx.tblSpielBlitztunier.create).toHaveBeenCalledWith({
        data: { SpieltagID: 5, SpielerID1: 1, SpielerID2: 2, PunkteSpieler1: 5, PunkteSpieler2: 3, HinR_ckrunde: 0 },
      });
      expect(logs("insert")[0].Tablename).toBe("tblSpielBlitztunier");
    });

    it("maps Rueckrunde to 1", async () => {
      await saveEingabeAction(1, DATE, "blitztunier", [{ ...item, HinRueckrunde: RUECK }]);
      expect(tx.tblSpielBlitztunier.create.mock.calls[0][0].data.HinR_ckrunde).toBe(1);
    });

    it("updates when changed", async () => {
      tx.tblSpielBlitztunier.findUnique.mockResolvedValue({ ID: 2, PunkteSpieler1: 0, PunkteSpieler2: 3, HinR_ckrunde: 0 });
      await saveEingabeAction(1, DATE, "blitztunier", [{ ...item, ID: 2 }]);
      expect(tx.tblSpielBlitztunier.update).toHaveBeenCalledWith({
        where: { ID: 2 },
        data: { PunkteSpieler1: 5, PunkteSpieler2: 3, HinR_ckrunde: 0 },
      });
      expect(logs("update")[0].Tablename).toBe("tblSpielBlitztunier");
    });

    it("does nothing when unchanged", async () => {
      tx.tblSpielBlitztunier.findFirst.mockResolvedValue({ ID: 2, PunkteSpieler1: 5, PunkteSpieler2: 3, HinR_ckrunde: 0 });
      await saveEingabeAction(1, DATE, "blitztunier", [item]);
      expect(tx.tblSpielBlitztunier.update).not.toHaveBeenCalled();
      expect(tx.tblDBChangeLog.create).not.toHaveBeenCalled();
    });
  });

  describe("kombimeisterschaft", () => {
    const item = {
      Spieler1ID: 1, Spieler2ID: 2, S1_3bis8: 10, S1_5K: 11, S2_3bis8: 12, S2_5K: 13, HinRueckrunde: RUECK,
    };
    const same = {
      ID: 9, Spieler1Punkte3bis8: 10, Spieler1Punkte5Kugeln: 11, Spieler2Punkte3bis8: 12, Spieler2Punkte5Kugeln: 13, HinRueckrunde: 1,
    };

    it("inserts and logs", async () => {
      await saveEingabeAction(1, DATE, "kombimeisterschaft", [item]);
      expect(tx.tblSpielKombimeisterschaft.findFirst).toHaveBeenCalledWith({
        where: { SpieltagID: 5, SpielerID1: 1, SpielerID2: 2, HinRueckrunde: 1 },
      });
      expect(tx.tblSpielKombimeisterschaft.create).toHaveBeenCalledWith({
        data: {
          SpieltagID: 5, SpielerID1: 1, SpielerID2: 2,
          Spieler1Punkte3bis8: 10, Spieler1Punkte5Kugeln: 11,
          Spieler2Punkte3bis8: 12, Spieler2Punkte5Kugeln: 13, HinRueckrunde: 1,
        },
      });
      expect(logs("insert")[0].Tablename).toBe("tblSpielKombimeisterschaft");
    });

    it.each([
      ["Spieler1Punkte3bis8"],
      ["Spieler1Punkte5Kugeln"],
      ["Spieler2Punkte3bis8"],
      ["Spieler2Punkte5Kugeln"],
      ["HinRueckrunde"],
    ])("updates when %s differs", async (field) => {
      tx.tblSpielKombimeisterschaft.findUnique.mockResolvedValue({ ...same, [field]: 99 });
      await saveEingabeAction(1, DATE, "kombimeisterschaft", [{ ...item, ID: 9 }]);
      expect(tx.tblSpielKombimeisterschaft.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { ID: 9 } })
      );
      expect(logs("update")[0].Command).toContain("where ID = 9");
    });

    it("does nothing when unchanged", async () => {
      tx.tblSpielKombimeisterschaft.findFirst.mockResolvedValue(same);
      await saveEingabeAction(1, DATE, "kombimeisterschaft", [item]);
      expect(tx.tblSpielKombimeisterschaft.update).not.toHaveBeenCalled();
      expect(tx.tblDBChangeLog.create).not.toHaveBeenCalled();
    });
  });
});
