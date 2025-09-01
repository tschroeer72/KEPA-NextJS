import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen Spiel6TageRennen abrufen
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

    const dataSpiel6TageRennen = await prisma.tblSpiel6TageRennen.findUnique({
      where: { ID: id }
    })

    if (!dataSpiel6TageRennen) {
      return NextResponse.json(
        { error: 'Spiel6TageRennen nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpiel6TageRennen)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Spiel6TageRennen' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Spiel6TageRennen aktualisieren
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

    // Prüfen ob Spiel6TageRennen existiert
    const existingSpiel6TageRennen = await prisma.tblSpiel6TageRennen.findUnique({
      where: { ID: id }
    })

    if (!existingSpiel6TageRennen) {
      return NextResponse.json(
        { error: 'Spiel6TageRennen nicht gefunden' },
        { status: 404 }
      )
    }

    const dataSpiel6TageRennen = await prisma.tblSpiel6TageRennen.update({
      where: { ID: id },
      data: {
        ...(body.SpieltagID !== undefined && { SpieltagID: body.SpieltagID }),
        ...(body.SpielerID1 !== undefined && { SpielerID1: body.SpielerID1 }),
        ...(body.SpielerID2 !== undefined && { SpielerID2: body.SpielerID2 }),
        ...(body.Runden !== undefined && { Runden: body.Runden }),
        ...(body.Punkte !== undefined && { Punkte: body.Punkte }),
        ...(body.Spielnummer !== undefined && { Spielnummer: body.Spielnummer }),
      }
    })

    return NextResponse.json(dataSpiel6TageRennen)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Spiel6TageRennen' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Spiel6TageRennen löschen
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

    // Prüfen ob Spiel6TageRennen existiert
    const existingSpiel6TageRennen = await prisma.tblSpiel6TageRennen.findUnique({
      where: { ID: id }
    })

    if (!existingSpiel6TageRennen) {
      return NextResponse.json(
        { error: 'Spiel6TageRennen nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpiel6TageRennen.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'Spiel6TageRennen erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Spiel6TageRennen' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
