import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle spielmeisterschaft abrufen
export async function GET() {
  try {
    const dataSpielMeisterschaft = await prisma.tblSpielMeisterschaft.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpielMeisterschaft)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spielmeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen SpielMeisterschaft erstellen
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
    if (body.HolzSpieler1 === undefined || body.HolzSpieler1 === null) {
      return NextResponse.json(
        { error: 'HolzSpieler1 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HolzSpieler2 === undefined || body.HolzSpieler2 === null) {
      return NextResponse.json(
        { error: 'HolzSpieler2 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HinR_ckrunde === undefined || body.HinR_ckrunde === null) {
      return NextResponse.json(
        { error: 'HinR_ckrunde ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpielMeisterschaft = await prisma.tblSpielMeisterschaft.create({
      data: {
        SpieltagID: body.SpieltagID,
        SpielerID1: body.SpielerID1,
        SpielerID2: body.SpielerID2,
        HolzSpieler1: body.HolzSpieler1,
        HolzSpieler2: body.HolzSpieler2,
        HinR_ckrunde: body.HinR_ckrunde,
      }
    })

    return NextResponse.json(dataSpielMeisterschaft, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des SpielMeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
