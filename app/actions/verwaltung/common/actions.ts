"use server"

import { prisma } from "@/lib/prisma";

export interface MeisterschaftWithTyp {
  ID: number;
  Bezeichnung: string;
  Beginn: string;
  Meisterschaftstyp: string;
}

export async function getMeisterschaften(): Promise<MeisterschaftWithTyp[]> {
  const meisterschaften = await prisma.tblMeisterschaften.findMany({
    orderBy: {
      Beginn: 'desc',
    },
    include: {
      tblMeisterschaftstyp: true,
    },
  });

  return meisterschaften.map((m) => ({
    ID: m.ID,
    Bezeichnung: m.Bezeichnung,
    Beginn: (m.Beginn instanceof Date && !isNaN(m.Beginn.getTime())) 
      ? new Date(m.Beginn.getTime() - m.Beginn.getTimezoneOffset() * 60000).toISOString() 
      : null,
    Meisterschaftstyp: m.tblMeisterschaftstyp?.Meisterschaftstyp || "Unbekannt",
  })) as any;
}

export interface Spieltag {
  ID: number;
  Spieltag: string;
  MeisterschaftsID: number;
}

export async function getSpieltageByMeisterschaft(meisterschaftId: number): Promise<Spieltag[]> {
  const spieltage = await prisma.tblSpieltag.findMany({
    where: {
      MeisterschaftsID: meisterschaftId,
    },
    orderBy: {
      Spieltag: 'asc',
    },
  });

  return spieltage.map((s) => ({
    ID: s.ID,
    Spieltag: (s.Spieltag instanceof Date && !isNaN(s.Spieltag.getTime())) 
      ? new Date(s.Spieltag.getTime() - s.Spieltag.getTimezoneOffset() * 60000).toISOString() 
      : null,
    MeisterschaftsID: s.MeisterschaftsID,
  })) as any;
}
