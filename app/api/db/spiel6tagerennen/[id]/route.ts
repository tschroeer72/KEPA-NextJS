import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// Feldtypen für Update-Verarbeitung
const fieldsForUpdate: Array<{ name: string; type: string; isOptional: boolean }> = [
  {
    "name": "SpieltagID",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "SpielerID1",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "SpielerID2",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "Runden",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "Punkte",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "Spielnummer",
    "type": "Int",
    "isOptional": true
  }
];

// GET - Einzelnen Spiel6TageRennen abrufen
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

    const dataSpiel6TageRennen = await prisma.tblSpiel6TageRennen.findUnique({
      where: { ID: id }
    })

    if (!dataSpiel6TageRennen) {
      return NextResponse.json(
        { error: 'Spiel6TageRennen nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpiel6TageRennen)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Spiel6TageRennen' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Spiel6TageRennen aktualisieren
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

    // Prüfen ob Spiel6TageRennen existiert
    const existingSpiel6TageRennen = await prisma.tblSpiel6TageRennen.findUnique({
      where: { ID: id }
    })

    if (!existingSpiel6TageRennen) {
      return NextResponse.json(
        { error: 'Spiel6TageRennen nicht gefunden' },
        { status: 404 }
      )
    }

    const updateData: { [key: string]: string | number | boolean | Date } = {}
    if (body.SpieltagID !== undefined && body.SpieltagID !== null) {
      updateData.SpieltagID = Number(body.SpieltagID)
    }
    if (body.SpielerID1 !== undefined && body.SpielerID1 !== null) {
      updateData.SpielerID1 = Number(body.SpielerID1)
    }
    if (body.SpielerID2 !== undefined && body.SpielerID2 !== null) {
      updateData.SpielerID2 = Number(body.SpielerID2)
    }
    if (body.Runden !== undefined && body.Runden !== null) {
      updateData.Runden = Number(body.Runden)
    }
    if (body.Punkte !== undefined && body.Punkte !== null) {
      updateData.Punkte = Number(body.Punkte)
    }
    if (body.Spielnummer !== undefined && body.Spielnummer !== null) {
      updateData.Spielnummer = Number(body.Spielnummer)
    }

    const dataSpiel6TageRennen = await prisma.tblSpiel6TageRennen.update({
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
    
    const updateCommand = `update tblSpiel6TageRennen set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tblSpiel6TageRennen", "update", updateCommand)

    return NextResponse.json(dataSpiel6TageRennen)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Spiel6TageRennen' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Spiel6TageRennen löschen
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

    // Prüfen ob Spiel6TageRennen existiert
    const existingSpiel6TageRennen = await prisma.tblSpiel6TageRennen.findUnique({
      where: { ID: id }
    })

    if (!existingSpiel6TageRennen) {
      return NextResponse.json(
        { error: 'Spiel6TageRennen nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpiel6TageRennen.delete({
      where: { ID: id }
    })

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tblSpiel6TageRennen where ID=${id}`
    await CreateChangeLogAsync(request, "tblSpiel6TageRennen", "delete", deleteCommand)

    return NextResponse.json(
      { message: 'Spiel6TageRennen erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Spiel6TageRennen' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}
