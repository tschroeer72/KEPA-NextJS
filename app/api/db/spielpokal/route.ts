import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// GET - Alle spielpokal abrufen
export async function GET() {
  try {
    const dataSpielPokal = await prisma.tblSpielPokal.findMany({
      orderBy: {
        ID: "desc",
      },
    });
    return NextResponse.json(dataSpielPokal)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spielpokal' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Neuen SpielPokal erstellen
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

    const dataSpielPokal = await prisma.tblSpielPokal.create({
      data: {
        SpieltagID: Number(body.SpieltagID),
        SpielerID: Number(body.SpielerID),
        Platzierung: Number(body.Platzierung),
      },
    });
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblSpielPokal(ID, SpieltagID, SpielerID, Platzierung) values (${dataSpielPokal.ID}, ${body.SpieltagID}, ${body.SpielerID}, ${body.Platzierung})`
    await CreateChangeLogAsync(request, "tblSpielPokal", "insert", insertCommand)

    return NextResponse.json(dataSpielPokal, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des SpielPokal' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}
