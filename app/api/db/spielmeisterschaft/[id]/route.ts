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
    "name": "HolzSpieler1",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "HolzSpieler2",
    "type": "Int",
    "isOptional": false
  },
  {
    "name": "HinR_ckrunde",
    "type": "Int",
    "isOptional": false
  }
];

// GET - Einzelnen SpielMeisterschaft abrufen
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

    const dataSpielMeisterschaft = await prisma.tblSpielMeisterschaft.findUnique({
      where: { ID: id },
    });

    if (!dataSpielMeisterschaft) {
      return NextResponse.json(
        { error: 'SpielMeisterschaft nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataSpielMeisterschaft)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des SpielMeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - SpielMeisterschaft aktualisieren
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

    // Prüfen ob SpielMeisterschaft existiert
    const existingSpielMeisterschaft = await prisma.tblSpielMeisterschaft.findUnique({
      where: { ID: id },
    });

    if (!existingSpielMeisterschaft) {
      return NextResponse.json(
        { error: 'SpielMeisterschaft nicht gefunden' },
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
    if (body.HolzSpieler1 !== undefined && body.HolzSpieler1 !== null) {
      updateData.HolzSpieler1 = Number(body.HolzSpieler1)
    }
    if (body.HolzSpieler2 !== undefined && body.HolzSpieler2 !== null) {
      updateData.HolzSpieler2 = Number(body.HolzSpieler2)
    }
    if (body.HinR_ckrunde !== undefined && body.HinR_ckrunde !== null) {
      updateData.HinR_ckrunde = Number(body.HinR_ckrunde)
    }

    const dataSpielMeisterschaft = await prisma.tblSpielMeisterschaft.update({
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
    
    const updateCommand = `update tblSpielMeisterschaft set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tblSpielMeisterschaft", "update", updateCommand)

    return NextResponse.json(dataSpielMeisterschaft)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des SpielMeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - SpielMeisterschaft löschen
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

    // Prüfen ob SpielMeisterschaft existiert
    const existingSpielMeisterschaft = await prisma.tblSpielMeisterschaft.findUnique({
      where: { ID: id },
    });

    if (!existingSpielMeisterschaft) {
      return NextResponse.json(
        { error: 'SpielMeisterschaft nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblSpielMeisterschaft.delete({
      where: { ID: id },
    });

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tblSpielMeisterschaft where ID=${id}`
    await CreateChangeLogAsync(request, "tblSpielMeisterschaft", "delete", deleteCommand)

    return NextResponse.json(
      { message: 'SpielMeisterschaft erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des SpielMeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}
