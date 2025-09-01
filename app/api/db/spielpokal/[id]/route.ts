import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen SpielPokal abrufen
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

    const dataSpielPokal = await prisma.tblSpielPokal.findUnique({
      where: { ID: id }
    })

    if (!dataSpielPokal) {
      return NextResponse.json(
        { error: 'SpielPokal nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpielPokal)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des SpielPokal' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - SpielPokal aktualisieren
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

    // Prüfen ob SpielPokal existiert
    const existingSpielPokal = await prisma.tblSpielPokal.findUnique({
      where: { ID: id }
    })

    if (!existingSpielPokal) {
      return NextResponse.json(
        { error: 'SpielPokal nicht gefunden' },
        { status: 404 }
      )
    }

    const dataSpielPokal = await prisma.tblSpielPokal.update({
      where: { ID: id },
      data: {
        ...(body.SpieltagID !== undefined && { SpieltagID: body.SpieltagID }),
        ...(body.SpielerID !== undefined && { SpielerID: body.SpielerID }),
        ...(body.Platzierung !== undefined && { Platzierung: body.Platzierung }),
      }
    })

    return NextResponse.json(dataSpielPokal)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des SpielPokal' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - SpielPokal löschen
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

    // Prüfen ob SpielPokal existiert
    const existingSpielPokal = await prisma.tblSpielPokal.findUnique({
      where: { ID: id }
    })

    if (!existingSpielPokal) {
      return NextResponse.json(
        { error: 'SpielPokal nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpielPokal.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'SpielPokal erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des SpielPokal' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
