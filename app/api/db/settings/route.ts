import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle settings abrufen
export async function GET() {
  try {
    const dataSettings = await prisma.tblSettings.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSettings)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Settings erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung - Nur für relevante Felder
    if (body.Computername === undefined || body.Computername === null) {
      return NextResponse.json(
        { error: 'Computername ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Parametername === undefined || body.Parametername === null) {
      return NextResponse.json(
        { error: 'Parametername ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Parameterwert === undefined || body.Parameterwert === null) {
      return NextResponse.json(
        { error: 'Parameterwert ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSettings = await prisma.tblSettings.create({
      data: {
        Computername: body.Computername,
        Parametername: body.Parametername,
        Parameterwert: body.Parameterwert,
      }
    })

    return NextResponse.json(dataSettings, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
