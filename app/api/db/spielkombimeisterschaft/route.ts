import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// GET - Alle spielkombimeisterschaft abrufen
export async function GET() {
  try {
    const dataSpielKombimeisterschaft = await prisma.tblSpielKombimeisterschaft.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpielKombimeisterschaft)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spielkombimeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen SpielKombimeisterschaft erstellen
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
    if (body.Spieler1Punkte3bis8 === undefined || body.Spieler1Punkte3bis8 === null) {
      return NextResponse.json(
        { error: 'Spieler1Punkte3bis8 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Spieler1Punkte5Kugeln === undefined || body.Spieler1Punkte5Kugeln === null) {
      return NextResponse.json(
        { error: 'Spieler1Punkte5Kugeln ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Spieler2Punkte3bis8 === undefined || body.Spieler2Punkte3bis8 === null) {
      return NextResponse.json(
        { error: 'Spieler2Punkte3bis8 ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Spieler2Punkte5Kugeln === undefined || body.Spieler2Punkte5Kugeln === null) {
      return NextResponse.json(
        { error: 'Spieler2Punkte5Kugeln ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.HinR_ckrunde === undefined || body.HinR_ckrunde === null) {
      return NextResponse.json(
        { error: 'HinR_ckrunde ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpielKombimeisterschaft = await prisma.tblSpielKombimeisterschaft.create({
      data: {
        SpieltagID: Number(body.SpieltagID),
        SpielerID1: Number(body.SpielerID1),
        SpielerID2: Number(body.SpielerID2),
        Spieler1Punkte3bis8: Number(body.Spieler1Punkte3bis8),
        Spieler1Punkte5Kugeln: Number(body.Spieler1Punkte5Kugeln),
        Spieler2Punkte3bis8: Number(body.Spieler2Punkte3bis8),
        Spieler2Punkte5Kugeln: Number(body.Spieler2Punkte5Kugeln),
        HinR_ckrunde: Number(body.HinR_ckrunde),
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblSpielKombimeisterschaft(ID, SpieltagID, SpielerID1, SpielerID2, Spieler1Punkte3bis8, Spieler1Punkte5Kugeln, Spieler2Punkte3bis8, Spieler2Punkte5Kugeln, HinR_ckrunde) values (${dataSpielKombimeisterschaft.ID}, ${body.SpieltagID}, ${body.SpielerID1}, ${body.SpielerID2}, ${body.Spieler1Punkte3bis8}, ${body.Spieler1Punkte5Kugeln}, ${body.Spieler2Punkte3bis8}, ${body.Spieler2Punkte5Kugeln}, ${body.HinR_ckrunde})`
    await CreateChangeLogAsync(request, "tblSpielKombimeisterschaft", "insert", insertCommand)

    return NextResponse.json(dataSpielKombimeisterschaft, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des SpielKombimeisterschaft' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
