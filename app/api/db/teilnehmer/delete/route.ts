import { PrismaClient } from '@prisma/client'
import {NextRequest, NextResponse} from "next/server";
import { CreateChangeLogAsync } from "@/utils/create-change-log";

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
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
// Prüfen ob Teilnehmer existiert
        const existingTeilnehmer = await prisma.tblTeilnehmer.findFirst({
            where: {
                MeisterschaftsID: meisterschaftsIDInt,
                SpielerID: spielerIDInt
            }
        })

        if (!existingTeilnehmer) {
            return NextResponse.json(
                { error: 'Teilnehmer nicht gefunden' },
                { status: 404 }
            )
        }

        await prisma.tblTeilnehmer.delete({
            where: {
                ID: existingTeilnehmer.ID
            }
        })

        // Erfolgreiches DELETE - Jetzt Changelog-Eintrag erstellen
        const deleteCommand = `delete from tblTeilnehmer where MeisterschaftsID=${meisterschaftsIDInt} and SpielerID=${spielerIDInt}`
        await CreateChangeLogAsync(request, "tblTeilnehmer", "delete", deleteCommand)

        return NextResponse.json(
            {
                message: 'Teilnehmer erfolgreich gelöscht',
                deletedTeilnehmer: existingTeilnehmer
            },
            { status: 200 }
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