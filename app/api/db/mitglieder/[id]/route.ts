import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen Mitglieder abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    const dataMitglieder = await prisma.tblMitglieder.findUnique({
      where: { ID: id }
    })

    if (!dataMitglieder) {
      return NextResponse.json(
        { error: 'Mitglieder nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataMitglieder)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Mitglieder' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Mitglieder aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    const body = await request.json()
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    // Prüfen ob Mitglieder existiert
    const existingMitglieder = await prisma.tblMitglieder.findUnique({
      where: { ID: id }
    })

    if (!existingMitglieder) {
      return NextResponse.json(
        { error: 'Mitglieder nicht gefunden' },
        { status: 404 }
      )
    }

    const dataMitglieder = await prisma.tblMitglieder.update({
      where: { ID: id },
      data: {
        ...(body.Vorname !== undefined && { Vorname: body.Vorname }),
        ...(body.Nachname !== undefined && { Nachname: body.Nachname }),
        ...(body.Spitzname !== undefined && { Spitzname: body.Spitzname }),
        ...(body.Strasse !== undefined && { Strasse: body.Strasse }),
        ...(body.PLZ !== undefined && { PLZ: body.PLZ }),
        ...(body.Ort !== undefined && { Ort: body.Ort }),
        ...(body.Geburtsdatum !== undefined && { Geburtsdatum: body.Geburtsdatum }),
        ...(body.MitgliedSeit !== undefined && { MitgliedSeit: body.MitgliedSeit }),
        ...(body.PassivSeit !== undefined && { PassivSeit: body.PassivSeit }),
        ...(body.AusgeschiedenAm !== undefined && { AusgeschiedenAm: body.AusgeschiedenAm }),
        ...(body.Ehemaliger !== undefined && { Ehemaliger: body.Ehemaliger }),
        ...(body.Notizen !== undefined && { Notizen: body.Notizen }),
        ...(body.Bemerkungen !== undefined && { Bemerkungen: body.Bemerkungen }),
        ...(body.Anrede !== undefined && { Anrede: body.Anrede }),
        ...(body.EMail !== undefined && { EMail: body.EMail }),
        ...(body.TelefonPrivat !== undefined && { TelefonPrivat: body.TelefonPrivat }),
        ...(body.TelefonFirma !== undefined && { TelefonFirma: body.TelefonFirma }),
        ...(body.TelefonMobil !== undefined && { TelefonMobil: body.TelefonMobil }),
        ...(body.Fax !== undefined && { Fax: body.Fax }),
        ...(body.SpAnz !== undefined && { SpAnz: body.SpAnz }),
        ...(body.SpGew !== undefined && { SpGew: body.SpGew }),
        ...(body.SpUn !== undefined && { SpUn: body.SpUn }),
        ...(body.SpVerl !== undefined && { SpVerl: body.SpVerl }),
        ...(body.HolzGes !== undefined && { HolzGes: body.HolzGes }),
        ...(body.HolzMax !== undefined && { HolzMax: body.HolzMax }),
        ...(body.HolzMin !== undefined && { HolzMin: body.HolzMin }),
        ...(body.Punkte !== undefined && { Punkte: body.Punkte }),
        ...(body.Platz !== undefined && { Platz: body.Platz }),
        ...(body.TurboDBNummer !== undefined && { TurboDBNummer: body.TurboDBNummer }),
        ...(body.Login !== undefined && { Login: body.Login }),
        ...(body.Password !== undefined && { Password: body.Password }),
      }
    })

    return NextResponse.json(dataMitglieder)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Mitglieder' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Mitglieder löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    // Prüfen ob Mitglieder existiert
    const existingMitglieder = await prisma.tblMitglieder.findUnique({
      where: { ID: id }
    })

    if (!existingMitglieder) {
      return NextResponse.json(
        { error: 'Mitglieder nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblMitglieder.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'Mitglieder erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Mitglieder' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
