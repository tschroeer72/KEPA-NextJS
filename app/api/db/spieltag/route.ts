import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle spieltag abrufen
export async function GET() {
  try {
    const dataSpieltag = await prisma.tblSpieltag.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpieltag)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spieltag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Spieltag erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung - Nur für relevante Felder
    if (body.MeisterschaftsID === undefined || body.MeisterschaftsID === null) {
      return NextResponse.json(
        { error: 'MeisterschaftsID ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Spieltag === undefined || body.Spieltag === null) {
      return NextResponse.json(
        { error: 'Spieltag ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.InBearbeitung === undefined || body.InBearbeitung === null) {
      return NextResponse.json(
        { error: 'InBearbeitung ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpieltag = await prisma.tblSpieltag.create({
      data: {
        MeisterschaftsID: body.MeisterschaftsID,
        Spieltag: body.Spieltag,
        InBearbeitung: body.InBearbeitung,
      }
    })

    return NextResponse.json(dataSpieltag, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Spieltag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
