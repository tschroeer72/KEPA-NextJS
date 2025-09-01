import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle spielblitztunier abrufen
export async function GET() {
  try {
    const dataSpielBlitztunier = await prisma.tblSpielBlitztunier.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpielBlitztunier)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spielblitztunier' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen SpielBlitztunier erstellen
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
    if (body.PunkteSpieler1 === undefined || body.PunkteSpieler1 === null) {
      return NextResponse.json(
        { error: 'PunkteSpieler1 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.PunkteSpieler2 === undefined || body.PunkteSpieler2 === null) {
      return NextResponse.json(
        { error: 'PunkteSpieler2 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HinR_ckrunde === undefined || body.HinR_ckrunde === null) {
      return NextResponse.json(
        { error: 'HinR_ckrunde ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpielBlitztunier = await prisma.tblSpielBlitztunier.create({
      data: {
        SpieltagID: body.SpieltagID,
        SpielerID1: body.SpielerID1,
        SpielerID2: body.SpielerID2,
        PunkteSpieler1: body.PunkteSpieler1,
        PunkteSpieler2: body.PunkteSpieler2,
        HinR_ckrunde: body.HinR_ckrunde,
      }
    })

    return NextResponse.json(dataSpielBlitztunier, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des SpielBlitztunier' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
