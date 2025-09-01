import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

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
  } catch (error) {
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
    const body = await request.json()
    
    // Validierung - Nur für relevante Felder
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
    if (body.Spitzname === undefined || body.Spitzname === null) {
      return NextResponse.json(
        { error: 'Spitzname ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Strasse === undefined || body.Strasse === null) {
      return NextResponse.json(
        { error: 'Strasse ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.PLZ === undefined || body.PLZ === null) {
      return NextResponse.json(
        { error: 'PLZ ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Ort === undefined || body.Ort === null) {
      return NextResponse.json(
        { error: 'Ort ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Geburtsdatum === undefined || body.Geburtsdatum === null) {
      return NextResponse.json(
        { error: 'Geburtsdatum ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.MitgliedSeit === undefined || body.MitgliedSeit === null) {
      return NextResponse.json(
        { error: 'MitgliedSeit ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.PassivSeit === undefined || body.PassivSeit === null) {
      return NextResponse.json(
        { error: 'PassivSeit ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.AusgeschiedenAm === undefined || body.AusgeschiedenAm === null) {
      return NextResponse.json(
        { error: 'AusgeschiedenAm ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Ehemaliger === undefined || body.Ehemaliger === null) {
      return NextResponse.json(
        { error: 'Ehemaliger ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Notizen === undefined || body.Notizen === null) {
      return NextResponse.json(
        { error: 'Notizen ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Bemerkungen === undefined || body.Bemerkungen === null) {
      return NextResponse.json(
        { error: 'Bemerkungen ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Anrede === undefined || body.Anrede === null) {
      return NextResponse.json(
        { error: 'Anrede ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.EMail === undefined || body.EMail === null) {
      return NextResponse.json(
        { error: 'EMail ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.TelefonPrivat === undefined || body.TelefonPrivat === null) {
      return NextResponse.json(
        { error: 'TelefonPrivat ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.TelefonFirma === undefined || body.TelefonFirma === null) {
      return NextResponse.json(
        { error: 'TelefonFirma ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.TelefonMobil === undefined || body.TelefonMobil === null) {
      return NextResponse.json(
        { error: 'TelefonMobil ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Fax === undefined || body.Fax === null) {
      return NextResponse.json(
        { error: 'Fax ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.SpAnz === undefined || body.SpAnz === null) {
      return NextResponse.json(
        { error: 'SpAnz ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.SpGew === undefined || body.SpGew === null) {
      return NextResponse.json(
        { error: 'SpGew ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.SpUn === undefined || body.SpUn === null) {
      return NextResponse.json(
        { error: 'SpUn ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.SpVerl === undefined || body.SpVerl === null) {
      return NextResponse.json(
        { error: 'SpVerl ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HolzGes === undefined || body.HolzGes === null) {
      return NextResponse.json(
        { error: 'HolzGes ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HolzMax === undefined || body.HolzMax === null) {
      return NextResponse.json(
        { error: 'HolzMax ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HolzMin === undefined || body.HolzMin === null) {
      return NextResponse.json(
        { error: 'HolzMin ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Punkte === undefined || body.Punkte === null) {
      return NextResponse.json(
        { error: 'Punkte ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Platz === undefined || body.Platz === null) {
      return NextResponse.json(
        { error: 'Platz ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.TurboDBNummer === undefined || body.TurboDBNummer === null) {
      return NextResponse.json(
        { error: 'TurboDBNummer ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Login === undefined || body.Login === null) {
      return NextResponse.json(
        { error: 'Login ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Password === undefined || body.Password === null) {
      return NextResponse.json(
        { error: 'Password ist erforderlich' },
        { status: 400 }
      )
    }

    const dataMitglieder = await prisma.tblMitglieder.create({
      data: {
        Vorname: body.Vorname,
        Nachname: body.Nachname,
        Spitzname: body.Spitzname,
        Strasse: body.Strasse,
        PLZ: body.PLZ,
        Ort: body.Ort,
        Geburtsdatum: body.Geburtsdatum,
        MitgliedSeit: body.MitgliedSeit,
        PassivSeit: body.PassivSeit,
        AusgeschiedenAm: body.AusgeschiedenAm,
        Ehemaliger: body.Ehemaliger,
        Notizen: body.Notizen,
        Bemerkungen: body.Bemerkungen,
        Anrede: body.Anrede,
        EMail: body.EMail,
        TelefonPrivat: body.TelefonPrivat,
        TelefonFirma: body.TelefonFirma,
        TelefonMobil: body.TelefonMobil,
        Fax: body.Fax,
        SpAnz: body.SpAnz,
        SpGew: body.SpGew,
        SpUn: body.SpUn,
        SpVerl: body.SpVerl,
        HolzGes: body.HolzGes,
        HolzMax: body.HolzMax,
        HolzMin: body.HolzMin,
        Punkte: body.Punkte,
        Platz: body.Platz,
        TurboDBNummer: body.TurboDBNummer,
        Login: body.Login,
        Password: body.Password,
      }
    })

    return NextResponse.json(dataMitglieder, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Mitglieder' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
