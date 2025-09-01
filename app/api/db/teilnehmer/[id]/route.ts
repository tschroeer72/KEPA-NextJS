import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen Teilnehmer abrufen
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

    const dataTeilnehmer = await prisma.tblTeilnehmer.findUnique({
      where: { ID: id }
    })

    if (!dataTeilnehmer) {
      return NextResponse.json(
        { error: 'Teilnehmer nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataTeilnehmer)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Teilnehmer' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Teilnehmer aktualisieren
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

    // Prüfen ob Teilnehmer existiert
    const existingTeilnehmer = await prisma.tblTeilnehmer.findUnique({
      where: { ID: id }
    })

    if (!existingTeilnehmer) {
      return NextResponse.json(
        { error: 'Teilnehmer nicht gefunden' },
        { status: 404 }
      )
    }

    const dataTeilnehmer = await prisma.tblTeilnehmer.update({
      where: { ID: id },
      data: {
        ...(body.MeisterschaftsID !== undefined && { MeisterschaftsID: body.MeisterschaftsID }),
        ...(body.SpielerID !== undefined && { SpielerID: body.SpielerID }),
      }
    })

    return NextResponse.json(dataTeilnehmer)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Teilnehmer' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Teilnehmer löschen
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

    // Prüfen ob Teilnehmer existiert
    const existingTeilnehmer = await prisma.tblTeilnehmer.findUnique({
      where: { ID: id }
    })

    if (!existingTeilnehmer) {
      return NextResponse.json(
        { error: 'Teilnehmer nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblTeilnehmer.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'Teilnehmer erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Teilnehmer' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
