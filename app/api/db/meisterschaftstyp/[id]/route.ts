import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// Feldtypen für Update-Verarbeitung
const fieldsForUpdate: Array<{ name: string; type: string; isOptional: boolean }> = [
  {
    "name": "Meisterschaftstyp",
    "type": "String",
    "isOptional": false
  }
];

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
  } catch (error: unknown) {
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
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
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

    const updateData: { [key: string]: string | number | boolean | Date } = {}
    if (body.Meisterschaftstyp !== undefined && body.Meisterschaftstyp !== null) {
      updateData.Meisterschaftstyp = String(body.Meisterschaftstyp)
    }

    const dataMeisterschaftstyp = await prisma.tblMeisterschaftstyp.update({
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
    
    const updateCommand = `update tblMeisterschaftstyp set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tblMeisterschaftstyp", "update", updateCommand)

    return NextResponse.json(dataMeisterschaftstyp)
  } catch (error: unknown) {
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

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tblMeisterschaftstyp where ID=${id}`
    await CreateChangeLogAsync(request, "tblMeisterschaftstyp", "delete", deleteCommand)

    return NextResponse.json(
      { message: 'Meisterschaftstyp erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Meisterschaftstyp' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
