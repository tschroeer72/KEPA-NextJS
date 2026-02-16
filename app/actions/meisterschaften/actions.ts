"use server"

import { prisma } from "@/lib/prisma";

export interface MeisterschaftWithTyp {
  ID: number;
  Bezeichnung: string;
  Beginn: Date;
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
    Beginn: m.Beginn,
    Meisterschaftstyp: m.tblMeisterschaftstyp.Meisterschaftstyp,
  }));
}
