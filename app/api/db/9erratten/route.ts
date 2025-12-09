import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// GET - Alle 9erratten abrufen
export async function GET() {
  try {
    const data9erRatten = await prisma.tbl9erRatten.findMany({
      orderBy: {
        ID: "desc",
      },
    });
    return NextResponse.json(data9erRatten)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der 9erratten' },
      { status: 500 }
    )
  }
}

// POST - Neuen 9erRatten erstellen
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
    if (body.Neuner === undefined || body.Neuner === null) {
      return NextResponse.json(
        { error: 'Neuner ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Ratten === undefined || body.Ratten === null) {
      return NextResponse.json(
        { error: 'Ratten ist erforderlich' },
        { status: 400 }
      )
    }

    const data9erRatten = await prisma.tbl9erRatten.create({
      data: {
        SpieltagID: Number(body.SpieltagID),
        SpielerID: Number(body.SpielerID),
        Neuner: Number(body.Neuner),
        Ratten: Number(body.Ratten),
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tbl9erRatten(ID, SpieltagID, SpielerID, Neuner, Ratten) values (${data9erRatten.ID}, ${body.SpieltagID}, ${body.SpielerID}, ${body.Neuner}, ${body.Ratten})`
    await CreateChangeLogAsync(request, "tbl9erRatten", "insert", insertCommand)

    return NextResponse.json(data9erRatten, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des 9erRatten' },
      { status: 500 }
    )
  }
}
