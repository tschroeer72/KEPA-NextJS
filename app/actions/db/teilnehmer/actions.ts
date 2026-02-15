"use server"

import { prisma } from '@/lib/prisma'
import { createChangeLogAction } from '@/utils/change-log-action'
import { revalidatePath } from 'next/cache'

export async function getTeilnehmerByMeisterschaft(meisterschaftId: number) {
  try {
    const data = await prisma.tblTeilnehmer.findMany({
      where: { MeisterschaftsID: meisterschaftId },
      include: {
        tblMitglieder: true
      }
    })
    
    const transformedData = data.map(t => {
      const m = t.tblMitglieder;
      return {
        ID: m.ID,
        Anzeigename: m.Spitzname ? `${m.Vorname} "${m.Spitzname}" ${m.Nachname}` : `${m.Vorname} ${m.Nachname}`,
        Vorname: m.Vorname,
        Nachname: m.Nachname,
        Spitzname: m.Spitzname || ""
      }
    })

    return { success: true, data: transformedData }
  } catch (error) {
    return { success: false, error: 'Fehler beim Abrufen der Teilnehmer' }
  }
}

export async function addTeilnehmer(meisterschaftId: number, mitgliedId: number) {
  try {
    const data = await prisma.tblTeilnehmer.create({
      data: {
        MeisterschaftsID: meisterschaftId,
        SpielerID: mitgliedId
      }
    })
    await createChangeLogAction("tblTeilnehmer", "insert", `insert into tblTeilnehmer ...`)
    revalidatePath('/verwaltung/meisterschaften')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Fehler beim Hinzufügen des Teilnehmers' }
  }
}

export async function removeTeilnehmer(meisterschaftId: number, mitgliedId: number) {
  try {
    await prisma.tblTeilnehmer.deleteMany({
      where: {
        MeisterschaftsID: meisterschaftId,
        SpielerID: mitgliedId
      }
    })
    await createChangeLogAction("tblTeilnehmer", "delete", `delete from tblTeilnehmer where MeisterschaftsID=${meisterschaftId} and SpielerID=${mitgliedId}`)
    revalidatePath('/verwaltung/meisterschaften')
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Fehler beim Entfernen des Teilnehmers' }
  }
}
