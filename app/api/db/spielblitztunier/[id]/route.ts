import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen SpielBlitztunier abrufen
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

    const dataSpielBlitztunier = await prisma.tblSpielBlitztunier.findUnique({
      where: { ID: id }
    })

    if (!dataSpielBlitztunier) {
      return NextResponse.json(
        { error: 'SpielBlitztunier nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpielBlitztunier)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des SpielBlitztunier' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - SpielBlitztunier aktualisieren
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

    // Prüfen ob SpielBlitztunier existiert
    const existingSpielBlitztunier = await prisma.tblSpielBlitztunier.findUnique({
      where: { ID: id }
    })

    if (!existingSpielBlitztunier) {
      return NextResponse.json(
        { error: 'SpielBlitztunier nicht gefunden' },
        { status: 404 }
      )
    }

    const dataSpielBlitztunier = await prisma.tblSpielBlitztunier.update({
      where: { ID: id },
      data: {
        ...(body.SpieltagID !== undefined && { SpieltagID: body.SpieltagID }),
        ...(body.SpielerID1 !== undefined && { SpielerID1: body.SpielerID1 }),
        ...(body.SpielerID2 !== undefined && { SpielerID2: body.SpielerID2 }),
        ...(body.PunkteSpieler1 !== undefined && { PunkteSpieler1: body.PunkteSpieler1 }),
        ...(body.PunkteSpieler2 !== undefined && { PunkteSpieler2: body.PunkteSpieler2 }),
        ...(body.HinR_ckrunde !== undefined && { HinR_ckrunde: body.HinR_ckrunde }),
      }
    })

    return NextResponse.json(dataSpielBlitztunier)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des SpielBlitztunier' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - SpielBlitztunier löschen
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

    // Prüfen ob SpielBlitztunier existiert
    const existingSpielBlitztunier = await prisma.tblSpielBlitztunier.findUnique({
      where: { ID: id }
    })

    if (!existingSpielBlitztunier) {
      return NextResponse.json(
        { error: 'SpielBlitztunier nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpielBlitztunier.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'SpielBlitztunier erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des SpielBlitztunier' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
