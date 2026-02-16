"use server"

import { prisma } from "@/lib/prisma";

export interface Spieltag {
  ID: number;
  Spieltag: Date;
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
    Spieltag: s.Spieltag,
    MeisterschaftsID: s.MeisterschaftsID,
  }));
}
