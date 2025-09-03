import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// GET - Alle spiel6tagerennen abrufen
export async function GET() {
  try {
    const dataSpiel6TageRennen = await prisma.tblSpiel6TageRennen.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpiel6TageRennen)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spiel6tagerennen' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Spiel6TageRennen erstellen
export async function POST(request: NextRequest) {
  try {
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
    // Validierung - Nur für erforderliche Felder
    if (body.SpieltagID === undefined || body.SpieltagID === null) {
      return NextResponse.json(
        { error: 'SpieltagID ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.SpielerID1 === undefined || body.SpielerID1 === null) {
      return NextResponse.json(
        { error: 'SpielerID1 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.SpielerID2 === undefined || body.SpielerID2 === null) {
      return NextResponse.json(
        { error: 'SpielerID2 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Runden === undefined || body.Runden === null) {
      return NextResponse.json(
        { error: 'Runden ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Punkte === undefined || body.Punkte === null) {
      return NextResponse.json(
        { error: 'Punkte ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpiel6TageRennen = await prisma.tblSpiel6TageRennen.create({
      data: {
        SpieltagID: Number(body.SpieltagID),
        SpielerID1: Number(body.SpielerID1),
        SpielerID2: Number(body.SpielerID2),
        Runden: Number(body.Runden),
        Punkte: Number(body.Punkte),
        Spielnummer: Number(body.Spielnummer),
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblSpiel6TageRennen(ID, SpieltagID, SpielerID1, SpielerID2, Runden, Punkte, Spielnummer) values (${dataSpiel6TageRennen.ID}, ${body.SpieltagID}, ${body.SpielerID1}, ${body.SpielerID2}, ${body.Runden}, ${body.Punkte}, ${body.Spielnummer})`
    await CreateChangeLogAsync(request, "tblSpiel6TageRennen", "insert", insertCommand)

    return NextResponse.json(dataSpiel6TageRennen, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Spiel6TageRennen' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
