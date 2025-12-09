import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// GET - Alle spielmeisterschaft abrufen
export async function GET() {
  try {
    const dataSpielMeisterschaft = await prisma.tblSpielMeisterschaft.findMany({
      orderBy: {
        ID: "desc",
      },
    });
    return NextResponse.json(dataSpielMeisterschaft)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spielmeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Neuen SpielMeisterschaft erstellen
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
    if (body.HolzSpieler1 === undefined || body.HolzSpieler1 === null) {
      return NextResponse.json(
        { error: 'HolzSpieler1 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HolzSpieler2 === undefined || body.HolzSpieler2 === null) {
      return NextResponse.json(
        { error: 'HolzSpieler2 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HinRueckrunde === undefined || body.HinRueckrunde === null) {
      return NextResponse.json(
        { error: 'HinRueckrunde ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpielMeisterschaft = await prisma.tblSpielMeisterschaft.create({
      data: {
        SpieltagID: Number(body.SpieltagID),
        SpielerID1: Number(body.SpielerID1),
        SpielerID2: Number(body.SpielerID2),
        HolzSpieler1: Number(body.HolzSpieler1),
        HolzSpieler2: Number(body.HolzSpieler2),
        HinRueckrunde: Number(body.HinRueckrunde),
      },
    });
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblSpielMeisterschaft(ID, SpieltagID, SpielerID1, SpielerID2, HolzSpieler1, HolzSpieler2, HinR_ckrunde) values (${dataSpielMeisterschaft.ID}, ${body.SpieltagID}, ${body.SpielerID1}, ${body.SpielerID2}, ${body.HolzSpieler1}, ${body.HolzSpieler2}, ${body.HinR_ckrunde})`
    await CreateChangeLogAsync(request, "tblSpielMeisterschaft", "insert", insertCommand)

    return NextResponse.json(dataSpielMeisterschaft, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des SpielMeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}
