import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Alle dbchangelog abrufen
export async function GET() {
  try {
    const dataDBChangeLog = await prisma.tblDBChangeLog.findMany({
      orderBy: {
        ID: 'desc'
      }
    })
    return NextResponse.json(dataDBChangeLog)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der dbchangelog' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// POST - Neuen DBChangeLog erstellen
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validierung - Nur für relevante Felder
    if (body.Computername === undefined || body.Computername === null) {
      return NextResponse.json(
        { error: 'Computername ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Tablename === undefined || body.Tablename === null) {
      return NextResponse.json(
        { error: 'Tablename ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Changetype === undefined || body.Changetype === null) {
      return NextResponse.json(
        { error: 'Changetype ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Command === undefined || body.Command === null) {
      return NextResponse.json(
        { error: 'Command ist erforderlich' },
        { status: 400 }
      )
    }
    if (body.Zeitstempel === undefined || body.Zeitstempel === null) {
      return NextResponse.json(
        { error: 'Zeitstempel ist erforderlich' },
        { status: 400 }
      )
    }

    const dataDBChangeLog = await prisma.tblDBChangeLog.create({
      data: {
        Computername: body.Computername,
        Tablename: body.Tablename,
        Changetype: body.Changetype,
        Command: body.Command,
        Zeitstempel: body.Zeitstempel,
      }
    })

    return NextResponse.json(dataDBChangeLog, { status: 201 })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des DBChangeLog' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
