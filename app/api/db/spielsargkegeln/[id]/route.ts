import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen SpielSargKegeln abrufen
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

    const dataSpielSargKegeln = await prisma.tblSpielSargKegeln.findUnique({
      where: { ID: id }
    })

    if (!dataSpielSargKegeln) {
      return NextResponse.json(
        { error: 'SpielSargKegeln nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpielSargKegeln)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des SpielSargKegeln' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - SpielSargKegeln aktualisieren
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

    // Prüfen ob SpielSargKegeln existiert
    const existingSpielSargKegeln = await prisma.tblSpielSargKegeln.findUnique({
      where: { ID: id }
    })

    if (!existingSpielSargKegeln) {
      return NextResponse.json(
        { error: 'SpielSargKegeln nicht gefunden' },
        { status: 404 }
      )
    }

    const dataSpielSargKegeln = await prisma.tblSpielSargKegeln.update({
      where: { ID: id },
      data: {
        ...(body.SpieltagID !== undefined && { SpieltagID: body.SpieltagID }),
        ...(body.SpielerID !== undefined && { SpielerID: body.SpielerID }),
        ...(body.Platzierung !== undefined && { Platzierung: body.Platzierung }),
      }
    })

    return NextResponse.json(dataSpielSargKegeln)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des SpielSargKegeln' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - SpielSargKegeln löschen
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

    // Prüfen ob SpielSargKegeln existiert
    const existingSpielSargKegeln = await prisma.tblSpielSargKegeln.findUnique({
      where: { ID: id }
    })

    if (!existingSpielSargKegeln) {
      return NextResponse.json(
        { error: 'SpielSargKegeln nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpielSargKegeln.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'SpielSargKegeln erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des SpielSargKegeln' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
