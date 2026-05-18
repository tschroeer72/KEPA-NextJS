"use server"

import { prisma } from '@/lib/prisma'
import { createChangeLogAction } from '@/utils/change-log-action'
import { revalidatePath } from 'next/cache'
import { toUTCDate } from '@/lib/date-utils'
import type { Prisma } from '@prisma/client'

export async function getMitglieder() {
  try {
    const dataMitglieder = await prisma.tblMitglieder.findMany({
      select: {
        ID: true,
        Vorname: true,
        Nachname: true,
        Ehemaliger: true
      },
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
    const dataMitglieder = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        *,
        CASE WHEN Geburtsdatum = '0000-00-00 00:00:00' THEN NULL ELSE Geburtsdatum END as Geburtsdatum,
        CASE WHEN MitgliedSeit = '0000-00-00 00:00:00' THEN NULL ELSE MitgliedSeit END as MitgliedSeit,
        CASE WHEN PassivSeit = '0000-00-00 00:00:00' THEN NULL ELSE PassivSeit END as PassivSeit,
        CASE WHEN AusgeschiedenAm = '0000-00-00 00:00:00' THEN NULL ELSE AusgeschiedenAm END as AusgeschiedenAm
      FROM tblMitglieder 
      WHERE Ehemaliger = 0 AND (PassivSeit IS NULL OR PassivSeit = '0000-00-00 00:00:00')
      ORDER BY Nachname asc
    `);

    const transformedData = dataMitglieder.map((m: any) => ({
      ID: m.ID,
      Anzeigename: m.Spitzname ? `${m.Vorname} "${m.Spitzname}" ${m.Nachname}` : `${m.Vorname} ${m.Nachname}`,
      Vorname: m.Vorname,
      Nachname: m.Nachname,
      Spitzname: m.Spitzname || "",
      Strasse: m.Strasse || "",
      PLZ: m.PLZ || "",
      Ort: m.Ort || "",
      Geburtsdatum: (m.Geburtsdatum instanceof Date && !isNaN(m.Geburtsdatum.getTime())) 
        ? m.Geburtsdatum.toISOString() 
        : null,
      MitgliedSeit: (m.MitgliedSeit instanceof Date && !isNaN(m.MitgliedSeit.getTime())) 
        ? m.MitgliedSeit.toISOString() 
        : null,
      PassivSeit: (m.PassivSeit instanceof Date && !isNaN(m.PassivSeit.getTime())) 
        ? m.PassivSeit.toISOString() 
        : null,
      AusgeschiedenAm: (m.AusgeschiedenAm instanceof Date && !isNaN(m.AusgeschiedenAm.getTime())) 
        ? m.AusgeschiedenAm.toISOString() 
        : null,
      EMail: m.EMail || "",
      TelefonMobil: m.TelefonMobil || "",
      TelefonPrivat: m.TelefonPrivat || ""
    }))

    return { success: true, data: transformedData }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Abrufen der aktiven Mitglieder' }
  }
}

export async function getAlleMitglieder() {
  try {
    const dataMitglieder = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        *,
        CASE WHEN Geburtsdatum = '0000-00-00 00:00:00' THEN NULL ELSE Geburtsdatum END as Geburtsdatum,
        CASE WHEN MitgliedSeit = '0000-00-00 00:00:00' THEN NULL ELSE MitgliedSeit END as MitgliedSeit,
        CASE WHEN PassivSeit = '0000-00-00 00:00:00' THEN NULL ELSE PassivSeit END as PassivSeit,
        CASE WHEN AusgeschiedenAm = '0000-00-00 00:00:00' THEN NULL ELSE AusgeschiedenAm END as AusgeschiedenAm
      FROM tblMitglieder 
      ORDER BY Nachname asc
    `);

    const transformedData = dataMitglieder.map((m: any) => ({
      ID: m.ID,
      Anzeigename: m.Spitzname ? `${m.Vorname} "${m.Spitzname}" ${m.Nachname}` : `${m.Vorname} ${m.Nachname}`,
      Vorname: m.Vorname,
      Nachname: m.Nachname,
      Spitzname: m.Spitzname || "",
      Strasse: m.Strasse || "",
      PLZ: m.PLZ || "",
      Ort: m.Ort || "",
      Geburtsdatum: (m.Geburtsdatum instanceof Date && !isNaN(m.Geburtsdatum.getTime())) 
        ? m.Geburtsdatum.toISOString() 
        : null,
      MitgliedSeit: (m.MitgliedSeit instanceof Date && !isNaN(m.MitgliedSeit.getTime())) 
        ? m.MitgliedSeit.toISOString() 
        : null,
      PassivSeit: (m.PassivSeit instanceof Date && !isNaN(m.PassivSeit.getTime())) 
        ? m.PassivSeit.toISOString() 
        : null,
      AusgeschiedenAm: (m.AusgeschiedenAm instanceof Date && !isNaN(m.AusgeschiedenAm.getTime())) 
        ? m.AusgeschiedenAm.toISOString() 
        : null,
      EMail: m.EMail || "",
      TelefonMobil: m.TelefonMobil || "",
      TelefonPrivat: m.TelefonPrivat || ""
    }))

    return { success: true, data: transformedData }
  } catch (error) {
    console.error('Database error:', error)
    return { success: false, error: 'Fehler beim Abrufen aller Mitglieder' }
  }
}

export async function getMitgliedById(id: number) {
  try {
    console.log('getMitgliedById aufgerufen für ID:', id)
    
    // Wir nutzen queryRaw, um problematische Datumsfelder direkt in SQL abzufangen
    // Wenn ein Datum '0000-00-00' ist, liefert MySQL bei CAST oder IFNULL oft Probleme mit dem Prisma-Adapter.
    // Sicherster Weg: Wir prüfen auf das "Null-Datum" im SQL.
    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        *,
        CASE WHEN Geburtsdatum = '0000-00-00 00:00:00' THEN NULL ELSE Geburtsdatum END as Geburtsdatum,
        CASE WHEN MitgliedSeit = '0000-00-00 00:00:00' THEN NULL ELSE MitgliedSeit END as MitgliedSeit,
        CASE WHEN PassivSeit = '0000-00-00 00:00:00' THEN NULL ELSE PassivSeit END as PassivSeit,
        CASE WHEN AusgeschiedenAm = '0000-00-00 00:00:00' THEN NULL ELSE AusgeschiedenAm END as AusgeschiedenAm
      FROM tblMitglieder 
      WHERE ID = ${id}
      LIMIT 1
    `);

    const m = results && results.length > 0 ? results[0] : null;

    if (!m) {
      console.warn('Mitglied nicht gefunden für ID:', id)
      return { success: false, error: 'Mitglied nicht gefunden' }
    }

    // console.log('Mitglied geladen (Raw):', {
    //   ID: m.ID,
    //   Geburtsdatum: m.Geburtsdatum,
    //   MitgliedSeit: m.MitgliedSeit,
    //   PassivSeit: m.PassivSeit,
    //   AusgeschiedenAm: m.AusgeschiedenAm
    // })

    const serializableMitglied = {
      ...m,
      // Boolean Konvertierung für MariaDB (Bit(1) wird oft als Buffer oder Zahl geliefert)
      Ehemaliger: m.Ehemaliger === 1 || m.Ehemaliger === true || (Buffer.isBuffer(m.Ehemaliger) && m.Ehemaliger[0] === 1),
      Geburtsdatum: (m.Geburtsdatum instanceof Date && !isNaN(m.Geburtsdatum.getTime())) 
        ? m.Geburtsdatum.toISOString() 
        : null,
      MitgliedSeit: (m.MitgliedSeit instanceof Date && !isNaN(m.MitgliedSeit.getTime())) 
        ? m.MitgliedSeit.toISOString() 
        : null,
      PassivSeit: (m.PassivSeit instanceof Date && !isNaN(m.PassivSeit.getTime())) 
        ? m.PassivSeit.toISOString() 
        : null,
      AusgeschiedenAm: (m.AusgeschiedenAm instanceof Date && !isNaN(m.AusgeschiedenAm.getTime())) 
        ? m.AusgeschiedenAm.toISOString() 
        : null,
    }
    
    if (!serializableMitglied.ID) {
        throw new Error("Serialisierung fehlgeschlagen: ID fehlt");
    }

    console.log('Mitglied erfolgreich serialisiert:', serializableMitglied.ID)
    return { success: true, data: serializableMitglied }
  } catch (error: any) {
    console.error('Database error in getMitgliedById für ID ' + id + ':', error)
    return { success: false, error: 'Fehler beim Abrufen des Mitglieds: ' + error.message }
  }
}

export async function createMitglied(body: Prisma.tblMitgliederUncheckedCreateInput) {
  try {
    if (!body.Vorname || !body.Nachname || !body.MitgliedSeit) {
      return { success: false, error: 'Pflichtfelder fehlen' }
    }

    const m = await prisma.tblMitglieder.create({
      data: {
        Vorname: String(body.Vorname),
        Nachname: String(body.Nachname),
        Spitzname: String(body.Spitzname || ""),
        Strasse: String(body.Strasse || ""),
        PLZ: String(body.PLZ || ""),
        Ort: String(body.Ort || ""),
        Geburtsdatum: toUTCDate(body.Geburtsdatum as string | Date),
        MitgliedSeit: toUTCDate(body.MitgliedSeit as string | Date) || toUTCDate(new Date())!,
        PassivSeit: toUTCDate(body.PassivSeit as string | Date),
        AusgeschiedenAm: toUTCDate(body.AusgeschiedenAm as string | Date),
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
    
    const serializableMitglied = {
      ...m,
      Geburtsdatum: (m.Geburtsdatum instanceof Date && !isNaN(m.Geburtsdatum.getTime())) 
        ? m.Geburtsdatum.toISOString() 
        : null,
      MitgliedSeit: (m.MitgliedSeit instanceof Date && !isNaN(m.MitgliedSeit.getTime())) 
        ? m.MitgliedSeit.toISOString() 
        : null,
      PassivSeit: (m.PassivSeit instanceof Date && !isNaN(m.PassivSeit.getTime())) 
        ? m.PassivSeit.toISOString() 
        : null,
      AusgeschiedenAm: (m.AusgeschiedenAm instanceof Date && !isNaN(m.AusgeschiedenAm.getTime())) 
        ? m.AusgeschiedenAm.toISOString() 
        : null,
    }

    const insertCommand = `insert into tblMitglieder(ID, Vorname, Nachname, ...) values (${m.ID}, '${body.Vorname}', '${body.Nachname}', ...)`
    await createChangeLogAction("tblMitglieder", "insert", insertCommand)

    revalidatePath('/verwaltung/mitglieder')
    return { success: true, data: serializableMitglied }
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

    if (body.Geburtsdatum !== undefined) updateData.Geburtsdatum = toUTCDate(body.Geburtsdatum as string | Date)
    if (body.MitgliedSeit !== undefined) {
      updateData.MitgliedSeit = toUTCDate(body.MitgliedSeit as string | Date) || undefined
    }
    if (body.PassivSeit !== undefined) updateData.PassivSeit = toUTCDate(body.PassivSeit as string | Date)
    if (body.AusgeschiedenAm !== undefined) updateData.AusgeschiedenAm = toUTCDate(body.AusgeschiedenAm as string | Date)
    if (body.Ehemaliger !== undefined) updateData.Ehemaliger = Boolean(body.Ehemaliger)

    const numericFields = ['SpAnz', 'SpGew', 'SpUn', 'SpVerl', 'HolzGes', 'HolzMax', 'HolzMin', 'Punkte', 'TurboDBNummer']
    numericFields.forEach(f => {
      if ((body as any)[f] !== undefined) updateData[f] = Number((body as any)[f] || 0)
    })

    const m = await prisma.tblMitglieder.update({
      where: { ID: id },
      data: updateData
    })

    const serializableMitglied = {
      ...m,
      Geburtsdatum: (m.Geburtsdatum instanceof Date && !isNaN(m.Geburtsdatum.getTime())) 
        ? m.Geburtsdatum.toISOString() 
        : null,
      MitgliedSeit: (m.MitgliedSeit instanceof Date && !isNaN(m.MitgliedSeit.getTime())) 
        ? m.MitgliedSeit.toISOString() 
        : null,
      PassivSeit: (m.PassivSeit instanceof Date && !isNaN(m.PassivSeit.getTime())) 
        ? m.PassivSeit.toISOString() 
        : null,
      AusgeschiedenAm: (m.AusgeschiedenAm instanceof Date && !isNaN(m.AusgeschiedenAm.getTime())) 
        ? m.AusgeschiedenAm.toISOString() 
        : null,
    }

    const updateCommand = `update tblMitglieder set ... where ID=${id}`
    await createChangeLogAction("tblMitglieder", "update", updateCommand)

    revalidatePath('/verwaltung/mitglieder')
    return { success: true, data: serializableMitglied }
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
