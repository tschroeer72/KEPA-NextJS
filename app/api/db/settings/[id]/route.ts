import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// Feldtypen für Update-Verarbeitung
const fieldsForUpdate: Array<{ name: string; type: string; isOptional: boolean }> = [
  {
    "name": "Computername",
    "type": "String",
    "isOptional": false
  },
  {
    "name": "Parametername",
    "type": "String",
    "isOptional": false
  },
  {
    "name": "Parameterwert",
    "type": "String",
    "isOptional": false
  }
];

// GET - Einzelnen Settings abrufen
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

    const dataSettings = await prisma.tblSettings.findUnique({
      where: { ID: id }
    })

    if (!dataSettings) {
      return NextResponse.json(
        { error: 'Settings nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSettings)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Settings aktualisieren
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

    // Prüfen ob Settings existiert
    const existingSettings = await prisma.tblSettings.findUnique({
      where: { ID: id }
    })

    if (!existingSettings) {
      return NextResponse.json(
        { error: 'Settings nicht gefunden' },
        { status: 404 }
      )
    }

    const updateData: { [key: string]: string | number | boolean | Date } = {}
    if (body.Computername !== undefined && body.Computername !== null) {
      updateData.Computername = String(body.Computername)
    }
    if (body.Parametername !== undefined && body.Parametername !== null) {
      updateData.Parametername = String(body.Parametername)
    }
    if (body.Parameterwert !== undefined && body.Parameterwert !== null) {
      updateData.Parameterwert = String(body.Parameterwert)
    }

    const dataSettings = await prisma.tblSettings.update({
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
    
    const updateCommand = `update tblSettings set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tblSettings", "update", updateCommand)

    return NextResponse.json(dataSettings)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Settings löschen
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

    // Prüfen ob Settings existiert
    const existingSettings = await prisma.tblSettings.findUnique({
      where: { ID: id }
    })

    if (!existingSettings) {
      return NextResponse.json(
        { error: 'Settings nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSettings.delete({
      where: { ID: id }
    })

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tblSettings where ID=${id}`
    await CreateChangeLogAsync(request, "tblSettings", "delete", deleteCommand)

    return NextResponse.json(
      { message: 'Settings erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
