import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AktiverMitspieler } from '@/interfaces/aktiver-mitspieler'

const prisma = new PrismaClient()

// GET - Aktive Teilnehmer für eine spezifische Meisterschaft abrufen
export async function GET(request: NextRequest) {
    try {
        const url = await Promise.resolve(new URL(request.url))
        const { searchParams } = url
        const meisterschaftsId = await Promise.resolve(searchParams.get('MeisterschaftID'))

        if (!meisterschaftsId) {
            return NextResponse.json(
                { error: 'Meisterschafts-ID ist erforderlich' },
                { status: 400 }
            )
        }

        const meisterschaftsIdNumber = parseInt(meisterschaftsId)
        if (isNaN(meisterschaftsIdNumber)) {
            return NextResponse.json(
                { error: 'Ungültige Meisterschafts-ID' },
                { status: 400 }
            )
        }

        // Join zwischen TblTeilnehmer und TblMitglieder über die SpielerId
        const aktiveTeilnehmer = await prisma.tblTeilnehmer.findMany({
            where: {
                MeisterschaftsID: meisterschaftsIdNumber
            },
            include: {
                // Annahme: Es gibt eine Relation zu TblMitglieder über SpielerId
                tblMitglieder: {
                    select: {
                        ID: true,
                        Vorname: true,
                        Nachname: true,
                        Spitzname: true
                    }
                }
            }
        })

        // Transformiere die Daten entsprechend dem AktiverMitspieler Interface
        const aktiveSpieler: AktiverMitspieler[] = aktiveTeilnehmer.map(teilnehmer => {
            const mitglied = teilnehmer.tblMitglieder

            if (!mitglied) {
                return null // Skip if no member found
            }

            const anzeigename = mitglied.Spitzname && mitglied.Spitzname.trim() !== ''
                ? mitglied.Spitzname
                : mitglied.Vorname

            return {
                ID: mitglied.ID,
                Vorname: mitglied.Vorname,
                Nachname: mitglied.Nachname,
                Spitzname: mitglied.Spitzname || '',
                Anzeigename: anzeigename
            }
        }).filter(spieler => spieler !== null) // Entferne null-Werte

        return NextResponse.json(aktiveSpieler)

    } catch (error) {
        console.error('Database error:', error)
        return NextResponse.json(
            { error: 'Fehler beim Abrufen der aktiven Teilnehmer' },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}