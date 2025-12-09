import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// GET - Alle settings abrufen
export async function GET() {
  try {
    const dataSettings = await prisma.tblSettings.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSettings)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Settings erstellen
export async function POST(request: NextRequest) {
  try {
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
    // Validierung - Nur für erforderliche Felder
    if (body.Computername === undefined || body.Computername === null) {
      return NextResponse.json(
        { error: 'Computername ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Parametername === undefined || body.Parametername === null) {
      return NextResponse.json(
        { error: 'Parametername ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Parameterwert === undefined || body.Parameterwert === null) {
      return NextResponse.json(
        { error: 'Parameterwert ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSettings = await prisma.tblSettings.create({
      data: {
        Computername: String(body.Computername),
        Parametername: String(body.Parametername),
        Parameterwert: String(body.Parameterwert),
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblSettings(ID, Computername, Parametername, Parameterwert) values (${dataSettings.ID}, '${body.Computername}', '${body.Parametername}', '${body.Parameterwert}')`
    await CreateChangeLogAsync(request, "tblSettings", "insert", insertCommand)

    return NextResponse.json(dataSettings, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Settings' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
