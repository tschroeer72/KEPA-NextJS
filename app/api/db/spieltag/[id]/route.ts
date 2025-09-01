import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen Spieltag abrufen
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

    const dataSpieltag = await prisma.tblSpieltag.findUnique({
      where: { ID: id }
    })

    if (!dataSpieltag) {
      return NextResponse.json(
        { error: 'Spieltag nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpieltag)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Spieltag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Spieltag aktualisieren
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

    // Prüfen ob Spieltag existiert
    const existingSpieltag = await prisma.tblSpieltag.findUnique({
      where: { ID: id }
    })

    if (!existingSpieltag) {
      return NextResponse.json(
        { error: 'Spieltag nicht gefunden' },
        { status: 404 }
      )
    }

    const dataSpieltag = await prisma.tblSpieltag.update({
      where: { ID: id },
      data: {
        ...(body.MeisterschaftsID !== undefined && { MeisterschaftsID: body.MeisterschaftsID }),
        ...(body.Spieltag !== undefined && { Spieltag: body.Spieltag }),
        ...(body.InBearbeitung !== undefined && { InBearbeitung: body.InBearbeitung }),
      }
    })

    return NextResponse.json(dataSpieltag)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Spieltag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Spieltag löschen
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

    // Prüfen ob Spieltag existiert
    const existingSpieltag = await prisma.tblSpieltag.findUnique({
      where: { ID: id }
    })

    if (!existingSpieltag) {
      return NextResponse.json(
        { error: 'Spieltag nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpieltag.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'Spieltag erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Spieltag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
