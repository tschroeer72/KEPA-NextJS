"use server"

import { prisma } from "@/lib/prisma";

export interface NeunerRattenResult {
  Spieltag: string;
  Spielername: string;
  Neuner: number;
  Ratten: number;
  Kranz8: number;
}

export interface SechsTageRennenResult {
  Spieltag: string;
  Spieler1Name: string;
  Spieler2Name: string;
  Runden: number;
  Punkte: number;
  Spielnr: number;
}

export interface PokalResult {
  Spieltag: string;
  Spielername: string;
  Platzierung: number;
}

export interface SargkegelnResult {
  Spieltag: string;
  Spielername: string;
  Platzierung: number;
}

export interface MeisterschaftResult {
  Spieltag: string;
  Spieler1Name: string;
  Spieler2Name: string;
  HolzSpieler1: number;
  HolzSpieler2: number;
  HinRueckrunde: number;
}

export interface BlitztunierResult {
  Spieltag: string;
  Spieler1Name: string;
  Spieler2Name: string;
  PunkteSpieler1: number;
  PunkteSpieler2: number;
  HinRueckrunde: number;
}

export interface KombimeisterschaftResult {
  Spieltag: string;
  Spieler1Name: string;
  Spieler2Name: string;
  Spieler1Punkte3bis8: number;
  Spieler1Punkte5Kugeln: number;
  Spieler2Punkte3bis8: number;
  Spieler2Punkte5Kugeln: number;
  HinRueckrunde: number;
}

export interface ErgebnisseData {
  neunerRatten: NeunerRattenResult[];
  sechsTageRennen: SechsTageRennenResult[];
  pokal: PokalResult[];
  sargkegeln: SargkegelnResult[];
  meisterschaft: MeisterschaftResult[];
  blitztunier: BlitztunierResult[];
  kombimeisterschaft: KombimeisterschaftResult[];
}

export async function getErgebnisse(spieltagIds: number[]): Promise<ErgebnisseData> {
  if (spieltagIds.length === 0) {
    return {
      neunerRatten: [],
      sechsTageRennen: [],
      pokal: [],
      sargkegeln: [],
      meisterschaft: [],
      blitztunier: [],
      kombimeisterschaft: [],
    };
  }

  const [neunerRatten, sechsTageRennen, pokal, sargkegeln, meisterschaft, blitztunier, kombimeisterschaft] = await Promise.all([
    prisma.tbl9erRatten.findMany({
      where: { SpieltagID: { in: spieltagIds } },
      include: { 
        tblMitglieder: { select: { Vorname: true, Nachname: true } },
        tblSpieltag: { select: { Spieltag: true } }
      },
    }),
    prisma.tblSpiel6TageRennen.findMany({
      where: { SpieltagID: { in: spieltagIds } },
      include: { 
        tblMitglieder_SpielerID1: { select: { Vorname: true, Nachname: true } },
        tblMitglieder_SpielerID2: { select: { Vorname: true, Nachname: true } },
        tblSpieltag: { select: { Spieltag: true } }
      },
    }),
    prisma.tblSpielPokal.findMany({
      where: { SpieltagID: { in: spieltagIds } },
      include: { 
        tblMitglieder: { select: { Vorname: true, Nachname: true } },
        tblSpieltag: { select: { Spieltag: true } }
      },
    }),
    prisma.tblSpielSargKegeln.findMany({
      where: { SpieltagID: { in: spieltagIds } },
      include: { 
        tblMitglieder: { select: { Vorname: true, Nachname: true } },
        tblSpieltag: { select: { Spieltag: true } }
      },
    }),
    prisma.tblSpielMeisterschaft.findMany({
      where: { SpieltagID: { in: spieltagIds } },
      include: { 
        tblMitglieder_SpielerID1: { select: { Vorname: true, Nachname: true } },
        tblMitglieder_SpielerID2: { select: { Vorname: true, Nachname: true } },
        tblSpieltag: { select: { Spieltag: true } }
      },
    }),
    prisma.tblSpielBlitztunier.findMany({
      where: { SpieltagID: { in: spieltagIds } },
      include: { 
        tblMitglieder_SpielerID1: { select: { Vorname: true, Nachname: true } },
        tblMitglieder_SpielerID2: { select: { Vorname: true, Nachname: true } },
        tblSpieltag: { select: { Spieltag: true } }
      },
    }),
    prisma.tblSpielKombimeisterschaft.findMany({
      where: { SpieltagID: { in: spieltagIds } },
      include: { 
        tblMitglieder_SpielerID1: { select: { Vorname: true, Nachname: true } },
        tblMitglieder_SpielerID2: { select: { Vorname: true, Nachname: true } },
        tblSpieltag: { select: { Spieltag: true } }
      },
    }),
  ]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return {
    neunerRatten: neunerRatten.map(n => ({
        Spieltag: formatDate(n.tblSpieltag.Spieltag),
        Spielername: `${(n as any).tblMitglieder?.Vorname} ${(n as any).tblMitglieder?.Nachname}`,
        Neuner: n.Neuner,
        Ratten: n.Ratten,
        Kranz8: n.Kranzacht
    })),
    sechsTageRennen: sechsTageRennen.map(s => ({
        Spieltag: formatDate(s.tblSpieltag.Spieltag),
        Spieler1Name: `${(s as any).tblMitglieder_SpielerID1?.Vorname} ${(s as any).tblMitglieder_SpielerID1?.Nachname}`,
        Spieler2Name: `${(s as any).tblMitglieder_SpielerID2?.Vorname} ${(s as any).tblMitglieder_SpielerID2?.Nachname}`,
        Runden: s.Runden,
        Punkte: s.Punkte,
        Spielnr: s.Spielnummer || 0
    })),
    pokal: pokal.map(p => ({
        Spieltag: formatDate(p.tblSpieltag.Spieltag),
        Spielername: `${(p as any).tblMitglieder?.Vorname} ${(p as any).tblMitglieder?.Nachname}`,
        Platzierung: p.Platzierung
    })),
    sargkegeln: sargkegeln.map(s => ({
        Spieltag: formatDate(s.tblSpieltag.Spieltag),
        Spielername: `${(s as any).tblMitglieder?.Vorname} ${(s as any).tblMitglieder?.Nachname}`,
        Platzierung: s.Platzierung
    })),
    meisterschaft: meisterschaft.map(m => ({
        Spieltag: formatDate(m.tblSpieltag.Spieltag),
        Spieler1Name: `${(m as any).tblMitglieder_SpielerID1?.Vorname} ${(m as any).tblMitglieder_SpielerID1?.Nachname}`,
        Spieler2Name: `${(m as any).tblMitglieder_SpielerID2?.Vorname} ${(m as any).tblMitglieder_SpielerID2?.Nachname}`,
        HolzSpieler1: m.HolzSpieler1,
        HolzSpieler2: m.HolzSpieler2,
        HinRueckrunde: m.HinRueckrunde
    })),
    blitztunier: blitztunier.map(b => ({
        Spieltag: formatDate(b.tblSpieltag.Spieltag),
        Spieler1Name: `${(b as any).tblMitglieder_SpielerID1?.Vorname} ${(b as any).tblMitglieder_SpielerID1?.Nachname}`,
        Spieler2Name: `${(b as any).tblMitglieder_SpielerID2?.Vorname} ${(b as any).tblMitglieder_SpielerID2?.Nachname}`,
        PunkteSpieler1: b.PunkteSpieler1,
        PunkteSpieler2: b.PunkteSpieler2,
        HinRueckrunde: b.HinR_ckrunde
    })),
    kombimeisterschaft: kombimeisterschaft.map(k => ({
        Spieltag: formatDate(k.tblSpieltag.Spieltag),
        Spieler1Name: `${(k as any).tblMitglieder_SpielerID1?.Vorname} ${(k as any).tblMitglieder_SpielerID1?.Nachname}`,
        Spieler2Name: `${(k as any).tblMitglieder_SpielerID2?.Vorname} ${(k as any).tblMitglieder_SpielerID2?.Nachname}`,
        Spieler1Punkte3bis8: k.Spieler1Punkte3bis8,
        Spieler1Punkte5Kugeln: k.Spieler1Punkte5Kugeln,
        Spieler2Punkte3bis8: k.Spieler2Punkte3bis8,
        Spieler2Punkte5Kugeln: k.Spieler2Punkte5Kugeln,
        HinRueckrunde: k.HinRueckrunde
    }))
  };
}
