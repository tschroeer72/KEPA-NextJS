import { saveEingabeAction } from "@/app/actions/verwaltung/eingabe/save-eingabe";
import type { seedBasis } from "./db";

type Basis = Awaited<ReturnType<typeof seedBasis>>;

export const SPIELTAGE = [new Date("2025-02-01"), new Date("2025-02-08")];

/**
 * Erfasst über die echte Eingabe-Action Ergebnisse aller 7 Spieltypen an zwei Spieltagen.
 * Spieler: m0 = Hans "Hansi" Meier, m1 = Karl Schmidt, m2 = Otto "Otti" Becker, m3 = Willi Wagner.
 */
export async function seedSpielbetrieb({ mitglieder: m, meisterschaft }: Basis) {
  const mid = meisterschaft.ID;

  for (const [i, tag] of SPIELTAGE.entries()) {
    const hr = i === 0 ? "Hinrunde" : "Rückrunde";
    const results = [
      await saveEingabeAction(mid, tag, "9er-ratten-kranz8", [
        { SpielerID: m[0].ID, Neuner: 3 + i, Ratten: 1, Kranz8: 0 },
        { SpielerID: m[1].ID, Neuner: 5, Ratten: 0 + i, Kranz8: 1 },
        { SpielerID: m[2].ID, Neuner: 0, Ratten: 2, Kranz8: 0 },
      ] as any),
      await saveEingabeAction(mid, tag, "6-tage-rennen", [
        { Spieler1ID: m[0].ID, Spieler2ID: m[1].ID, Runden: 20, Punkte: 15 + i, Spielnr: 1 },
        { Spieler1ID: m[2].ID, Spieler2ID: m[3].ID, Runden: 18, Punkte: 12, Spielnr: 1 },
      ] as any),
      await saveEingabeAction(mid, tag, "pokal", [
        { SpielerID: m[0].ID, Platzierung: 1 + i },
        { SpielerID: m[1].ID, Platzierung: 2 - i },
      ] as any),
      await saveEingabeAction(mid, tag, "sargkegeln", [
        { SpielerID: m[2].ID, Platzierung: 1 },
        { SpielerID: m[3].ID, Platzierung: 2 },
      ] as any),
      await saveEingabeAction(mid, tag, "meisterschaft", [
        { Spieler1ID: m[0].ID, Spieler2ID: m[1].ID, Wert1: 120 + i, Wert2: 110, HinRueckrunde: hr },
        { Spieler1ID: m[2].ID, Spieler2ID: m[3].ID, Wert1: 100, Wert2: 105, HinRueckrunde: hr },
      ] as any),
      await saveEingabeAction(mid, tag, "blitztunier", [
        { Spieler1ID: m[0].ID, Spieler2ID: m[2].ID, Wert1: 30, Wert2: 25 + i, HinRueckrunde: hr },
        { Spieler1ID: m[1].ID, Spieler2ID: m[3].ID, Wert1: 28, Wert2: 28, HinRueckrunde: hr },
      ] as any),
      await saveEingabeAction(mid, tag, "kombimeisterschaft", [
        { Spieler1ID: m[0].ID, Spieler2ID: m[3].ID, S1_3bis8: 40, S1_5K: 20, S2_3bis8: 35, S2_5K: 22, HinRueckrunde: hr },
        { Spieler1ID: m[1].ID, Spieler2ID: m[2].ID, S1_3bis8: 38, S1_5K: 21, S2_3bis8: 41, S2_5K: 19, HinRueckrunde: hr },
      ] as any),
    ];
    for (const r of results) expect(r).toMatchObject({ success: true });
  }
}
