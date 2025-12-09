import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// GET - Alle meisterschaftstyp abrufen
export async function GET() {
  try {
    const dataMeisterschaftstyp = await prisma.tblMeisterschaftstyp.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataMeisterschaftstyp)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der meisterschaftstyp' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Meisterschaftstyp erstellen
export async function POST(request: NextRequest) {
  try {
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
    // Validierung - Nur für erforderliche Felder
    if (body.Meisterschaftstyp === undefined || body.Meisterschaftstyp === null) {
      return NextResponse.json(
        { error: 'Meisterschaftstyp ist erforderlich' },
        { status: 400 }
      )
    }

    const dataMeisterschaftstyp = await prisma.tblMeisterschaftstyp.create({
      data: {
        Meisterschaftstyp: String(body.Meisterschaftstyp),
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblMeisterschaftstyp(ID, Meisterschaftstyp) values (${dataMeisterschaftstyp.ID}, '${body.Meisterschaftstyp}')`
    await CreateChangeLogAsync(request, "tblMeisterschaftstyp", "insert", insertCommand)

    return NextResponse.json(dataMeisterschaftstyp, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Meisterschaftstyp' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
