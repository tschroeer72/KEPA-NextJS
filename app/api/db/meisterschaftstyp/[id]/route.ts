import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen Meisterschaftstyp abrufen
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

    const dataMeisterschaftstyp = await prisma.tblMeisterschaftstyp.findUnique({
      where: { ID: id }
    })

    if (!dataMeisterschaftstyp) {
      return NextResponse.json(
        { error: 'Meisterschaftstyp nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataMeisterschaftstyp)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Meisterschaftstyp' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Meisterschaftstyp aktualisieren
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

    // Prüfen ob Meisterschaftstyp existiert
    const existingMeisterschaftstyp = await prisma.tblMeisterschaftstyp.findUnique({
      where: { ID: id }
    })

    if (!existingMeisterschaftstyp) {
      return NextResponse.json(
        { error: 'Meisterschaftstyp nicht gefunden' },
        { status: 404 }
      )
    }

    const dataMeisterschaftstyp = await prisma.tblMeisterschaftstyp.update({
      where: { ID: id },
      data: {
        ...(body.Meisterschaftstyp !== undefined && { Meisterschaftstyp: body.Meisterschaftstyp }),
      }
    })

    return NextResponse.json(dataMeisterschaftstyp)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Meisterschaftstyp' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Meisterschaftstyp löschen
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

    // Prüfen ob Meisterschaftstyp existiert
    const existingMeisterschaftstyp = await prisma.tblMeisterschaftstyp.findUnique({
      where: { ID: id }
    })

    if (!existingMeisterschaftstyp) {
      return NextResponse.json(
        { error: 'Meisterschaftstyp nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblMeisterschaftstyp.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'Meisterschaftstyp erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Meisterschaftstyp' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
