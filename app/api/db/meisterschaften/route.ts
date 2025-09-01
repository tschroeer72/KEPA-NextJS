import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle meisterschaften abrufen
export async function GET() {
  try {
    const dataMeisterschaften = await prisma.tblMeisterschaften.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataMeisterschaften)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der meisterschaften' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Meisterschaften erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung - Nur für relevante Felder
    if (body.Bezeichnung === undefined || body.Bezeichnung === null) {
      return NextResponse.json(
        { error: 'Bezeichnung ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Beginn === undefined || body.Beginn === null) {
      return NextResponse.json(
        { error: 'Beginn ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Ende === undefined || body.Ende === null) {
      return NextResponse.json(
        { error: 'Ende ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.MeisterschaftstypID === undefined || body.MeisterschaftstypID === null) {
      return NextResponse.json(
        { error: 'MeisterschaftstypID ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.TurboDBNummer === undefined || body.TurboDBNummer === null) {
      return NextResponse.json(
        { error: 'TurboDBNummer ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Aktiv === undefined || body.Aktiv === null) {
      return NextResponse.json(
        { error: 'Aktiv ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Bemerkungen === undefined || body.Bemerkungen === null) {
      return NextResponse.json(
        { error: 'Bemerkungen ist erforderlich' },
        { status: 400 }
      )
    }

    const dataMeisterschaften = await prisma.tblMeisterschaften.create({
      data: {
        Bezeichnung: body.Bezeichnung,
        Beginn: body.Beginn,
        Ende: body.Ende,
        MeisterschaftstypID: body.MeisterschaftstypID,
        TurboDBNummer: body.TurboDBNummer,
        Aktiv: body.Aktiv,
        Bemerkungen: body.Bemerkungen,
      }
    })

    return NextResponse.json(dataMeisterschaften, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Meisterschaften' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
