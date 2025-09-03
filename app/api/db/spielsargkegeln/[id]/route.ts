import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

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

// GET - Einzelnen SpielSargKegeln abrufen
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

    const dataSpielSargKegeln = await prisma.tblSpielSargKegeln.findUnique({
      where: { ID: id }
    })

    if (!dataSpielSargKegeln) {
      return NextResponse.json(
        { error: 'SpielSargKegeln nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpielSargKegeln)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des SpielSargKegeln' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - SpielSargKegeln aktualisieren
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

    // Prüfen ob SpielSargKegeln existiert
    const existingSpielSargKegeln = await prisma.tblSpielSargKegeln.findUnique({
      where: { ID: id }
    })

    if (!existingSpielSargKegeln) {
      return NextResponse.json(
        { error: 'SpielSargKegeln nicht gefunden' },
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

    const dataSpielSargKegeln = await prisma.tblSpielSargKegeln.update({
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
    
    const updateCommand = `update tblSpielSargKegeln set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tblSpielSargKegeln", "update", updateCommand)

    return NextResponse.json(dataSpielSargKegeln)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des SpielSargKegeln' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - SpielSargKegeln löschen
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

    // Prüfen ob SpielSargKegeln existiert
    const existingSpielSargKegeln = await prisma.tblSpielSargKegeln.findUnique({
      where: { ID: id }
    })

    if (!existingSpielSargKegeln) {
      return NextResponse.json(
        { error: 'SpielSargKegeln nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpielSargKegeln.delete({
      where: { ID: id }
    })

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tblSpielSargKegeln where ID=${id}`
    await CreateChangeLogAsync(request, "tblSpielSargKegeln", "delete", deleteCommand)

    return NextResponse.json(
      { message: 'SpielSargKegeln erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des SpielSargKegeln' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
