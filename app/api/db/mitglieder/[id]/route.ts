import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// Feldtypen für Update-Verarbeitung
const fieldsForUpdate: Array<{ name: string; type: string; isOptional: boolean }> = [
  {
    "name": "Vorname",
    "type": "String",
    "isOptional": false
  },
  {
    "name": "Nachname",
    "type": "String",
    "isOptional": false
  },
  {
    "name": "Spitzname",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Strasse",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "PLZ",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Ort",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Geburtsdatum",
    "type": "DateTime",
    "isOptional": true
  },
  {
    "name": "MitgliedSeit",
    "type": "DateTime",
    "isOptional": false
  },
  {
    "name": "PassivSeit",
    "type": "DateTime",
    "isOptional": true
  },
  {
    "name": "AusgeschiedenAm",
    "type": "DateTime",
    "isOptional": true
  },
  {
    "name": "Ehemaliger",
    "type": "Boolean",
    "isOptional": false
  },
  {
    "name": "Notizen",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Bemerkungen",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Anrede",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "EMail",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "TelefonPrivat",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "TelefonFirma",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "TelefonMobil",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Fax",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "SpAnz",
    "type": "Int",
    "isOptional": true
  },
  {
    "name": "SpGew",
    "type": "Int",
    "isOptional": true
  },
  {
    "name": "SpUn",
    "type": "Int",
    "isOptional": true
  },
  {
    "name": "SpVerl",
    "type": "Int",
    "isOptional": true
  },
  {
    "name": "HolzGes",
    "type": "Int",
    "isOptional": true
  },
  {
    "name": "HolzMax",
    "type": "Int",
    "isOptional": true
  },
  {
    "name": "HolzMin",
    "type": "Int",
    "isOptional": true
  },
  {
    "name": "Punkte",
    "type": "Int",
    "isOptional": true
  },
  {
    "name": "Platz",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "TurboDBNummer",
    "type": "Int",
    "isOptional": true
  },
  {
    "name": "Login",
    "type": "String",
    "isOptional": true
  },
  {
    "name": "Password",
    "type": "String",
    "isOptional": true
  }
];

// GET - Einzelnen Mitglieder abrufen
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

    const dataMitglieder = await prisma.tblMitglieder.findUnique({
      where: { ID: id }
    })

    if (!dataMitglieder) {
      return NextResponse.json(
        { error: 'Mitglieder nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json(dataMitglieder)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Mitglieder' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// PUT - Mitglieder aktualisieren
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

    // Prüfen ob Mitglieder existiert
    const existingMitglieder = await prisma.tblMitglieder.findUnique({
      where: { ID: id }
    })

    if (!existingMitglieder) {
      return NextResponse.json(
        { error: 'Mitglieder nicht gefunden' },
        { status: 404 }
      )
    }

    const updateData: { [key: string]: string | number | boolean | Date } = {}
    if (body.Vorname !== undefined && body.Vorname !== null) {
      updateData.Vorname = String(body.Vorname)
    }
    if (body.Nachname !== undefined && body.Nachname !== null) {
      updateData.Nachname = String(body.Nachname)
    }
    if (body.Spitzname !== undefined && body.Spitzname !== null) {
      updateData.Spitzname = String(body.Spitzname)
    }
    if (body.Strasse !== undefined && body.Strasse !== null) {
      updateData.Strasse = String(body.Strasse)
    }
    if (body.PLZ !== undefined && body.PLZ !== null) {
      updateData.PLZ = String(body.PLZ)
    }
    if (body.Ort !== undefined && body.Ort !== null) {
      updateData.Ort = String(body.Ort)
    }
    if (body.Geburtsdatum !== undefined && body.Geburtsdatum !== null) {
      updateData.Geburtsdatum = new Date(body.Geburtsdatum as string | number | Date)
    }
    if (body.MitgliedSeit !== undefined && body.MitgliedSeit !== null) {
      updateData.MitgliedSeit = new Date(body.MitgliedSeit as string | number | Date)
    }
    if (body.PassivSeit !== undefined && body.PassivSeit !== null) {
      updateData.PassivSeit = new Date(body.PassivSeit as string | number | Date)
    }
    if (body.AusgeschiedenAm !== undefined && body.AusgeschiedenAm !== null) {
      updateData.AusgeschiedenAm = new Date(body.AusgeschiedenAm as string | number | Date)
    }
    if (body.Ehemaliger !== undefined && body.Ehemaliger !== null) {
      updateData.Ehemaliger = Boolean(body.Ehemaliger)
    }
    if (body.Notizen !== undefined && body.Notizen !== null) {
      updateData.Notizen = String(body.Notizen)
    }
    if (body.Bemerkungen !== undefined && body.Bemerkungen !== null) {
      updateData.Bemerkungen = String(body.Bemerkungen)
    }
    if (body.Anrede !== undefined && body.Anrede !== null) {
      updateData.Anrede = String(body.Anrede)
    }
    if (body.EMail !== undefined && body.EMail !== null) {
      updateData.EMail = String(body.EMail)
    }
    if (body.TelefonPrivat !== undefined && body.TelefonPrivat !== null) {
      updateData.TelefonPrivat = String(body.TelefonPrivat)
    }
    if (body.TelefonFirma !== undefined && body.TelefonFirma !== null) {
      updateData.TelefonFirma = String(body.TelefonFirma)
    }
    if (body.TelefonMobil !== undefined && body.TelefonMobil !== null) {
      updateData.TelefonMobil = String(body.TelefonMobil)
    }
    if (body.Fax !== undefined && body.Fax !== null) {
      updateData.Fax = String(body.Fax)
    }
    if (body.SpAnz !== undefined && body.SpAnz !== null) {
      updateData.SpAnz = Number(body.SpAnz)
    }
    if (body.SpGew !== undefined && body.SpGew !== null) {
      updateData.SpGew = Number(body.SpGew)
    }
    if (body.SpUn !== undefined && body.SpUn !== null) {
      updateData.SpUn = Number(body.SpUn)
    }
    if (body.SpVerl !== undefined && body.SpVerl !== null) {
      updateData.SpVerl = Number(body.SpVerl)
    }
    if (body.HolzGes !== undefined && body.HolzGes !== null) {
      updateData.HolzGes = Number(body.HolzGes)
    }
    if (body.HolzMax !== undefined && body.HolzMax !== null) {
      updateData.HolzMax = Number(body.HolzMax)
    }
    if (body.HolzMin !== undefined && body.HolzMin !== null) {
      updateData.HolzMin = Number(body.HolzMin)
    }
    if (body.Punkte !== undefined && body.Punkte !== null) {
      updateData.Punkte = Number(body.Punkte)
    }
    if (body.Platz !== undefined && body.Platz !== null) {
      updateData.Platz = String(body.Platz)
    }
    if (body.TurboDBNummer !== undefined && body.TurboDBNummer !== null) {
      updateData.TurboDBNummer = Number(body.TurboDBNummer)
    }
    if (body.Login !== undefined && body.Login !== null) {
      updateData.Login = String(body.Login)
    }
    if (body.Password !== undefined && body.Password !== null) {
      updateData.Password = String(body.Password)
    }

    const dataMitglieder = await prisma.tblMitglieder.update({
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
    
    const updateCommand = `update tblMitglieder set ${updateFields} where ID=${id}`
    await CreateChangeLogAsync(request, "tblMitglieder", "update", updateCommand)

    return NextResponse.json(dataMitglieder)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Mitglieder' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// DELETE - Mitglieder löschen
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

    // Prüfen ob Mitglieder existiert
    const existingMitglieder = await prisma.tblMitglieder.findUnique({
      where: { ID: id }
    })

    if (!existingMitglieder) {
      return NextResponse.json(
        { error: 'Mitglieder nicht gefunden' },
        { status: 404 }
      )
    }

    await prisma.tblMitglieder.delete({
      where: { ID: id }
    })

    // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
    const deleteCommand = `delete from tblMitglieder where ID=${id}`
    await CreateChangeLogAsync(request, "tblMitglieder", "delete", deleteCommand)

    return NextResponse.json(
      { message: 'Mitglieder erfolgreich gelöscht' },
      { status: 200 }
    )
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Mitglieder' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
