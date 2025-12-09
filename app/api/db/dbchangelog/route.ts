import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {CreateChangeLogAsync} from "@/utils/create-change-log";

// GET - Alle dbchangelog abrufen
export async function GET() {
  try {
    const dataDBChangeLog = await prisma.tblDBChangeLog.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataDBChangeLog)
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der dbchangelog' },
      { status: 500 }
    )
  }
}

// POST - Neuen DBChangeLog erstellen
export async function POST(request: NextRequest) {
  try {
    const body: { [key: string]: string | number | boolean | Date | null | undefined } = await request.json()
    
    // Validierung - Nur für erforderliche Felder
    if (body.Zeitstempel === undefined || body.Zeitstempel === null) {
      return NextResponse.json(
        { error: 'Zeitstempel ist erforderlich' },
        { status: 400 }
      )
    }

    const dataDBChangeLog = await prisma.tblDBChangeLog.create({
      data: {
        Computername: String(body.Computername),
        Tablename: String(body.Tablename),
        Changetype: String(body.Changetype),
        Command: String(body.Command),
        Zeitstempel: new Date(body.Zeitstempel as string | number | Date),
      }
    })
    
    // Erfolgreicher POST - Jetzt Changelog-Eintrag erstellen
    const insertCommand = `insert into tblDBChangeLog(ID, Computername, Tablename, Changetype, Command, Zeitstempel) values (${dataDBChangeLog.ID}, '${body.Computername}', '${body.Tablename}', '${body.Changetype}', '${body.Command}', '${new Date(body.Zeitstempel as string | number | Date).toISOString().slice(0, 19).replace('T', ' ')}')`
    await CreateChangeLogAsync(request, "tblDBChangeLog", "insert", insertCommand)

    return NextResponse.json(dataDBChangeLog, { status: 201 })
  } catch (error: unknown) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des DBChangeLog' },
      { status: 500 }
    )
  }
}
