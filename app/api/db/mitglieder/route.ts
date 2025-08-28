import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const mitglieder = await prisma.tblMitglieder.findMany({
            orderBy: {
                ID: 'desc'
            }
        });
        return Response.json(mitglieder);
    } catch (error) {
        console.error('Database error:', error);
        return Response.json(
            { error: 'Fehler beim Abrufen der Mitglieder' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validierung der Pflichtfelder
        if (!body.Vorname || !body.Nachname) {
            return Response.json(
                { error: 'Vorname und Nachname sind Pflichtfelder' },
                { status: 400 }
            );
        }

        // Daten für die Erstellung vorbereiten
        const createData: MitgliedCreate = {
            Vorname: body.Vorname,
            Nachname: body.Nachname,
            MitgliedSeit: body.MitgliedSeit ? new Date(body.MitgliedSeit) : new Date(),
            Ehemaliger: body.Ehemaliger || false
        };

        // Optionale Felder nur hinzufügen, wenn sie definiert sind
        if (body.Anrede !== undefined && body.Anrede !== '') createData.Anrede = body.Anrede;
        if (body.Spitzname !== undefined && body.Spitzname !== '') createData.Spitzname = body.Spitzname;
        if (body.Strasse !== undefined && body.Strasse !== '') createData.Strasse = body.Strasse;
        if (body.PLZ !== undefined && body.PLZ !== '') createData.PLZ = body.PLZ;
        if (body.Ort !== undefined && body.Ort !== '') createData.Ort = body.Ort;
        if (body.TelefonPrivat !== undefined && body.TelefonPrivat !== '') createData.TelefonPrivat = body.TelefonPrivat;
        if (body.TelefonMobil !== undefined && body.TelefonMobil !== '') createData.TelefonMobil = body.TelefonMobil;
        if (body.EMail !== undefined && body.EMail !== '') createData.EMail = body.EMail;

        // Datumsfelder behandeln
        if (body.Geburtsdatum !== undefined) {
            createData.Geburtsdatum = body.Geburtsdatum ? new Date(body.Geburtsdatum) : undefined;
        }
        if (body.MitgliedSeit !== undefined) {
            createData.MitgliedSeit = new Date(body.MitgliedSeit);
        }
        if (body.PassivSeit !== undefined) {
            createData.PassivSeit = body.PassivSeit ? new Date(body.PassivSeit) : undefined;
        }
        if (body.AusgeschiedenAm !== undefined) {
            createData.AusgeschiedenAm = body.AusgeschiedenAm ? new Date(body.AusgeschiedenAm) : undefined;
        }

        // Neues Mitglied erstellen
        const mitglied = await prisma.tblMitglieder.create({
            data: createData
        });

        console.log('Neues Mitglied erfolgreich erstellt:', mitglied);
        return Response.json(mitglied, { status: 201 });

    } catch (error) {
        console.error('Fehler beim Erstellen des Mitglieds:', error);
        return Response.json(
            { error: 'Fehler beim Erstellen des Mitglieds' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
