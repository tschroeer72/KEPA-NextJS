import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// GET - Alle mitglieder abrufen
export async function GET() {
  try {
    const dataMitglieder = await prisma.tblMitglieder.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataMitglieder)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der mitglieder' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Mitglieder erstellen
export async function POST(request: NextRequest) {
  try {
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
    // Validierung - Nur für erforderliche Felder
    if (body.Vorname === undefined || body.Vorname === null) {
      return NextResponse.json(
        { error: 'Vorname ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Nachname === undefined || body.Nachname === null) {
      return NextResponse.json(
        { error: 'Nachname ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.MitgliedSeit === undefined || body.MitgliedSeit === null) {
      return NextResponse.json(
        { error: 'MitgliedSeit ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Ehemaliger === undefined || body.Ehemaliger === null) {
      return NextResponse.json(
        { error: 'Ehemaliger ist erforderlich' },
        { status: 400 }
      )
    }

    const dataMitglieder = await prisma.tblMitglieder.create({
      data: {
        Vorname: String(body.Vorname),
        Nachname: String(body.Nachname),
        Spitzname: String(body.Spitzname),
        Strasse: String(body.Strasse),
        PLZ: String(body.PLZ),
        Ort: String(body.Ort),
        Geburtsdatum: new Date(body.Geburtsdatum as string | number | Date),
        MitgliedSeit: new Date(body.MitgliedSeit as string | number | Date),
        PassivSeit: new Date(body.PassivSeit as string | number | Date),
        AusgeschiedenAm: new Date(body.AusgeschiedenAm as string | number | Date),
        Ehemaliger: Boolean(body.Ehemaliger),
        Notizen: String(body.Notizen),
        Bemerkungen: String(body.Bemerkungen),
        Anrede: String(body.Anrede),
        EMail: String(body.EMail),
        TelefonPrivat: String(body.TelefonPrivat),
        TelefonFirma: String(body.TelefonFirma),
        TelefonMobil: String(body.TelefonMobil),
        Fax: String(body.Fax),
        SpAnz: Number(body.SpAnz),
        SpGew: Number(body.SpGew),
        SpUn: Number(body.SpUn),
        SpVerl: Number(body.SpVerl),
        HolzGes: Number(body.HolzGes),
        HolzMax: Number(body.HolzMax),
        HolzMin: Number(body.HolzMin),
        Punkte: Number(body.Punkte),
        Platz: String(body.Platz),
        TurboDBNummer: Number(body.TurboDBNummer),
        Login: String(body.Login),
        Password: String(body.Password),
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblMitglieder(ID, Vorname, Nachname, Spitzname, Strasse, PLZ, Ort, Geburtsdatum, MitgliedSeit, PassivSeit, AusgeschiedenAm, Ehemaliger, Notizen, Bemerkungen, Anrede, EMail, TelefonPrivat, TelefonFirma, TelefonMobil, Fax, SpAnz, SpGew, SpUn, SpVerl, HolzGes, HolzMax, HolzMin, Punkte, Platz, TurboDBNummer, Login, Password) values (${dataMitglieder.ID}, '${body.Vorname}', '${body.Nachname}', '${body.Spitzname}', '${body.Strasse}', '${body.PLZ}', '${body.Ort}', '${new Date(body.Geburtsdatum as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}', '${new Date(body.MitgliedSeit as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}', '${new Date(body.PassivSeit as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}', '${new Date(body.AusgeschiedenAm as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}', ${body.Ehemaliger ? 1 : 0}, '${body.Notizen}', '${body.Bemerkungen}', '${body.Anrede}', '${body.EMail}', '${body.TelefonPrivat}', '${body.TelefonFirma}', '${body.TelefonMobil}', '${body.Fax}', ${body.SpAnz}, ${body.SpGew}, ${body.SpUn}, ${body.SpVerl}, ${body.HolzGes}, ${body.HolzMax}, ${body.HolzMin}, ${body.Punkte}, '${body.Platz}', ${body.TurboDBNummer}, '${body.Login}', '${body.Password}')`
    await CreateChangeLogAsync(request, "tblMitglieder", "insert", insertCommand)

    return NextResponse.json(dataMitglieder, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Mitglieder' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
