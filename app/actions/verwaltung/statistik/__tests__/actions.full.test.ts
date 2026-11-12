import * as actions from "../actions";
import { prisma } from "@/lib/prisma";
import { getCurrentMeisterschaft } from "@/app/actions/settings/get-current-meisterschaft";

jest.mock("@/app/actions/settings/get-current-meisterschaft", () => ({ getCurrentMeisterschaft: jest.fn() }));
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    tbl9erRatten: { findMany: jest.fn() },
    tblMeisterschaften: { findFirst: jest.fn() },
    tblSpielPokal: { findMany: jest.fn() },
    tblSpielSargKegeln: { findMany: jest.fn() },
    tblMitglieder: { findMany: jest.fn() },
    tblSpielMeisterschaft: { findMany: jest.fn() },
    tblSpielBlitztunier: { findMany: jest.fn() },
    tblSpielKombimeisterschaft: { findMany: jest.fn() },
    tblSpiel6TageRennen: { findMany: jest.fn() },
    tblSpieltag: { findMany: jest.fn() },
  },
}));

const p = prisma as any;
const cur = getCurrentMeisterschaft as jest.Mock;

const M = (id: number, Nachname: string, Vorname: string) => ({ ID: id, Nachname, Vorname });
const von = new Date("2025-01-01T00:00:00.000Z");
const bis = new Date("2025-12-31T00:00:00.000Z");

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

// Functions sharing the zeitbereich -> where clause logic, with the model used for the main query
const filterFns: [string, string, any[]][] = [
  ["getStatistik9er", "tbl9erRatten", []],
  ["getStatistikRatten", "tbl9erRatten", []],
  ["getStatistikPokal", "tblSpielPokal", []],
  ["getStatistikSarg", "tblSpielSargKegeln", []],
  ["getStatistik6TageRennenPlatz", "tblSpiel6TageRennen", []],
  ["getStatistik6TageRennenBesteMannschaft", "tblSpiel6TageRennen", []],
];

describe.each(filterFns)("%s zeitbereich handling", (fn, model) => {
  const run = (...args: any[]) => (actions as any)[fn](...args);
  const whereOf = () => p[model].findMany.mock.calls[0][0].where;

  beforeEach(() => p[model].findMany.mockResolvedValue([]));

  it("0: no filter, empty data -> empty array", async () => {
    expect(await run(0)).toEqual([]);
    expect(whereOf()).toEqual({});
  });
  it("1: filters on active meisterschaft", async () => {
    cur.mockResolvedValue("12");
    await run(1);
    expect(whereOf()).toEqual({ tblSpieltag: { MeisterschaftsID: 12 } });
  });
  it("1: no active meisterschaft -> no filter", async () => {
    cur.mockResolvedValue(null);
    await run(1);
    expect(whereOf()).toEqual({});
  });
  it("2: filters on previous meisterschaft", async () => {
    cur.mockResolvedValue("12");
    p.tblMeisterschaften.findFirst.mockResolvedValue({ ID: 11 });
    await run(2);
    expect(p.tblMeisterschaften.findFirst).toHaveBeenCalledWith({ where: { ID: { lt: 12 } }, orderBy: { ID: "desc" } });
    expect(whereOf()).toEqual({ tblSpieltag: { MeisterschaftsID: 11 } });
  });
  it("2: without active id searches all; without result no filter", async () => {
    cur.mockResolvedValue(null);
    p.tblMeisterschaften.findFirst.mockResolvedValue(null);
    await run(2);
    expect(p.tblMeisterschaften.findFirst).toHaveBeenCalledWith({ where: {}, orderBy: { ID: "desc" } });
    expect(whereOf()).toEqual({});
  });
  it("3: date range filter; without range no filter", async () => {
    await run(3, von, bis);
    expect(whereOf()).toEqual({ tblSpieltag: { Spieltag: { gte: von, lte: bis } } });
    p[model].findMany.mockClear();
    await run(3, von);
    expect(whereOf()).toEqual({});
  });
  it("returns [] on prisma error", async () => {
    p[model].findMany.mockRejectedValue(new Error("x"));
    expect(await run(0)).toEqual([]);
  });
});

describe("getStatistik9er / getStatistikRatten aggregation", () => {
  it("counts buckets, ignores zero, clamps >=10 into Zehn, sorts by Gesamt desc", async () => {
    const mit = M(1, "A", "a");
    p.tbl9erRatten.findMany.mockResolvedValue(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 0].map((n) => ({ SpielerID: 1, Neuner: n, Ratten: n, tblMitglieder: mit })).concat([
        { SpielerID: 2, Neuner: 100, Ratten: 100, tblMitglieder: M(2, "B", "b") },
      ] as any)
    );
    for (const fn of ["getStatistik9er", "getStatistikRatten"] as const) {
      const r: any[] = await actions[fn](0);
      expect(r[0].Spieler).toBe("B, b");
      expect(r[1]).toEqual({
        Spieler: "A, a", Gesamt: 70, AnzTeilnahmen: 11,
        Eins: 1, Zwei: 1, Drei: 1, Vier: 1, Fünf: 1, Sechs: 1, Sieben: 1, Acht: 1, Neun: 1, Zehn: 2,
      });
    }
  });
});

describe("getStatistikPokal", () => {
  it("counts placements 1 and 2 and sorts", async () => {
    p.tblSpielPokal.findMany.mockResolvedValue([
      { SpielerID: 1, Platzierung: 2, tblMitglieder: M(1, "A", "a") },
      { SpielerID: 2, Platzierung: 1, tblMitglieder: M(2, "B", "b") },
      { SpielerID: 1, Platzierung: 3, tblMitglieder: M(1, "A", "a") },
      { SpielerID: 3, Platzierung: 2, tblMitglieder: M(3, "C", "c") },
      { SpielerID: 3, Platzierung: 2, tblMitglieder: M(3, "C", "c") },
    ]);
    const r = await actions.getStatistikPokal(0);
    expect(r).toEqual([
      { Spieler: "B, b", Eins: 1, Zwei: 0 },
      { Spieler: "C, c", Eins: 0, Zwei: 2 },
      { Spieler: "A, a", Eins: 0, Zwei: 1 },
    ]);
  });
});

describe("getStatistikSarg", () => {
  it("counts every placement 1..10, ignores others, counts participations", async () => {
    const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((n) => ({ SpielerID: 1, Platzierung: n, tblMitglieder: M(1, "A", "a") }));
    rows.push({ SpielerID: 2, Platzierung: 1, tblMitglieder: M(2, "B", "b") }, { SpielerID: 2, Platzierung: 1, tblMitglieder: M(2, "B", "b") });
    p.tblSpielSargKegeln.findMany.mockResolvedValue(rows);
    const r: any[] = await actions.getStatistikSarg(0);
    expect(r[0]).toMatchObject({ Spieler: "B, b", AnzTeilnahmen: 2, Eins: 2 });
    expect(r[1]).toEqual({
      Spieler: "A, a", AnzTeilnahmen: 11,
      Eins: 1, Zwei: 1, Drei: 1, Vier: 1, Fünf: 1, Sechs: 1, Sieben: 1, Acht: 1, Neun: 1, Zehn: 1,
    });
  });
});

describe("getStatistikSpielerSpieler", () => {
  it("returns [] for no members", async () => {
    p.tblMitglieder.findMany.mockResolvedValue([]);
    expect(await actions.getStatistikSpielerSpieler(0)).toEqual([]);
  });

  it("computes win/draw/loss per opponent for all game types and merges the filter", async () => {
    cur.mockResolvedValue("5");
    p.tblMitglieder.findMany.mockResolvedValue([{ ID: 1, Nachname: "A", Vorname: "a" }]);
    const A = M(1, "A", "a");
    const B = M(2, "B", "b");
    // Player 1 as P1: win, draw; as P2: win (opponent P1 = B), loss
    p.tblSpielMeisterschaft.findMany.mockResolvedValue([
      { SpielerID1: 1, SpielerID2: 2, HolzSpieler1: 10, HolzSpieler2: 5, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B },
      { SpielerID1: 1, SpielerID2: 2, HolzSpieler1: 7, HolzSpieler2: 7, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B },
      { SpielerID1: 2, SpielerID2: 1, HolzSpieler1: 1, HolzSpieler2: 9, tblMitglieder_SpielerID1: B, tblMitglieder_SpielerID2: A },
      { SpielerID1: 2, SpielerID2: 1, HolzSpieler1: 9, HolzSpieler2: 1, tblMitglieder_SpielerID1: B, tblMitglieder_SpielerID2: A },
      { SpielerID1: 1, SpielerID2: 2, HolzSpieler1: 1, HolzSpieler2: 9, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B },
      { SpielerID1: 1, SpielerID2: 2, HolzSpieler1: null, HolzSpieler2: null, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B },
    ]);
    p.tblSpielBlitztunier.findMany.mockResolvedValue([
      { SpielerID1: 1, SpielerID2: 2, PunkteSpieler1: 3, PunkteSpieler2: 1, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B },
      { SpielerID1: 2, SpielerID2: 1, PunkteSpieler1: 3, PunkteSpieler2: 1, tblMitglieder_SpielerID1: B, tblMitglieder_SpielerID2: A },
      { SpielerID1: 2, SpielerID2: 1, PunkteSpieler1: 1, PunkteSpieler2: 3, tblMitglieder_SpielerID1: B, tblMitglieder_SpielerID2: A },
      { SpielerID1: 1, SpielerID2: 2, PunkteSpieler1: 2, PunkteSpieler2: 2, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B },
      { SpielerID1: 1, SpielerID2: 2, PunkteSpieler1: 0, PunkteSpieler2: 2, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B },
    ]);
    p.tblSpielKombimeisterschaft.findMany.mockResolvedValue([
      // P1 wins 3bis8, loses 5Kugeln, equal total
      { SpielerID1: 1, SpielerID2: 2, Spieler1Punkte3bis8: 5, Spieler2Punkte3bis8: 3, Spieler1Punkte5Kugeln: 1, Spieler2Punkte5Kugeln: 3, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B },
      // As P2: P2 wins both
      { SpielerID1: 2, SpielerID2: 1, Spieler1Punkte3bis8: 1, Spieler2Punkte3bis8: 4, Spieler1Punkte5Kugeln: 1, Spieler2Punkte5Kugeln: 4, tblMitglieder_SpielerID1: B, tblMitglieder_SpielerID2: A },
      // all zero / null -> draws
      { SpielerID1: 1, SpielerID2: 2, Spieler1Punkte3bis8: null, Spieler2Punkte3bis8: null, Spieler1Punkte5Kugeln: null, Spieler2Punkte5Kugeln: null, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B },
      // P1 loses everything
      { SpielerID1: 1, SpielerID2: 2, Spieler1Punkte3bis8: 0, Spieler2Punkte3bis8: 4, Spieler1Punkte5Kugeln: 0, Spieler2Punkte5Kugeln: 4, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B },
    ]);

    const r: any[] = await actions.getStatistikSpielerSpieler(1);
    expect(r).toHaveLength(1);
    expect(r[0].Spielername).toBe("A, a");
    expect(r[0].dictMeisterschaft["B, b"]).toEqual({ Gewonnen: 2, Unentschieden: 2, Verloren: 2 });
    expect(r[0].dictBlitztunier["B, b"]).toEqual({ Gewonnen: 2, Unentschieden: 1, Verloren: 2 });
    const k = r[0].dictKombimeisterschaft["B, b"];
    expect(k.dict3bis8["B, b"]).toEqual({ Gewonnen: 2, Unentschieden: 1, Verloren: 1 });
    expect(k.dict5Kugeln["B, b"]).toEqual({ Gewonnen: 1, Unentschieden: 1, Verloren: 2 });
    expect(k.dictGesamt["B, b"]).toEqual({ Gewonnen: 1, Unentschieden: 2, Verloren: 1 });

    expect(p.tblSpielMeisterschaft.findMany.mock.calls[0][0].where).toEqual({
      tblSpieltag: { MeisterschaftsID: 5 },
      OR: [{ SpielerID1: 1 }, { SpielerID2: 1 }],
    });
    expect(p.tblMitglieder.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { Ehemaliger: false } }));
  });

  it("handles a player without games", async () => {
    p.tblMitglieder.findMany.mockResolvedValue([{ ID: 1, Nachname: "A", Vorname: "a" }]);
    p.tblSpielMeisterschaft.findMany.mockResolvedValue([]);
    p.tblSpielBlitztunier.findMany.mockResolvedValue([]);
    p.tblSpielKombimeisterschaft.findMany.mockResolvedValue([]);
    expect(await actions.getStatistikSpielerSpieler(0)).toEqual([
      { Spielername: "A, a", dictMeisterschaft: {}, dictBlitztunier: {}, dictKombimeisterschaft: {} },
    ]);
  });

  it("returns [] on error", async () => {
    p.tblMitglieder.findMany.mockRejectedValue(new Error("x"));
    expect(await actions.getStatistikSpielerSpieler(0)).toEqual([]);
  });
});

describe("6-Tage-Rennen statistics", () => {
  const A = M(1, "A", "a"), B = M(2, "B", "b"), C = M(3, "C", "c"), D = M(4, "D", "d");
  const g = (SpieltagID: number, s1: any, s2: any, Runden: number, Punkte: number) => ({
    SpieltagID, SpielerID1: s1.ID, SpielerID2: s2.ID, Runden, Punkte,
    tblMitglieder_SpielerID1: s1, tblMitglieder_SpielerID2: s2,
  });
  const gamesForSixTeams = () => {
    const mk = (i: number) => M(10 + i, `N${i}`, `V${i}`);
    return [0, 1, 2, 3, 4, 5, 6].map((i) => g(1, mk(i * 2), mk(i * 2 + 1), 100 - i, 0));
  };

  it("Platz: ranks per spieltag by Runden then Punkte, counts both players", async () => {
    p.tblSpiel6TageRennen.findMany.mockResolvedValue([
      g(1, A, B, 10, 5),
      g(1, C, D, 10, 9), // same Runden, more Punkte -> place 1
      g(2, A, C, 8, 0),
      g(2, B, D, 9, 0),
    ]);
    const r: any[] = await actions.getStatistik6TageRennenPlatz(0);
    const byName = Object.fromEntries(r.map((x) => [x.Spieler, x]));
    expect(byName["C, c"]).toMatchObject({ AnzTeilnahmen: 2, Eins: 1, Zwei: 1 });
    expect(byName["A, a"]).toMatchObject({ AnzTeilnahmen: 2, Zwei: 2 });
    expect(byName["A, a"].Eins).toBe(0);
    expect(byName["D, d"]).toMatchObject({ Eins: 2, Zwei: 0 });
    expect(byName["B, b"]).toMatchObject({ Eins: 1, Zwei: 1 });
    expect(r).toHaveLength(4);
    expect(r[0].Eins).toBeGreaterThanOrEqual(r[3].Eins);
  });

  it("Platz: places 3..6 are counted, 7th is only a participation", async () => {
    p.tblSpiel6TageRennen.findMany.mockResolvedValue(gamesForSixTeams());
    const r: any[] = await actions.getStatistik6TageRennenPlatz(0);
    expect(r).toHaveLength(14);
    const by = Object.fromEntries(r.map((x) => [x.Spieler, x]));
    expect(by["N4, V4"]).toMatchObject({ Drei: 1 });
    expect(by["N6, V6"]).toMatchObject({ Vier: 1 });
    expect(by["N8, V8"]).toMatchObject({ Fünf: 1 });
    expect(by["N10, V10"]).toMatchObject({ Sechs: 1 });
    expect(by["N12, V12"]).toMatchObject({ AnzTeilnahmen: 1, Eins: 0, Zwei: 0, Drei: 0, Vier: 0, Fünf: 0, Sechs: 0 });
  });

  it("BesteMannschaft: groups teams regardless of player order and counts places", async () => {
    p.tblSpiel6TageRennen.findMany.mockResolvedValue([
      g(1, A, B, 10, 0),
      g(1, C, D, 5, 0),
      g(2, D, C, 9, 0), // same team as C/D but swapped
      g(2, B, A, 3, 0),
    ]);
    const r: any[] = await actions.getStatistik6TageRennenBesteMannschaft(0);
    const by = Object.fromEntries(r.map((x) => [x.Mannschaft, x]));
    expect(Object.keys(by).sort()).toEqual(["A, a / B, b", "C, c / D, d"]);
    expect(by["A, a / B, b"]).toMatchObject({ Anzahl: 2, Eins: 1, Zwei: 1 });
    expect(by["C, c / D, d"]).toMatchObject({ Anzahl: 2, Eins: 1, Zwei: 1 });
  });

  it("BesteMannschaft: counts places 3..6", async () => {
    p.tblSpiel6TageRennen.findMany.mockResolvedValue(gamesForSixTeams());
    const r: any[] = await actions.getStatistik6TageRennenBesteMannschaft(0);
    expect(r).toHaveLength(7);
    const by = Object.fromEntries(r.map((x) => [x.Mannschaft, x]));
    expect(by["N4, V4 / N5, V5"]).toMatchObject({ Drei: 1 });
    expect(by["N6, V6 / N7, V7"]).toMatchObject({ Vier: 1 });
    expect(by["N8, V8 / N9, V9"]).toMatchObject({ Fünf: 1 });
    expect(by["N10, V10 / N11, V11"]).toMatchObject({ Sechs: 1 });
    expect(by["N12, V12 / N13, V13"]).toMatchObject({ Anzahl: 1, Eins: 0, Sechs: 0 });
  });

  it("MannschaftMitglied: maps each member to their teams", async () => {
    p.tblSpiel6TageRennen.findMany.mockResolvedValue([g(1, A, B, 10, 0), g(1, A, C, 5, 0)]);
    const r = await actions.getStatistik6TageRennenMannschaftMitglied(0);
    expect(Object.keys(r).sort()).toEqual(["A, a", "B, b", "C, c"]);
    expect(r["A, a"]).toHaveLength(2);
    expect(r["B, b"]).toHaveLength(1);
    expect(r["B, b"][0].Mannschaft).toBe("A, a / B, b");
  });

  it("MannschaftMitglied: empty data -> {}, error -> {}", async () => {
    p.tblSpiel6TageRennen.findMany.mockResolvedValue([]);
    expect(await actions.getStatistik6TageRennenMannschaftMitglied(0)).toEqual({});
    p.tblSpiel6TageRennen.findMany.mockRejectedValue(new Error("x"));
    expect(await actions.getStatistik6TageRennenMannschaftMitglied(0)).toEqual({});
  });
});

describe("getStatistikNeunerRattenKoenig", () => {
  const empty = { lstStatistik9erRatten: [], dictNeunerkönig: {}, dictRattenkönig: {} };
  const row = (SpieltagID: number, m: any, Neuner: number, Ratten: number) => ({ SpieltagID, Neuner, Ratten, tblMitglieder: m });

  it("determines kings per spieltag, ignores zero values, converts dates", async () => {
    const t1 = new Date("2025-03-01T00:00:00.000Z");
    p.tblSpieltag.findMany.mockResolvedValue([
      { ID: 1, Spieltag: t1 },
      { ID: 2, Spieltag: new Date("invalid") },
      { ID: 3, Spieltag: new Date("2025-03-15T00:00:00.000Z") },
      { ID: 4, Spieltag: new Date("2025-03-22T00:00:00.000Z") },
    ]);
    p.tbl9erRatten.findMany.mockResolvedValue([
      row(1, M(1, "A", "a"), 5, 0),
      row(1, M(2, "B", "b"), 2, 3),
      row(2, M(1, "A", "a"), 1, 1),
      row(3, M(1, "A", "a"), 4, 4),
      row(4, M(2, "B", "b"), 0, 0), // nobody
    ]);
    const r = await actions.getStatistikNeunerRattenKoenig(0);
    expect(r.lstStatistik9erRatten).toEqual([
      { Spieltag: new Date(t1.getTime() - t1.getTimezoneOffset() * 60000).toISOString(), Neunerkönig: "A, a", Rattenorden: "B, b" },
      { Spieltag: null, Neunerkönig: "A, a", Rattenorden: "A, a" },
      { Spieltag: expect.any(String), Neunerkönig: "A, a", Rattenorden: "A, a" },
      { Spieltag: expect.any(String), Neunerkönig: "", Rattenorden: "" },
    ]);
    expect(r.dictNeunerkönig).toEqual({ "A, a": 3 });
    expect(r.dictRattenkönig).toEqual({ "B, b": 1, "A, a": 2 });
  });

  it("passes the zeitbereich filter to both queries", async () => {
    cur.mockResolvedValue("9");
    p.tblSpieltag.findMany.mockResolvedValue([]);
    p.tbl9erRatten.findMany.mockResolvedValue([]);
    expect(await actions.getStatistikNeunerRattenKoenig(1)).toEqual(empty);
    expect(p.tblSpieltag.findMany.mock.calls[0][0].where).toEqual({ tblSpieltag: { MeisterschaftsID: 9 } });
  });

  it("zeitbereich 2 and 3 branches", async () => {
    p.tblSpieltag.findMany.mockResolvedValue([]);
    p.tbl9erRatten.findMany.mockResolvedValue([]);
    cur.mockResolvedValue("9");
    p.tblMeisterschaften.findFirst.mockResolvedValue({ ID: 8 });
    await actions.getStatistikNeunerRattenKoenig(2);
    expect(p.tbl9erRatten.findMany.mock.calls[0][0].where).toEqual({ tblSpieltag: { MeisterschaftsID: 8 } });
    await actions.getStatistikNeunerRattenKoenig(3, von, bis);
    expect(p.tbl9erRatten.findMany.mock.calls[1][0].where).toEqual({ tblSpieltag: { Spieltag: { gte: von, lte: bis } } });
  });

  it("returns empty structure on error", async () => {
    p.tbl9erRatten.findMany.mockRejectedValue(new Error("x"));
    expect(await actions.getStatistikNeunerRattenKoenig(0)).toEqual(empty);
  });
});

describe("getStatistikSpielerById", () => {
  it("returns zeros when player has no games", async () => {
    p.tblSpielMeisterschaft.findMany.mockResolvedValue([]);
    p.tblSpielBlitztunier.findMany.mockResolvedValue([]);
    p.tbl9erRatten.findMany.mockResolvedValue([]);
    const r: any = await actions.getStatistikSpielerById(1);
    expect(r.success).toBe(true);
    expect(Object.values(r.data).every((v) => v === 0)).toBe(true);
  });

  it("aggregates meisterschaft, blitz and ratten data", async () => {
    p.tblSpielMeisterschaft.findMany.mockResolvedValue([
      { SpielerID1: 1, HolzSpieler1: 100, HolzSpieler2: 50 },
      { SpielerID1: 2, HolzSpieler1: 10, HolzSpieler2: 80 },
    ]);
    p.tblSpielBlitztunier.findMany.mockResolvedValue([
      { SpielerID1: 3, PunkteSpieler1: 5, PunkteSpieler2: 20 }, // player is P2 -> 20
      { SpielerID1: 1, PunkteSpieler1: 4, PunkteSpieler2: 99 }, // player is P1 -> 4
    ]);
    p.tbl9erRatten.findMany.mockResolvedValue([
      { Ratten: 2, Neuner: 3, Kranzacht: 1 },
      { Ratten: 5, Neuner: null, Kranzacht: null },
    ]);
    const r: any = await actions.getStatistikSpielerById(1);
    expect(r.data).toEqual({
      HolzMeisterMax: 100, HolzMeisterMin: 80, HolzMeisterSumme: 180, HolzMeisterAVG: 90,
      HolzBlitzMax: 20, HolzBlitzMin: 4, HolzBlitzSumme: 24, HolzBlitzAVG: 12,
      HolzMax: 100, HolzMin: 4, HolzSumme: 204, HolzAVG: 51,
      RattenMax: 5, RattenSumme: 7, NeunerMax: 3, NeunerSumme: 3, Kranz8Max: 1, Kranz8Summe: 1,
    });
  });

  it("uses only meisterschaft min when no blitz games, and only blitz min when no meisterschaft games", async () => {
    p.tbl9erRatten.findMany.mockResolvedValue([]);
    p.tblSpielMeisterschaft.findMany.mockResolvedValue([{ SpielerID1: 1, HolzSpieler1: 30, HolzSpieler2: 0 }]);
    p.tblSpielBlitztunier.findMany.mockResolvedValue([]);
    let r: any = await actions.getStatistikSpielerById(1);
    expect(r.data).toMatchObject({ HolzMin: 30, HolzMax: 30, HolzAVG: 30 });

    p.tblSpielMeisterschaft.findMany.mockResolvedValue([]);
    p.tblSpielBlitztunier.findMany.mockResolvedValue([{ SpielerID1: 1, PunkteSpieler1: 7, PunkteSpieler2: 0 }]);
    r = await actions.getStatistikSpielerById(1);
    expect(r.data).toMatchObject({ HolzMin: 7, HolzMax: 7, HolzAVG: 7 });
  });

  it("returns error result on failure", async () => {
    p.tblSpielMeisterschaft.findMany.mockRejectedValue(new Error("x"));
    expect(await actions.getStatistikSpielerById(1)).toEqual({ success: false, error: "Fehler beim Laden der Spielerstatistik" });
  });
});

describe("getStatistikSpielerErgebnisse", () => {
  const A = M(1, "A", "a"), B = M(2, "B", "b");
  const base = (over: any = {}) => ({
    ID: 1,
    Spieltag: new Date("2025-05-10T00:00:00.000Z"),
    tblMeisterschaften: { Bezeichnung: "Saison" },
    tblSpielMeisterschaft: [],
    tblSpiel6TageRennen: [],
    tblSpielSargKegeln: [],
    tblSpielPokal: [],
    tbl9erRatten: [],
    ...over,
  });
  const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();

  it("skips spieltage without games; empty -> []", async () => {
    p.tblSpieltag.findMany.mockResolvedValue([base()]);
    expect(await actions.getStatistikSpielerErgebnisse(1)).toEqual([]);
    p.tblSpieltag.findMany.mockResolvedValue([]);
    expect(await actions.getStatistikSpielerErgebnisse(1)).toEqual([]);
  });

  it("maps meisterschaft result as P1 (win), P2 (draw/loss) with opponent and Holz", async () => {
    const d = new Date("2025-05-10T00:00:00.000Z");
    p.tblSpieltag.findMany.mockResolvedValue([
      base({ tblSpielMeisterschaft: [{ SpielerID1: 1, SpielerID2: 2, HolzSpieler1: 10, HolzSpieler2: 5, tblMitglieder_SpielerID1: A, tblMitglieder_SpielerID2: B }] }),
      base({ tblSpielMeisterschaft: [{ SpielerID1: 2, SpielerID2: 1, HolzSpieler1: 5, HolzSpieler2: 5, tblMitglieder_SpielerID1: B, tblMitglieder_SpielerID2: A }] }),
      base({ tblSpielMeisterschaft: [{ SpielerID1: 2, SpielerID2: 1, HolzSpieler1: 9, HolzSpieler2: 5, tblMitglieder_SpielerID1: B, tblMitglieder_SpielerID2: A }] }),
      base({ tblSpielMeisterschaft: [{ SpielerID1: 2, SpielerID2: 1, HolzSpieler1: 1, HolzSpieler2: 5, tblMitglieder_SpielerID1: B, tblMitglieder_SpielerID2: A }] }),
    ]);
    const r: any[] = await actions.getStatistikSpielerErgebnisse(1);
    expect(r[0]).toEqual({ Spieltag: iso(d), Meisterschaft: "Saison", Gegenspieler: "B, b", Holz: 10, Ergebnis: 2 });
    expect(r[1]).toMatchObject({ Gegenspieler: "B, b", Holz: 5, Ergebnis: 1 });
    expect(r[2]).toMatchObject({ Holz: 5, Ergebnis: 2 }); // raw rule: Ergebnis always from HolzSpieler1 vs 2
    expect(r[3]).toMatchObject({ Holz: 5, Ergebnis: 0 });
  });

  it("maps 6-Tage-Rennen with place, Sarg, Pokal and 9er/Ratten", async () => {
    p.tblSpieltag.findMany.mockResolvedValue([
      base({
        tblSpiel6TageRennen: [{ Spielnummer: 3, Runden: 20, Punkte: 4 }],
        tblSpielSargKegeln: [{ Platzierung: 2 }],
        tblSpielPokal: [{ Platzierung: 1 }],
        tbl9erRatten: [{ Neuner: 3, Ratten: 1 }],
      }),
      base({ ID: 2, Spieltag: "not-a-date", tblSpiel6TageRennen: [{ Spielnummer: 1, Runden: 1, Punkte: 1 }] }),
    ]);
    p.tblSpiel6TageRennen.findMany
      .mockResolvedValueOnce([{ SpielerID1: 5, SpielerID2: 6 }, { SpielerID1: 1, SpielerID2: 7 }])
      .mockResolvedValueOnce([{ SpielerID1: 8, SpielerID2: 9 }]); // player not found -> 0
    const r: any[] = await actions.getStatistikSpielerErgebnisse(1);
    expect(r[0]).toMatchObject({
      SechsTageRennen_Runden: 20, SechsTageRennen_Punkte: 4, SechsTageRennen_Platz: 2,
      Sarg: 2, Pokal: 1, Neuner: 3, Ratten: 1,
    });
    expect(p.tblSpiel6TageRennen.findMany.mock.calls[0][0]).toEqual({
      where: { SpieltagID: 1, Spielnummer: 3 },
      orderBy: [{ Runden: "desc" }, { Punkte: "desc" }],
    });
    expect(r[1].SechsTageRennen_Platz).toBe(0);
    expect(r[1].Spieltag).toBeNull();
  });

  it("returns [] on error", async () => {
    p.tblSpieltag.findMany.mockRejectedValue(new Error("x"));
    expect(await actions.getStatistikSpielerErgebnisse(1)).toEqual([]);
  });
});
