"use server"

import { prisma } from '@/lib/prisma'
import { createChangeLogAction } from '@/utils/change-log-action'
import { revalidatePath } from 'next/cache'
import { tblMeisterschaften } from '@prisma/client'

export async function getMeisterschaften() {
  try {
    const data = await prisma.tblMeisterschaften.findMany({
      orderBy: { ID: 'desc' },
      include: {
        tblMeisterschaftstyp: true
      }
    })
    return { success: true, data }
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
    return { success: true, data }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Abrufen der Meisterschaft' }
  }
}

export async function createMeisterschaft(body: Partial<tblMeisterschaften>) {
  try {
    const data = await prisma.tblMeisterschaften.create({
      data: {
        Bezeichnung: String(body.Bezeichnung || ""),
        Beginn: body.Beginn ? new Date(body.Beginn) : new Date(),
        Ende: body.Ende ? new Date(body.Ende) : null,
        MeisterschaftstypID: Number(body.MeisterschaftstypID),
        TurboDBNummer: Number(body.TurboDBNummer || 0),
        Aktiv: Number(body.Aktiv || 0),
        Bemerkungen: String(body.Bemerkungen || ""),
      }
    })
    
    const sql = `insert into tblMeisterschaften ...`
    await createChangeLogAction("tblMeisterschaften", "insert", sql)

    revalidatePath('/verwaltung/meisterschaften')
    return { success: true, data }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Erstellen der Meisterschaft' }
  }
}

export async function updateMeisterschaft(id: number, body: Partial<tblMeisterschaften>) {
  try {
    const updateData: Partial<tblMeisterschaften> = {}
    if (body.Bezeichnung !== undefined) updateData.Bezeichnung = String(body.Bezeichnung)
    if (body.Beginn !== undefined) updateData.Beginn = new Date(body.Beginn)
    if (body.Ende !== undefined) updateData.Ende = body.Ende ? new Date(body.Ende) : null
    if (body.MeisterschaftstypID !== undefined) updateData.MeisterschaftstypID = Number(body.MeisterschaftstypID)
    if (body.TurboDBNummer !== undefined) updateData.TurboDBNummer = Number(body.TurboDBNummer)
    if (body.Aktiv !== undefined) updateData.Aktiv = Number(body.Aktiv)
    if (body.Bemerkungen !== undefined) updateData.Bemerkungen = String(body.Bemerkungen)

    const data = await prisma.tblMeisterschaften.update({
      where: { ID: id },
      data: updateData
    })

    const sql = `update tblMeisterschaften set ... where ID=${id}`
    await createChangeLogAction("tblMeisterschaften", "update", sql)

    revalidatePath('/verwaltung/meisterschaften')
    return { success: true, data }
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
