"use server"

import { prisma } from '@/lib/prisma'
import { createChangeLogAction } from '@/utils/change-log-action'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'

export async function getMitglieder() {
  try {
    const dataMitglieder = await prisma.tblMitglieder.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return { success: true, data: dataMitglieder }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Abrufen der Mitglieder' }
  }
}

export async function getAktiveMitglieder() {
  try {
    const dataMitglieder = await prisma.tblMitglieder.findMany({
      where: {
        Ehemaliger: false
      },
      orderBy: {
        Nachname: 'asc'
      }
    })

    const transformedData = dataMitglieder.map((m: any) => ({
      ID: m.ID,
      Anzeigename: m.Spitzname ? `${m.Vorname} "${m.Spitzname}" ${m.Nachname}` : `${m.Vorname} ${m.Nachname}`,
      Vorname: m.Vorname,
      Nachname: m.Nachname,
      Spitzname: m.Spitzname || ""
    }))

    return { success: true, data: transformedData }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Abrufen der aktiven Mitglieder' }
  }
}

export async function getMitgliedById(id: number) {
  try {
    const dataMitglieder = await prisma.tblMitglieder.findUnique({
      where: { ID: id }
    })
    if (!dataMitglieder) {
      return { success: false, error: 'Mitglied nicht gefunden' }
    }
    return { success: true, data: dataMitglieder }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Abrufen des Mitglieds' }
  }
}

export async function createMitglied(body: Prisma.tblMitgliederUncheckedCreateInput) {
  try {
    if (!body.Vorname || !body.Nachname || !body.MitgliedSeit) {
      return { success: false, error: 'Pflichtfelder fehlen' }
    }

    const dataMitglieder = await prisma.tblMitglieder.create({
      data: {
        Vorname: String(body.Vorname),
        Nachname: String(body.Nachname),
        Spitzname: String(body.Spitzname || ""),
        Strasse: String(body.Strasse || ""),
        PLZ: String(body.PLZ || ""),
        Ort: String(body.Ort || ""),
        Geburtsdatum: body.Geburtsdatum ? new Date(body.Geburtsdatum) : null,
        MitgliedSeit: new Date(body.MitgliedSeit),
        PassivSeit: body.PassivSeit ? new Date(body.PassivSeit) : null,
        AusgeschiedenAm: body.AusgeschiedenAm ? new Date(body.AusgeschiedenAm) : null,
        Ehemaliger: Boolean(body.Ehemaliger),
        Notizen: String(body.Notizen || ""),
        Bemerkungen: String(body.Bemerkungen || ""),
        Anrede: String(body.Anrede || ""),
        EMail: String(body.EMail || ""),
        TelefonPrivat: String(body.TelefonPrivat || ""),
        TelefonFirma: String(body.TelefonFirma || ""),
        TelefonMobil: String(body.TelefonMobil || ""),
        Fax: String(body.Fax || ""),
        SpAnz: Number(body.SpAnz || 0),
        SpGew: Number(body.SpGew || 0),
        SpUn: Number(body.SpUn || 0),
        SpVerl: Number(body.SpVerl || 0),
        HolzGes: Number(body.HolzGes || 0),
        HolzMax: Number(body.HolzMax || 0),
        HolzMin: Number(body.HolzMin || 0),
        Punkte: Number(body.Punkte || 0),
        Platz: String(body.Platz || ""),
        TurboDBNummer: Number(body.TurboDBNummer || 0),
        Login: String(body.Login || ""),
        Password: String(body.Password || ""),
      }
    })
    
    const insertCommand = `insert into tblMitglieder(ID, Vorname, Nachname, ...) values (${dataMitglieder.ID}, '${body.Vorname}', '${body.Nachname}', ...)`
    await createChangeLogAction("tblMitglieder", "insert", insertCommand)

    revalidatePath('/verwaltung/mitglieder')
    return { success: true, data: dataMitglieder }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Erstellen des Mitglieds' }
  }
}

export async function updateMitglied(id: number, body: Prisma.tblMitgliederUncheckedUpdateInput) {
  try {
    const updateData: any = {}
    const fields = [
      'Vorname', 'Nachname', 'Spitzname', 'Strasse', 'PLZ', 'Ort', 
      'Notizen', 'Bemerkungen', 'Anrede', 'EMail', 'TelefonPrivat', 
      'TelefonFirma', 'TelefonMobil', 'Fax', 'Platz', 'Login', 'Password'
    ]
    
    fields.forEach(f => {
      if ((body as any)[f] !== undefined) updateData[f] = String((body as any)[f] || "")
    })

    if (body.Geburtsdatum !== undefined) updateData.Geburtsdatum = body.Geburtsdatum ? new Date(body.Geburtsdatum as string | Date) : null
    if (body.MitgliedSeit !== undefined) {
      if (body.MitgliedSeit === null) {
        // MitgliedSeit is mandatory in schema, but for safety in update:
        updateData.MitgliedSeit = undefined
      } else {
        updateData.MitgliedSeit = new Date(body.MitgliedSeit as string | Date)
      }
    }
    if (body.PassivSeit !== undefined) updateData.PassivSeit = body.PassivSeit ? new Date(body.PassivSeit as string | Date) : null
    if (body.AusgeschiedenAm !== undefined) updateData.AusgeschiedenAm = body.AusgeschiedenAm ? new Date(body.AusgeschiedenAm as string | Date) : null
    if (body.Ehemaliger !== undefined) updateData.Ehemaliger = Boolean(body.Ehemaliger)

    const numericFields = ['SpAnz', 'SpGew', 'SpUn', 'SpVerl', 'HolzGes', 'HolzMax', 'HolzMin', 'Punkte', 'TurboDBNummer']
    numericFields.forEach(f => {
      if ((body as any)[f] !== undefined) updateData[f] = Number((body as any)[f] || 0)
    })

    const dataMitglieder = await prisma.tblMitglieder.update({
      where: { ID: id },
      data: updateData
    })

    const updateCommand = `update tblMitglieder set ... where ID=${id}`
    await createChangeLogAction("tblMitglieder", "update", updateCommand)

    revalidatePath('/verwaltung/mitglieder')
    return { success: true, data: dataMitglieder }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Aktualisieren des Mitglieds' }
  }
}

export async function deleteMitglied(id: number) {
  try {
    await prisma.tblMitglieder.delete({
      where: { ID: id }
    })

    const deleteCommand = `delete from tblMitglieder where ID=${id}`
    await createChangeLogAction("tblMitglieder", "delete", deleteCommand)

    revalidatePath('/verwaltung/mitglieder')
    return { success: true }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Löschen des Mitglieds' }
  }
}
