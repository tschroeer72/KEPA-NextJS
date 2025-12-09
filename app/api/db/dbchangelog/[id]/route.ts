import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// Feldtypen für Update-Verarbeitung
const fieldsForUpdate: Array<{ name: string; type: string; isOptional: boolean }> = [
  {
    "name": "Computername",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Tablename",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Changetype",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Command",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Zeitstempel",
    "type": "DateTime",
    "isOptional": false
  }
];

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
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des DBChangeLog' },
      { status: 500 }
    )
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
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
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

    const updateData: { [key: string]: string | number | boolean | Date } = {}
    if (body.Computername !== undefined && body.Computername !== null) {
      updateData.Computername = String(body.Computername)
    }
    if (body.Tablename !== undefined && body.Tablename !== null) {
      updateData.Tablename = String(body.Tablename)
    }
    if (body.Changetype !== undefined && body.Changetype !== null) {
      updateData.Changetype = String(body.Changetype)
    }
    if (body.Command !== undefined && body.Command !== null) {
      updateData.Command = String(body.Command)
    }
    if (body.Zeitstempel !== undefined && body.Zeitstempel !== null) {
      updateData.Zeitstempel = new Date(body.Zeitstempel as string | number | Date)
    }

    const dataDBChangeLog = await prisma.tblDBChangeLog.update({
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
    
    const updateCommand = `update tblDBChangeLog set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tblDBChangeLog", "update", updateCommand)

    return NextResponse.json(dataDBChangeLog)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des DBChangeLog' },
      { status: 500 }
    )
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

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tblDBChangeLog where ID=${id}`
    await CreateChangeLogAsync(request, "tblDBChangeLog", "delete", deleteCommand)

    return NextResponse.json(
      { message: 'DBChangeLog erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des DBChangeLog' },
      { status: 500 }
    )
  }
}
