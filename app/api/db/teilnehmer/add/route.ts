﻿import { PrismaClient } from '@prisma/client'
import {NextRequest, NextResponse} from "next/server";
import { CreateChangeLogAsync } from "@/utils/create-change-log";

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    try {
        const url = await Promise.resolve(new URL(request.url))
        const { searchParams } = url
        const meisterschaftsID = await Promise.resolve(searchParams.get('MeisterschaftID'))
        const spielerID = await Promise.resolve(searchParams.get('MitgliedID'))

        if (!meisterschaftsID || !spielerID) {
            return NextResponse.json(
                { error: 'MeisterschaftsID und SpielerID sind erforderlich' },
                { status: 400 }
            )
        }

        const meisterschaftsIDInt = parseInt(meisterschaftsID)
        const spielerIDInt = parseInt(spielerID)

        if (isNaN(meisterschaftsIDInt) || isNaN(spielerIDInt)) {
            return NextResponse.json(
                { error: 'Ungültige MeisterschaftsID oder SpielerID' },
                { status: 400 }
            )
        }

        // Prüfen ob Teilnehmer bereits existiert
        const existingTeilnehmer = await prisma.tblTeilnehmer.findFirst({
            where: {
                MeisterschaftsID: meisterschaftsIDInt,
                SpielerID: spielerIDInt
            }
        })

        if (existingTeilnehmer) {
            return NextResponse.json(
                { error: 'Teilnehmer ist bereits für diese Meisterschaft registriert' },
                { status: 409 } // Conflict
            )
        }

        // Prüfen ob Meisterschaft existiert
        const meisterschaft = await prisma.tblMeisterschaften.findUnique({
            where: { ID: meisterschaftsIDInt }
        })

        if (!meisterschaft) {
            return NextResponse.json(
                { error: 'Meisterschaft nicht gefunden' },
                { status: 404 }
            )
        }

        // Prüfen ob Spieler/Mitglied existiert
        const spieler = await prisma.tblMitglieder.findUnique({
            where: { ID: spielerIDInt }
        })

        if (!spieler) {
            return NextResponse.json(
                { error: 'Spieler/Mitglied nicht gefunden' },
                { status: 404 }
            )
        }

        // Teilnehmer hinzufügen
        const neuerTeilnehmer = await prisma.tblTeilnehmer.create({
            data: {
                MeisterschaftsID: meisterschaftsIDInt,
                SpielerID: spielerIDInt
            },
            include: {
                tblMitglieder: {
                    select: {
                        ID: true,
                        Vorname: true,
                        Nachname: true,
                        Spitzname: true
                    }
                },
                tblMeisterschaften: {
                    select: {
                        ID: true,
                        Bezeichnung: true
                    }
                }
            }
        })

        // Erfolgreiches POST - Jetzt Changelog-Eintrag erstellen
        const insertCommand = `insert into tblTeilnehmer(MeisterschaftsID, SpielerID) values (${meisterschaftsIDInt}, ${spielerIDInt})`
        await CreateChangeLogAsync(request, "tblTeilnehmer", "insert", insertCommand)

        return NextResponse.json(
            {
                message: 'Teilnehmer erfolgreich hinzugefügt',
                teilnehmer: neuerTeilnehmer
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Database error:', error)
        return NextResponse.json(
            { error: 'Fehler beim Löschen eines Teilnehmer' },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}