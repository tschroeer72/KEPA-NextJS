"use server"

import { prisma } from '@/lib/prisma'
import { createChangeLogAction } from '@/utils/change-log-action'
import { revalidatePath } from 'next/cache'
import type { Prisma } from '@prisma/client'

// Generic save function for different game types
export async function saveGameResult(type: string, data: any) {
  try {
    let result;
    let table = "";
    
    switch(type) {
      case '9erratten':
        result = await prisma.tbl9erRatten.create({ data: data as Prisma.tbl9erRattenUncheckedCreateInput });
        table = "tbl9erRatten";
        break;
      case 'spieltag':
        result = await prisma.tblSpieltag.create({ data: data as Prisma.tblSpieltagUncheckedCreateInput });
        table = "tblSpieltag";
        break;
      // Add other cases as needed
      default:
        return { success: false, error: 'Unbekannter Spieltyp' };
    }

    await createChangeLogAction(table, "insert", `insert into ${table} ...`);
    return { success: true, data: result };
  } catch (error) {
    console.error('Save game error:', error);
    return { success: false, error: 'Fehler beim Speichern des Spielergebnisses' };
  }
}

export async function getSpieltageByMeisterschaft(meisterschaftId: number) {
  try {
    const data = await prisma.tblSpieltag.findMany({
      where: { MeisterschaftsID: meisterschaftId },
      orderBy: { Spieltag: 'desc' }
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Fehler beim Abrufen der Spieltage' };
  }
}
