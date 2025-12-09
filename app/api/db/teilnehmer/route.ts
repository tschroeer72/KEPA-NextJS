import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// GET - Alle teilnehmer abrufen
export async function GET() {
  try {
    const dataTeilnehmer = await prisma.tblTeilnehmer.findMany({
      orderBy: {
        ID: "desc",
      },
    });
    return NextResponse.json(dataTeilnehmer)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der teilnehmer' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Neuen Teilnehmer erstellen
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
    if (body.SpielerID === undefined || body.SpielerID === null) {
      return NextResponse.json(
        { error: 'SpielerID ist erforderlich' },
        { status: 400 }
      )
    }

    const dataTeilnehmer = await prisma.tblTeilnehmer.create({
      data: {
        MeisterschaftsID: Number(body.MeisterschaftsID),
        SpielerID: Number(body.SpielerID),
      },
    });
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblTeilnehmer(ID, MeisterschaftsID, SpielerID) values (${dataTeilnehmer.ID}, ${body.MeisterschaftsID}, ${body.SpielerID})`
    await CreateChangeLogAsync(request, "tblTeilnehmer", "insert", insertCommand)

    return NextResponse.json(dataTeilnehmer, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Teilnehmer' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect();
  }
}
