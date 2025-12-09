import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// GET - Alle spielblitztunier abrufen
export async function GET() {
  try {
    const dataSpielBlitztunier = await prisma.tblSpielBlitztunier.findMany({
      orderBy: {
        ID: "desc",
      },
    });
    return NextResponse.json(dataSpielBlitztunier)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spielblitztunier' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Neuen SpielBlitztunier erstellen
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
    if (body.PunkteSpieler1 === undefined || body.PunkteSpieler1 === null) {
      return NextResponse.json(
        { error: 'PunkteSpieler1 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.PunkteSpieler2 === undefined || body.PunkteSpieler2 === null) {
      return NextResponse.json(
        { error: 'PunkteSpieler2 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HinR_ckrunde === undefined || body.HinR_ckrunde === null) {
      return NextResponse.json(
        { error: 'HinR_ckrunde ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpielBlitztunier = await prisma.tblSpielBlitztunier.create({
      data: {
        SpieltagID: Number(body.SpieltagID),
        SpielerID1: Number(body.SpielerID1),
        SpielerID2: Number(body.SpielerID2),
        PunkteSpieler1: Number(body.PunkteSpieler1),
        PunkteSpieler2: Number(body.PunkteSpieler2),
        HinR_ckrunde: Number(body.HinR_ckrunde),
      },
    });
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblSpielBlitztunier(ID, SpieltagID, SpielerID1, SpielerID2, PunkteSpieler1, PunkteSpieler2, HinR_ckrunde) values (${dataSpielBlitztunier.ID}, ${body.SpieltagID}, ${body.SpielerID1}, ${body.SpielerID2}, ${body.PunkteSpieler1}, ${body.PunkteSpieler2}, ${body.HinR_ckrunde})`
    await CreateChangeLogAsync(request, "tblSpielBlitztunier", "insert", insertCommand)

    return NextResponse.json(dataSpielBlitztunier, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des SpielBlitztunier' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}
