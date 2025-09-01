import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle spiel6tagerennen abrufen
export async function GET() {
  try {
    const dataSpiel6TageRennen = await prisma.tblSpiel6TageRennen.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpiel6TageRennen)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spiel6tagerennen' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Spiel6TageRennen erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung - Nur für relevante Felder
    if (body.SpieltagID === undefined || body.SpieltagID === null) {
      return NextResponse.json(
        { error: 'SpieltagID ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.SpielerID1 === undefined || body.SpielerID1 === null) {
      return NextResponse.json(
        { error: 'SpielerID1 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.SpielerID2 === undefined || body.SpielerID2 === null) {
      return NextResponse.json(
        { error: 'SpielerID2 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Runden === undefined || body.Runden === null) {
      return NextResponse.json(
        { error: 'Runden ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Punkte === undefined || body.Punkte === null) {
      return NextResponse.json(
        { error: 'Punkte ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Spielnummer === undefined || body.Spielnummer === null) {
      return NextResponse.json(
        { error: 'Spielnummer ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpiel6TageRennen = await prisma.tblSpiel6TageRennen.create({
      data: {
        SpieltagID: body.SpieltagID,
        SpielerID1: body.SpielerID1,
        SpielerID2: body.SpielerID2,
        Runden: body.Runden,
        Punkte: body.Punkte,
        Spielnummer: body.Spielnummer,
      }
    })

    return NextResponse.json(dataSpiel6TageRennen, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Spiel6TageRennen' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
