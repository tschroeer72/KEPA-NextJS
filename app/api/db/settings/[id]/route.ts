import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen Settings abrufen
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

    const dataSettings = await prisma.tblSettings.findUnique({
      where: { ID: id }
    })

    if (!dataSettings) {
      return NextResponse.json(
        { error: 'Settings nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSettings)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Settings aktualisieren
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

    // Prüfen ob Settings existiert
    const existingSettings = await prisma.tblSettings.findUnique({
      where: { ID: id }
    })

    if (!existingSettings) {
      return NextResponse.json(
        { error: 'Settings nicht gefunden' },
        { status: 404 }
      )
    }

    const dataSettings = await prisma.tblSettings.update({
      where: { ID: id },
      data: {
        ...(body.Computername !== undefined && { Computername: body.Computername }),
        ...(body.Parametername !== undefined && { Parametername: body.Parametername }),
        ...(body.Parameterwert !== undefined && { Parameterwert: body.Parameterwert }),
      }
    })

    return NextResponse.json(dataSettings)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Settings löschen
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

    // Prüfen ob Settings existiert
    const existingSettings = await prisma.tblSettings.findUnique({
      where: { ID: id }
    })

    if (!existingSettings) {
      return NextResponse.json(
        { error: 'Settings nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSettings.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'Settings erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
