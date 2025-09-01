import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle spielsargkegeln abrufen
export async function GET() {
  try {
    const dataSpielSargKegeln = await prisma.tblSpielSargKegeln.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpielSargKegeln)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spielsargkegeln' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen SpielSargKegeln erstellen
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

    const dataSpielSargKegeln = await prisma.tblSpielSargKegeln.create({
      data: {
        SpieltagID: body.SpieltagID,
        SpielerID: body.SpielerID,
        Platzierung: body.Platzierung,
      }
    })

    return NextResponse.json(dataSpielSargKegeln, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des SpielSargKegeln' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
