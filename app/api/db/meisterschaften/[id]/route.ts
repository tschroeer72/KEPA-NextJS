import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen Meisterschaften abrufen
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

    const dataMeisterschaften = await prisma.tblMeisterschaften.findUnique({
      where: { ID: id }
    })

    if (!dataMeisterschaften) {
      return NextResponse.json(
        { error: 'Meisterschaften nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataMeisterschaften)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Meisterschaften' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Meisterschaften aktualisieren
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

    // Prüfen ob Meisterschaften existiert
    const existingMeisterschaften = await prisma.tblMeisterschaften.findUnique({
      where: { ID: id }
    })

    if (!existingMeisterschaften) {
      return NextResponse.json(
        { error: 'Meisterschaften nicht gefunden' },
        { status: 404 }
      )
    }

    const dataMeisterschaften = await prisma.tblMeisterschaften.update({
      where: { ID: id },
      data: {
        ...(body.Bezeichnung !== undefined && { Bezeichnung: body.Bezeichnung }),
        ...(body.Beginn !== undefined && { Beginn: body.Beginn }),
        ...(body.Ende !== undefined && { Ende: body.Ende }),
        ...(body.MeisterschaftstypID !== undefined && { MeisterschaftstypID: body.MeisterschaftstypID }),
        ...(body.TurboDBNummer !== undefined && { TurboDBNummer: body.TurboDBNummer }),
        ...(body.Aktiv !== undefined && { Aktiv: body.Aktiv }),
        ...(body.Bemerkungen !== undefined && { Bemerkungen: body.Bemerkungen }),
      }
    })

    return NextResponse.json(dataMeisterschaften)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Meisterschaften' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Meisterschaften löschen
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

    // Prüfen ob Meisterschaften existiert
    const existingMeisterschaften = await prisma.tblMeisterschaften.findUnique({
      where: { ID: id }
    })

    if (!existingMeisterschaften) {
      return NextResponse.json(
        { error: 'Meisterschaften nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblMeisterschaften.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'Meisterschaften erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Meisterschaften' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
