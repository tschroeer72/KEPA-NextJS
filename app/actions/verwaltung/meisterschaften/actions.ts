"use server"

import { prisma } from '@/lib/prisma'
import { createChangeLogAction } from '@/utils/change-log-action'
import { revalidatePath } from 'next/cache'
import { toUTCDate } from '@/lib/date-utils'
import type { Prisma } from '@prisma/client'

export async function getMeisterschaften() {
  try {
    const data = await prisma.tblMeisterschaften.findMany({
      orderBy: { ID: 'desc' },
      include: {
        tblMeisterschaftstyp: true
      }
    })
    const transformedData = data.map((m: any) => ({
      ...m,
      Beginn: (m.Beginn instanceof Date && !isNaN(m.Beginn.getTime())) 
        ? m.Beginn.toISOString() 
        : null,
      Ende: (m.Ende instanceof Date && !isNaN(m.Ende.getTime())) 
        ? m.Ende.toISOString() 
        : null,
    }))
    return { success: true, data: transformedData }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Abrufen der Meisterschaften' }
  }
}

export async function getMeisterschaftById(id: number) {
  try {
    const data = await prisma.tblMeisterschaften.findUnique({
      where: { ID: id },
      include: {
        tblMeisterschaftstyp: true
      }
    })
    if (!data) return { success: false, error: 'Meisterschaft nicht gefunden' }
    const serializableData = {
      ...data,
      Beginn: (data.Beginn instanceof Date && !isNaN(data.Beginn.getTime())) 
        ? data.Beginn.toISOString() 
        : null,
      Ende: (data.Ende instanceof Date && !isNaN(data.Ende.getTime())) 
        ? data.Ende.toISOString() 
        : null,
    }
    return { success: true, data: serializableData }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Abrufen der Meisterschaft' }
  }
}

export async function createMeisterschaft(body: Prisma.tblMeisterschaftenUncheckedCreateInput) {
  try {
    const isAktiv = Number(body.Aktiv || 0) === 1

    const beginn = body.Beginn ? toUTCDate(body.Beginn as string | Date) : toUTCDate(new Date())
    const ende = body.Ende ? toUTCDate(body.Ende as string | Date) : null

    if (!beginn) {
      return { success: false, error: 'Ungültiges Startdatum' }
    }

    const data = await prisma.$transaction(async (tx) => {
      if (isAktiv) {
        await tx.tblMeisterschaften.updateMany({
          where: { Aktiv: 1 },
          data: { Aktiv: 0 }
        })
      }

      return await tx.tblMeisterschaften.create({
        data: {
          Bezeichnung: String(body.Bezeichnung || ""),
          Beginn: beginn,
          Ende: ende,
          MeisterschaftstypID: Number(body.MeisterschaftstypID),
          TurboDBNummer: Number(body.TurboDBNummer || 0),
          Aktiv: isAktiv ? 1 : 0,
          Bemerkungen: String(body.Bemerkungen || ""),
        }
      })
    })
    
    const sql = `insert into tblMeisterschaften ...`
    await createChangeLogAction("tblMeisterschaften", "insert", sql)

    const serializableData = {
      ...data,
      Beginn: (data.Beginn instanceof Date && !isNaN(data.Beginn.getTime())) 
        ? data.Beginn.toISOString() 
        : null,
      Ende: (data.Ende instanceof Date && !isNaN(data.Ende.getTime())) 
        ? data.Ende.toISOString() 
        : null,
    }

    revalidatePath('/verwaltung/meisterschaften')
    revalidatePath('/verwaltung/eingabe')
    revalidatePath('/verwaltung/ausgabe')
    return { success: true, data: serializableData }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Erstellen der Meisterschaft' }
  }
}

export async function updateMeisterschaft(id: number, body: Prisma.tblMeisterschaftenUncheckedUpdateInput) {
  try {
    const updateData: any = {}
    if (body.Bezeichnung !== undefined) updateData.Bezeichnung = String(body.Bezeichnung)
    
    if (body.Beginn !== undefined) {
      const beginn = body.Beginn ? toUTCDate(body.Beginn as string | Date) : null
      if (!beginn) return { success: false, error: 'Ungültiges Startdatum' }
      updateData.Beginn = beginn
    }

    if (body.Ende !== undefined) {
      updateData.Ende = body.Ende ? toUTCDate(body.Ende as string | Date) : null
    }

    if (body.MeisterschaftstypID !== undefined) updateData.MeisterschaftstypID = Number(body.MeisterschaftstypID)
    if (body.TurboDBNummer !== undefined) updateData.TurboDBNummer = Number(body.TurboDBNummer)
    if (body.Aktiv !== undefined) updateData.Aktiv = Number(body.Aktiv)
    if (body.Bemerkungen !== undefined) updateData.Bemerkungen = String(body.Bemerkungen)

    const isAktiv = updateData.Aktiv === 1

    const data = await prisma.$transaction(async (tx) => {
      if (isAktiv) {
        await tx.tblMeisterschaften.updateMany({
          where: { 
            Aktiv: 1,
            ID: { not: id }
          },
          data: { Aktiv: 0 }
        })
      }

      return await tx.tblMeisterschaften.update({
        where: { ID: id },
        data: updateData
      })
    })

    const sql = `update tblMeisterschaften set ... where ID=${id}`
    await createChangeLogAction("tblMeisterschaften", "update", sql)

    const serializableData = {
      ...data,
      Beginn: (data.Beginn instanceof Date && !isNaN(data.Beginn.getTime())) 
        ? data.Beginn.toISOString() 
        : null,
      Ende: (data.Ende instanceof Date && !isNaN(data.Ende.getTime())) 
        ? data.Ende.toISOString() 
        : null,
    }

    revalidatePath('/verwaltung/meisterschaften')
    revalidatePath('/verwaltung/eingabe')
    revalidatePath('/verwaltung/ausgabe')
    return { success: true, data: serializableData }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Aktualisieren der Meisterschaft' }
  }
}

export async function deleteMeisterschaft(id: number) {
  try {
    await prisma.tblMeisterschaften.delete({ where: { ID: id } })
    await createChangeLogAction("tblMeisterschaften", "delete", `delete from tblMeisterschaften where ID=${id}`)
    revalidatePath('/verwaltung/meisterschaften')
    revalidatePath('/verwaltung/eingabe')
    revalidatePath('/verwaltung/ausgabe')
    return { success: true }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Löschen der Meisterschaft' }
  }
}

export async function getMeisterschaftstypen() {
  try {
    const data = await prisma.tblMeisterschaftstyp.findMany({
      orderBy: { ID: 'desc' }
    })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Fehler beim Abrufen der Meisterschaftstypen' }
  }
}

export async function createMeisterschaftstyp(meisterschaftstyp: string) {
  try {
    const data = await prisma.tblMeisterschaftstyp.create({
      data: { Meisterschaftstyp: meisterschaftstyp }
    })
    await createChangeLogAction("tblMeisterschaftstyp", "insert", `insert into tblMeisterschaftstyp ...`)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Fehler beim Erstellen des Meisterschaftstyps' }
  }
}

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
        Spitzname: m.Spitzname || "",
        NurHinrunde: t.NurHinrunde
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
    revalidatePath('/verwaltung/eingabe')
    revalidatePath('/verwaltung/ausgabe')
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Fehler beim Hinzufügen des Teilnehmers' }
  }
}

export async function removeTeilnehmer(meisterschaftId: number, mitgliedId: number) {
  try {
    // 1. Prüfen, ob der Spieler bereits Spiele in dieser Meisterschaft hat
    
    // Wir müssen alle Spieltage dieser Meisterschaft finden
    const spieltage = await prisma.tblSpieltag.findMany({
      where: { MeisterschaftsID: meisterschaftId },
      select: { ID: true }
    })
    const spieltagIds = spieltage.map(s => s.ID)

    let hatGespielt = false

    if (spieltagIds.length > 0) {
      // Prüfen in tblSpielMeisterschaft
      const spMeisterschaft = await prisma.tblSpielMeisterschaft.findFirst({
        where: {
          SpieltagID: { in: spieltagIds },
          OR: [
            { SpielerID1: mitgliedId },
            { SpielerID2: mitgliedId }
          ]
        }
      })

      // Prüfen in tblSpielBlitztunier
      const spBlitztunier = await prisma.tblSpielBlitztunier.findFirst({
        where: {
          SpieltagID: { in: spieltagIds },
          OR: [
            { SpielerID1: mitgliedId },
            { SpielerID2: mitgliedId }
          ]
        }
      })

      // Prüfen in tblSpielKombimeisterschaft (Hinweis: Laut Schema hat es SpielerID1/2, aber kein direktes Relation-Feld zu tblSpieltag? 
      // Doch, im Schema steht tblSpieltag am Ende der Datei als Relation in anderen Models, 
      // aber tblSpielKombimeisterschaft (Zeile 144) hat SpieltagID: Int, aber keine explizite Relation zu tblSpieltag im Prisma Model definiert?
      // Moment, Zeile 154/155 sind Relationen zu tblMitglieder.
      // Aber tblSpieltag (Zeile 202) hat KEINE Relation zu tblSpielKombimeisterschaft in seiner Liste (Zeile 207-212).
      // Das ist seltsam, aber die Tabelle hat eine SpieltagID. Wir können sie trotzdem abfragen.)
      const spKombimeisterschaft = await prisma.tblSpielKombimeisterschaft.findFirst({
        where: {
          SpieltagID: { in: spieltagIds },
          OR: [
            { SpielerID1: mitgliedId },
            { SpielerID2: mitgliedId }
          ]
        }
      })

      if (spMeisterschaft || spBlitztunier || spKombimeisterschaft) {
        hatGespielt = true
      }
    }

    if (hatGespielt) {
      // Nur Flag setzen
      await prisma.tblTeilnehmer.updateMany({
        where: {
          MeisterschaftsID: meisterschaftId,
          SpielerID: mitgliedId
        },
        data: {
          NurHinrunde: true
        }
      })
      await createChangeLogAction("tblTeilnehmer", "update", `update tblTeilnehmer set NurHinrunde=true where MeisterschaftsID=${meisterschaftId} and SpielerID=${mitgliedId} (Spieler hat bereits Spiele absolviert)`)
      revalidatePath('/verwaltung/meisterschaften')
      return { success: true, action: 'marked' }
    } else {
      // Löschen
      await prisma.tblTeilnehmer.deleteMany({
        where: {
          MeisterschaftsID: meisterschaftId,
          SpielerID: mitgliedId
        }
      })
      await createChangeLogAction("tblTeilnehmer", "delete", `delete from tblTeilnehmer where MeisterschaftsID=${meisterschaftId} and SpielerID=${mitgliedId}`)
      revalidatePath('/verwaltung/meisterschaften')
      revalidatePath('/verwaltung/eingabe')
      revalidatePath('/verwaltung/ausgabe')
      return { success: true, action: 'deleted' }
    }
  } catch (error) {
    console.error('Database error in removeTeilnehmer:', error)
    return { success: false, error: 'Fehler beim Entfernen des Teilnehmers' }
  }
}

export async function updateTeilnehmerNurHinrunde(meisterschaftId: number, mitgliedId: number, nurHinrunde: boolean) {
  try {
    await prisma.tblTeilnehmer.updateMany({
      where: {
        MeisterschaftsID: meisterschaftId,
        SpielerID: mitgliedId
      },
      data: {
        NurHinrunde: nurHinrunde
      }
    })
    await createChangeLogAction("tblTeilnehmer", "update", `update tblTeilnehmer set NurHinrunde=${nurHinrunde} where MeisterschaftsID=${meisterschaftId} and SpielerID=${mitgliedId}`)
    return { success: true }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Aktualisieren des NurHinrunde-Flags' }
  }
}
