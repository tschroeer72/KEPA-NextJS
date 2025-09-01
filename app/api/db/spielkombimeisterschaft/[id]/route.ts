import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen SpielKombimeisterschaft abrufen
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

    const dataSpielKombimeisterschaft = await prisma.tblSpielKombimeisterschaft.findUnique({
      where: { ID: id }
    })

    if (!dataSpielKombimeisterschaft) {
      return NextResponse.json(
        { error: 'SpielKombimeisterschaft nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpielKombimeisterschaft)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des SpielKombimeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - SpielKombimeisterschaft aktualisieren
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

    // Prüfen ob SpielKombimeisterschaft existiert
    const existingSpielKombimeisterschaft = await prisma.tblSpielKombimeisterschaft.findUnique({
      where: { ID: id }
    })

    if (!existingSpielKombimeisterschaft) {
      return NextResponse.json(
        { error: 'SpielKombimeisterschaft nicht gefunden' },
        { status: 404 }
      )
    }

    const dataSpielKombimeisterschaft = await prisma.tblSpielKombimeisterschaft.update({
      where: { ID: id },
      data: {
        ...(body.SpieltagID !== undefined && { SpieltagID: body.SpieltagID }),
        ...(body.SpielerID1 !== undefined && { SpielerID1: body.SpielerID1 }),
        ...(body.SpielerID2 !== undefined && { SpielerID2: body.SpielerID2 }),
        ...(body.Spieler1Punkte3bis8 !== undefined && { Spieler1Punkte3bis8: body.Spieler1Punkte3bis8 }),
        ...(body.Spieler1Punkte5Kugeln !== undefined && { Spieler1Punkte5Kugeln: body.Spieler1Punkte5Kugeln }),
        ...(body.Spieler2Punkte3bis8 !== undefined && { Spieler2Punkte3bis8: body.Spieler2Punkte3bis8 }),
        ...(body.Spieler2Punkte5Kugeln !== undefined && { Spieler2Punkte5Kugeln: body.Spieler2Punkte5Kugeln }),
        ...(body.HinR_ckrunde !== undefined && { HinR_ckrunde: body.HinR_ckrunde }),
      }
    })

    return NextResponse.json(dataSpielKombimeisterschaft)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des SpielKombimeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - SpielKombimeisterschaft löschen
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

    // Prüfen ob SpielKombimeisterschaft existiert
    const existingSpielKombimeisterschaft = await prisma.tblSpielKombimeisterschaft.findUnique({
      where: { ID: id }
    })

    if (!existingSpielKombimeisterschaft) {
      return NextResponse.json(
        { error: 'SpielKombimeisterschaft nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpielKombimeisterschaft.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'SpielKombimeisterschaft erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des SpielKombimeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
