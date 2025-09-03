import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

const prisma = new PrismaClient()

// GET - Alle meisterschaften abrufen
export async function GET() {
  try {
    const dataMeisterschaften = await prisma.tblMeisterschaften.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataMeisterschaften)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der meisterschaften' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen Meisterschaften erstellen
export async function POST(request: NextRequest) {
  try {
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
    // Validierung - Nur für erforderliche Felder
    if (body.Bezeichnung === undefined || body.Bezeichnung === null) {
      return NextResponse.json(
        { error: 'Bezeichnung ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Beginn === undefined || body.Beginn === null) {
      return NextResponse.json(
        { error: 'Beginn ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.MeisterschaftstypID === undefined || body.MeisterschaftstypID === null) {
      return NextResponse.json(
        { error: 'MeisterschaftstypID ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Aktiv === undefined || body.Aktiv === null) {
      return NextResponse.json(
        { error: 'Aktiv ist erforderlich' },
        { status: 400 }
      )
    }

    const dataMeisterschaften = await prisma.tblMeisterschaften.create({
      data: {
        Bezeichnung: String(body.Bezeichnung),
        Beginn: new Date(body.Beginn as string | number | Date),
        Ende: new Date(body.Ende as string | number | Date),
        MeisterschaftstypID: Number(body.MeisterschaftstypID),
        TurboDBNummer: Number(body.TurboDBNummer),
        Aktiv: Number(body.Aktiv),
        Bemerkungen: String(body.Bemerkungen),
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblMeisterschaften(ID, Bezeichnung, Beginn, Ende, MeisterschaftstypID, TurboDBNummer, Aktiv, Bemerkungen) values (${dataMeisterschaften.ID}, '${body.Bezeichnung}', '${new Date(body.Beginn as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}', '${new Date(body.Ende as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}', ${body.MeisterschaftstypID}, ${body.TurboDBNummer}, ${body.Aktiv}, '${body.Bemerkungen}')`
    await CreateChangeLogAsync(request, "tblMeisterschaften", "insert", insertCommand)

    return NextResponse.json(dataMeisterschaften, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Meisterschaften' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
