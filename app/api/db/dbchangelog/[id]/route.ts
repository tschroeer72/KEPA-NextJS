import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Einzelnen DBChangeLog abrufen
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

    const dataDBChangeLog = await prisma.tblDBChangeLog.findUnique({
      where: { ID: id }
    })

    if (!dataDBChangeLog) {
      return NextResponse.json(
        { error: 'DBChangeLog nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataDBChangeLog)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des DBChangeLog' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - DBChangeLog aktualisieren
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

    // Prüfen ob DBChangeLog existiert
    const existingDBChangeLog = await prisma.tblDBChangeLog.findUnique({
      where: { ID: id }
    })

    if (!existingDBChangeLog) {
      return NextResponse.json(
        { error: 'DBChangeLog nicht gefunden' },
        { status: 404 }
      )
    }

    const dataDBChangeLog = await prisma.tblDBChangeLog.update({
      where: { ID: id },
      data: {
        ...(body.Computername !== undefined && { Computername: body.Computername }),
        ...(body.Tablename !== undefined && { Tablename: body.Tablename }),
        ...(body.Changetype !== undefined && { Changetype: body.Changetype }),
        ...(body.Command !== undefined && { Command: body.Command }),
        ...(body.Zeitstempel !== undefined && { Zeitstempel: body.Zeitstempel }),
      }
    })

    return NextResponse.json(dataDBChangeLog)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des DBChangeLog' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - DBChangeLog löschen
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

    // Prüfen ob DBChangeLog existiert
    const existingDBChangeLog = await prisma.tblDBChangeLog.findUnique({
      where: { ID: id }
    })

    if (!existingDBChangeLog) {
      return NextResponse.json(
        { error: 'DBChangeLog nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblDBChangeLog.delete({
      where: { ID: id }
    })

    return NextResponse.json(
      { message: 'DBChangeLog erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des DBChangeLog' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
