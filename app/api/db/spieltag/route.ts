import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// GET - Alle spieltag abrufen
export async function GET() {
  try {
    const dataSpieltag = await prisma.tblSpieltag.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataSpieltag)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der spieltag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Spieltag erstellen
export async function POST(request: NextRequest) {
  try {
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
    // Validierung - Nur für erforderliche Felder
    if (body.MeisterschaftsID === undefined || body.MeisterschaftsID === null) {
      return NextResponse.json(
        { error: 'MeisterschaftsID ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Spieltag === undefined || body.Spieltag === null) {
      return NextResponse.json(
        { error: 'Spieltag ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.InBearbeitung === undefined || body.InBearbeitung === null) {
      return NextResponse.json(
        { error: 'InBearbeitung ist erforderlich' },
        { status: 400 }
      )
    }

    const dataSpieltag = await prisma.tblSpieltag.create({
      data: {
        MeisterschaftsID: Number(body.MeisterschaftsID),
        Spieltag: new Date(body.Spieltag as string | number | Date),
        InBearbeitung: Boolean(body.InBearbeitung),
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblSpieltag(ID, MeisterschaftsID, Spieltag, InBearbeitung) values (${dataSpieltag.ID}, ${body.MeisterschaftsID}, '${new Date(body.Spieltag as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}', ${body.InBearbeitung ? 1 : 0})`
    await CreateChangeLogAsync(request, "tblSpieltag", "insert", insertCommand)

    return NextResponse.json(dataSpieltag, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Spieltag' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
