import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// GET - Alle spielsargkegeln abrufen
export async function GET() {
  try {
    const dataSpielSargKegeln = await prisma.tblSpielSargKegeln.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpielSargKegeln)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spielsargkegeln' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen SpielSargKegeln erstellen
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
    if (body.SpielerID === undefined || body.SpielerID === null) {
      return NextResponse.json(
        { error: 'SpielerID ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Platzierung === undefined || body.Platzierung === null) {
      return NextResponse.json(
        { error: 'Platzierung ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpielSargKegeln = await prisma.tblSpielSargKegeln.create({
      data: {
        SpieltagID: Number(body.SpieltagID),
        SpielerID: Number(body.SpielerID),
        Platzierung: Number(body.Platzierung),
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblSpielSargKegeln(ID, SpieltagID, SpielerID, Platzierung) values (${dataSpielSargKegeln.ID}, ${body.SpieltagID}, ${body.SpielerID}, ${body.Platzierung})`
    await CreateChangeLogAsync(request, "tblSpielSargKegeln", "insert", insertCommand)

    return NextResponse.json(dataSpielSargKegeln, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des SpielSargKegeln' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
