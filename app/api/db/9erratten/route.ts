import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle 9erratten abrufen
export async function GET() {
  try {
    const data9erRatten = await prisma.tbl9erRatten.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(data9erRatten)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der 9erratten' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen 9erRatten erstellen
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
    if (body.Neuner === undefined || body.Neuner === null) {
      return NextResponse.json(
        { error: 'Neuner ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Ratten === undefined || body.Ratten === null) {
      return NextResponse.json(
        { error: 'Ratten ist erforderlich' },
        { status: 400 }
      )
    }

    const data9erRatten = await prisma.tbl9erRatten.create({
      data: {
        SpieltagID: body.SpieltagID,
        SpielerID: body.SpielerID,
        Neuner: body.Neuner,
        Ratten: body.Ratten,
      }
    })

    return NextResponse.json(data9erRatten, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des 9erRatten' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
