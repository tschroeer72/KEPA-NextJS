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
    "name": "Neuner",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "Ratten",
    "type": "Int",
    "isOptional": false
  }
];

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
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des 9erRatten' },
      { status: 500 }
    )
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
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
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

    const updateData: { [key: string]: string | number | boolean | Date } = {}
    if (body.SpieltagID !== undefined && body.SpieltagID !== null) {
      updateData.SpieltagID = Number(body.SpieltagID)
    }
    if (body.SpielerID !== undefined && body.SpielerID !== null) {
      updateData.SpielerID = Number(body.SpielerID)
    }
    if (body.Neuner !== undefined && body.Neuner !== null) {
      updateData.Neuner = Number(body.Neuner)
    }
    if (body.Ratten !== undefined && body.Ratten !== null) {
      updateData.Ratten = Number(body.Ratten)
    }

    const data9erRatten = await prisma.tbl9erRatten.update({
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
    
    const updateCommand = `update tbl9erRatten set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tbl9erRatten", "update", updateCommand)

    return NextResponse.json(data9erRatten)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des 9erRatten' },
      { status: 500 }
    )
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

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tbl9erRatten where ID=${id}`
    await CreateChangeLogAsync(request, "tbl9erRatten", "delete", deleteCommand)

    return NextResponse.json(
      { message: '9erRatten erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des 9erRatten' },
      { status: 500 }
    )
  }
}
