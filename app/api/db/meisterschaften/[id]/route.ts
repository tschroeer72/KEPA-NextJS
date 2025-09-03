import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// Feldtypen für Update-Verarbeitung
const fieldsForUpdate: Array<{ name: string; type: string; isOptional: boolean }> = [
  {
    "name": "Bezeichnung",
    "type": "String",
    "isOptional": false
  },
  {
    "name": "Beginn",
    "type": "DateTime",
    "isOptional": false
  },
  {
    "name": "Ende",
    "type": "DateTime",
    "isOptional": true
  },
  {
    "name": "MeisterschaftstypID",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "TurboDBNummer",
    "type": "Int",
    "isOptional": true
  },
  {
    "name": "Aktiv",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "Bemerkungen",
    "type": "String",
    "isOptional": true
  }
];

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
  } catch (error: unknown) {
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
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
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

    const updateData: { [key: string]: string | number | boolean | Date } = {}
    if (body.Bezeichnung !== undefined && body.Bezeichnung !== null) {
      updateData.Bezeichnung = String(body.Bezeichnung)
    }
    if (body.Beginn !== undefined && body.Beginn !== null) {
      updateData.Beginn = new Date(body.Beginn as string | number | Date)
    }
    if (body.Ende !== undefined && body.Ende !== null) {
      updateData.Ende = new Date(body.Ende as string | number | Date)
    }
    if (body.MeisterschaftstypID !== undefined && body.MeisterschaftstypID !== null) {
      updateData.MeisterschaftstypID = Number(body.MeisterschaftstypID)
    }
    if (body.TurboDBNummer !== undefined && body.TurboDBNummer !== null) {
      updateData.TurboDBNummer = Number(body.TurboDBNummer)
    }
    if (body.Aktiv !== undefined && body.Aktiv !== null) {
      updateData.Aktiv = Number(body.Aktiv)
    }
    if (body.Bemerkungen !== undefined && body.Bemerkungen !== null) {
      updateData.Bemerkungen = String(body.Bemerkungen)
    }

    const dataMeisterschaften = await prisma.tblMeisterschaften.update({
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
    
    const updateCommand = `update tblMeisterschaften set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tblMeisterschaften", "update", updateCommand)

    return NextResponse.json(dataMeisterschaften)
  } catch (error: unknown) {
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

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tblMeisterschaften where ID=${id}`
    await CreateChangeLogAsync(request, "tblMeisterschaften", "delete", deleteCommand)

    return NextResponse.json(
      { message: 'Meisterschaften erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Meisterschaften' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
