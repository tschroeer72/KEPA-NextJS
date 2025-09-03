import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// Feldtypen für Update-Verarbeitung
const fieldsForUpdate: Array<{ name: string; type: string; isOptional: boolean }> = [
  {
    "name": "MeisterschaftsID",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "SpielerID",
    "type": "Int",
    "isOptional": false
  }
];

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
  } catch (error: unknown) {
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
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
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

    const updateData: { [key: string]: string | number | boolean | Date } = {}
    if (body.MeisterschaftsID !== undefined && body.MeisterschaftsID !== null) {
      updateData.MeisterschaftsID = Number(body.MeisterschaftsID)
    }
    if (body.SpielerID !== undefined && body.SpielerID !== null) {
      updateData.SpielerID = Number(body.SpielerID)
    }

    const dataTeilnehmer = await prisma.tblTeilnehmer.update({
      where: { ID: id },
      data: updateData
    })

    // Erfolgreicher PUT - Jetzt Changelog-Eintrag erstellen
    const updateFields = Object.entries(body)
      .filter(([key, value]) => key !== 'ID' && value !== undefined && value !== null)
      .map(([key, value]) => {
        const field = fieldsForUpdate.find((f: { name: string; type: string; isOptional: boolean }) => f.name === key)
        if (!field) return `${key}='${value}'`
        
        const fieldType = field.type.toLowerCase()
        if (fieldType === 'int' || fieldType === 'float' || fieldType === 'double' || fieldType === 'decimal') {
          return `${key}=${value}`
        }
        if (fieldType === 'boolean' || fieldType === 'bool') {
          return `${key}=${value ? 1 : 0}`
        }
        if (fieldType === 'datetime') {
          return `${key}='${new Date(value as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}'`
        }
        return `${key}='${value}'`
      })
      .join(', ')
    
    const updateCommand = `update tblTeilnehmer set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tblTeilnehmer", "update", updateCommand)

    return NextResponse.json(dataTeilnehmer)
  } catch (error: unknown) {
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

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tblTeilnehmer where ID=${id}`
    await CreateChangeLogAsync(request, "tblTeilnehmer", "delete", deleteCommand)

    return NextResponse.json(
      { message: 'Teilnehmer erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Teilnehmer' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
