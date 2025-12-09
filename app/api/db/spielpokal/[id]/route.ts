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
    "name": "SpielerID",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "Platzierung",
    "type": "Int",
    "isOptional": false
  }
];

// GET - Einzelnen SpielPokal abrufen
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

    const dataSpielPokal = await prisma.tblSpielPokal.findUnique({
      where: { ID: id },
    });

    if (!dataSpielPokal) {
      return NextResponse.json(
        { error: 'SpielPokal nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpielPokal)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des SpielPokal' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - SpielPokal aktualisieren
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

    // Prüfen ob SpielPokal existiert
    const existingSpielPokal = await prisma.tblSpielPokal.findUnique({
      where: { ID: id },
    });

    if (!existingSpielPokal) {
      return NextResponse.json(
        { error: 'SpielPokal nicht gefunden' },
        { status: 404 }
      )
    }

    const updateData: { [key: string]: string | number | boolean | Date } = {}
    if (body.SpieltagID !== undefined && body.SpieltagID !== null) {
      updateData.SpieltagID = Number(body.SpieltagID)
    }
    if (body.SpielerID !== undefined && body.SpielerID !== null) {
      updateData.SpielerID = Number(body.SpielerID)
    }
    if (body.Platzierung !== undefined && body.Platzierung !== null) {
      updateData.Platzierung = Number(body.Platzierung)
    }

    const dataSpielPokal = await prisma.tblSpielPokal.update({
      where: { ID: id },
      data: updateData,
    });

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
    
    const updateCommand = `update tblSpielPokal set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tblSpielPokal", "update", updateCommand)

    return NextResponse.json(dataSpielPokal)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des SpielPokal' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - SpielPokal löschen
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

    // Prüfen ob SpielPokal existiert
    const existingSpielPokal = await prisma.tblSpielPokal.findUnique({
      where: { ID: id },
    });

    if (!existingSpielPokal) {
      return NextResponse.json(
        { error: 'SpielPokal nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpielPokal.delete({
      where: { ID: id },
    });

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tblSpielPokal where ID=${id}`
    await CreateChangeLogAsync(request, "tblSpielPokal", "delete", deleteCommand)

    return NextResponse.json(
      { message: 'SpielPokal erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des SpielPokal' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}
