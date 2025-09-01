import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle spielpokal abrufen
export async function GET() {
  try {
    const dataSpielPokal = await prisma.tblSpielPokal.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpielPokal)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spielpokal' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen SpielPokal erstellen
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
    if (body.SpielerID === undefined || body.SpielerID === null) {
      return NextResponse.json(
        { error: 'SpielerID ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Platzierung === undefined || body.Platzierung === null) {
      return NextResponse.json(
        { error: 'Platzierung ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpielPokal = await prisma.tblSpielPokal.create({
      data: {
        SpieltagID: body.SpieltagID,
        SpielerID: body.SpielerID,
        Platzierung: body.Platzierung,
      }
    })

    return NextResponse.json(dataSpielPokal, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des SpielPokal' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
