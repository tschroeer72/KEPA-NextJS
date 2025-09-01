import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle teilnehmer abrufen
export async function GET() {
  try {
    const dataTeilnehmer = await prisma.tblTeilnehmer.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataTeilnehmer)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der teilnehmer' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Teilnehmer erstellen
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
    if (body.SpielerID === undefined || body.SpielerID === null) {
      return NextResponse.json(
        { error: 'SpielerID ist erforderlich' },
        { status: 400 }
      )
    }

    const dataTeilnehmer = await prisma.tblTeilnehmer.create({
      data: {
        MeisterschaftsID: body.MeisterschaftsID,
        SpielerID: body.SpielerID,
      }
    })

    return NextResponse.json(dataTeilnehmer, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Teilnehmer' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
