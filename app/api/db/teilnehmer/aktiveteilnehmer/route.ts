import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { AktiverMitspieler } from '@/interfaces/aktiver-mitspieler'

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

        // Da im Prisma-Schema keine Relationen definiert sind, führen wir die "Join"-Logik manuell aus
        const teilnehmer = await prisma.tblTeilnehmer.findMany({
          where: { MeisterschaftsID: meisterschaftsIdNumber },
          select: {
            SpielerID: true,
          },
        });

        const spielerIds = Array.from(new Set(teilnehmer.map(t => t.SpielerID)));
        if (spielerIds.length === 0) {
          return NextResponse.json([]);
        }

        const mitglieder = await prisma.tblMitglieder.findMany({
          where: { ID: { in: spielerIds } },
          select: {
            ID: true,
            Vorname: true,
            Nachname: true,
            Spitzname: true,
          },
        });
        const mitgliederMap = new Map(mitglieder.map(m => [m.ID, m]));

        // Transformiere die Daten entsprechend dem AktiverMitspieler Interface
        const aktiveSpieler: AktiverMitspieler[] = teilnehmer.map((t) => {
            const mitglied = mitgliederMap.get(t.SpielerID) || null

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
        }).filter((spieler): spieler is AktiverMitspieler => spieler !== null) // Entferne null-Werte

        return NextResponse.json(aktiveSpieler)

    } catch (error) {
        console.error('Database error:', error)
        return NextResponse.json(
            { error: 'Fehler beim Abrufen der aktiven Teilnehmer' },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect();
    }
}