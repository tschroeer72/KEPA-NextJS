import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle meisterschaftstyp abrufen
export async function GET() {
  try {
    const dataMeisterschaftstyp = await prisma.tblMeisterschaftstyp.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataMeisterschaftstyp)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der meisterschaftstyp' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Meisterschaftstyp erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung - Nur für relevante Felder
    if (body.Meisterschaftstyp === undefined || body.Meisterschaftstyp === null) {
      return NextResponse.json(
        { error: 'Meisterschaftstyp ist erforderlich' },
        { status: 400 }
      )
    }

    const dataMeisterschaftstyp = await prisma.tblMeisterschaftstyp.create({
      data: {
        Meisterschaftstyp: body.Meisterschaftstyp,
      }
    })

    return NextResponse.json(dataMeisterschaftstyp, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Meisterschaftstyp' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
