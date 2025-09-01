import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen SpielMeisterschaft abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    const dataSpielMeisterschaft = await prisma.tblSpielMeisterschaft.findUnique({
      where: { ID: id }
    })

    if (!dataSpielMeisterschaft) {
      return NextResponse.json(
        { error: 'SpielMeisterschaft nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpielMeisterschaft)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des SpielMeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - SpielMeisterschaft aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    const body = await request.json()
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    // Prüfen ob SpielMeisterschaft existiert
    const existingSpielMeisterschaft = await prisma.tblSpielMeisterschaft.findUnique({
      where: { ID: id }
    })

    if (!existingSpielMeisterschaft) {
      return NextResponse.json(
        { error: 'SpielMeisterschaft nicht gefunden' },
        { status: 404 }
      )
    }

    const dataSpielMeisterschaft = await prisma.tblSpielMeisterschaft.update({
      where: { ID: id },
      data: {
        ...(body.SpieltagID !== undefined && { SpieltagID: body.SpieltagID }),
        ...(body.SpielerID1 !== undefined && { SpielerID1: body.SpielerID1 }),
        ...(body.SpielerID2 !== undefined && { SpielerID2: body.SpielerID2 }),
        ...(body.HolzSpieler1 !== undefined && { HolzSpieler1: body.HolzSpieler1 }),
        ...(body.HolzSpieler2 !== undefined && { HolzSpieler2: body.HolzSpieler2 }),
        ...(body.HinR_ckrunde !== undefined && { HinR_ckrunde: body.HinR_ckrunde }),
      }
    })

    return NextResponse.json(dataSpielMeisterschaft)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des SpielMeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - SpielMeisterschaft löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params
    const id = parseInt(idString)
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Ungültige ID' },
        { status: 400 }
      )
    }

    // Prüfen ob SpielMeisterschaft existiert
    const existingSpielMeisterschaft = await prisma.tblSpielMeisterschaft.findUnique({
      where: { ID: id }
    })

    if (!existingSpielMeisterschaft) {
      return NextResponse.json(
        { error: 'SpielMeisterschaft nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpielMeisterschaft.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'SpielMeisterschaft erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des SpielMeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
