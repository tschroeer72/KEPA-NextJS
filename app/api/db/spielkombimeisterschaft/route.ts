import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle spielkombimeisterschaft abrufen
export async function GET() {
  try {
    const dataSpielKombimeisterschaft = await prisma.tblSpielKombimeisterschaft.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpielKombimeisterschaft)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spielkombimeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen SpielKombimeisterschaft erstellen
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
    if (body.Spieler1Punkte3bis8 === undefined || body.Spieler1Punkte3bis8 === null) {
      return NextResponse.json(
        { error: 'Spieler1Punkte3bis8 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Spieler1Punkte5Kugeln === undefined || body.Spieler1Punkte5Kugeln === null) {
      return NextResponse.json(
        { error: 'Spieler1Punkte5Kugeln ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Spieler2Punkte3bis8 === undefined || body.Spieler2Punkte3bis8 === null) {
      return NextResponse.json(
        { error: 'Spieler2Punkte3bis8 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Spieler2Punkte5Kugeln === undefined || body.Spieler2Punkte5Kugeln === null) {
      return NextResponse.json(
        { error: 'Spieler2Punkte5Kugeln ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HinR_ckrunde === undefined || body.HinR_ckrunde === null) {
      return NextResponse.json(
        { error: 'HinR_ckrunde ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpielKombimeisterschaft = await prisma.tblSpielKombimeisterschaft.create({
      data: {
        SpieltagID: body.SpieltagID,
        SpielerID1: body.SpielerID1,
        SpielerID2: body.SpielerID2,
        Spieler1Punkte3bis8: body.Spieler1Punkte3bis8,
        Spieler1Punkte5Kugeln: body.Spieler1Punkte5Kugeln,
        Spieler2Punkte3bis8: body.Spieler2Punkte3bis8,
        Spieler2Punkte5Kugeln: body.Spieler2Punkte5Kugeln,
        HinR_ckrunde: body.HinR_ckrunde,
      }
    })

    return NextResponse.json(dataSpielKombimeisterschaft, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des SpielKombimeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
