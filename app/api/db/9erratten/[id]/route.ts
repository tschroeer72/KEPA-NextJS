import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen 9erRatten abrufen
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

    const data9erRatten = await prisma.tbl9erRatten.findUnique({
      where: { ID: id }
    })

    if (!data9erRatten) {
      return NextResponse.json(
        { error: '9erRatten nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(data9erRatten)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des 9erRatten' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - 9erRatten aktualisieren
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

    // Prüfen ob 9erRatten existiert
    const existing9erRatten = await prisma.tbl9erRatten.findUnique({
      where: { ID: id }
    })

    if (!existing9erRatten) {
      return NextResponse.json(
        { error: '9erRatten nicht gefunden' },
        { status: 404 }
      )
    }

    const data9erRatten = await prisma.tbl9erRatten.update({
      where: { ID: id },
      data: {
        ...(body.SpieltagID !== undefined && { SpieltagID: body.SpieltagID }),
        ...(body.SpielerID !== undefined && { SpielerID: body.SpielerID }),
        ...(body.Neuner !== undefined && { Neuner: body.Neuner }),
        ...(body.Ratten !== undefined && { Ratten: body.Ratten }),
      }
    })

    return NextResponse.json(data9erRatten)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des 9erRatten' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - 9erRatten löschen
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

    // Prüfen ob 9erRatten existiert
    const existing9erRatten = await prisma.tbl9erRatten.findUnique({
      where: { ID: id }
    })

    if (!existing9erRatten) {
      return NextResponse.json(
        { error: '9erRatten nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tbl9erRatten.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: '9erRatten erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des 9erRatten' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
