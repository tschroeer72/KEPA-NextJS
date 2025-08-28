import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const mitgliedId = parseInt(resolvedParams.id);

        if (isNaN(mitgliedId)) {
            return Response.json({ error: 'Invalid ID' }, { status: 400 });
        }

        const mitglied = await prisma.tblMitglieder.findFirst({
            where: {
                ID: mitgliedId
            }
        });

        if (!mitglied) {
            return Response.json({ error: 'Mitglied nicht gefunden' }, { status: 404 });
        }

        //console.log('Mitglied erfolgreich abgerufen:', mitglied);
        return Response.json(mitglied);
    } catch (error) {
        console.error('Error fetching mitglied:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const mitgliedId = parseInt(resolvedParams.id);
        const body = await request.json();

        if (isNaN(mitgliedId)) {
            return Response.json({ error: 'Ungültige ID' }, { status: 400 });
        }

        // Validierung der Pflichtfelder
        if (!body.Vorname || !body.Nachname) {
            return Response.json(
                { error: 'Vorname und Nachname sind Pflichtfelder' },
                { status: 400 }
            );
        }

        // Prüfen ob Mitglied existiert
        const existingMitglied = await prisma.tblMitglieder.findUnique({
            where: { ID: mitgliedId }
        });

        if (!existingMitglied) {
            return Response.json(
                { error: 'Mitglied nicht gefunden' },
                { status: 404 }
            );
        }

        // Daten für das Update vorbereiten
        const updateData: Partial<Mitglied> = {};

        // Nur definierte Werte übernehmen
        if (body.Anrede !== undefined) updateData.Anrede = body.Anrede;
        if (body.Vorname !== undefined) updateData.Vorname = body.Vorname;
        if (body.Nachname !== undefined) updateData.Nachname = body.Nachname;
        if (body.Spitzname !== undefined) updateData.Spitzname = body.Spitzname;
        if (body.Strasse !== undefined) updateData.Strasse = body.Strasse;
        if (body.PLZ !== undefined) updateData.PLZ = body.PLZ;
        if (body.Ort !== undefined) updateData.Ort = body.Ort;
        if (body.TelefonPrivat !== undefined) updateData.TelefonPrivat = body.TelefonPrivat;
        if (body.TelefonMobil !== undefined) updateData.TelefonMobil = body.TelefonMobil;
        if (body.EMail !== undefined) updateData.EMail = body.EMail;
        if (body.Ehemaliger !== undefined) updateData.Ehemaliger = body.Ehemaliger;

        // Datumsfelder behandeln
        if (body.Geburtsdatum !== undefined) {
            updateData.Geburtsdatum = body.Geburtsdatum ? new Date(body.Geburtsdatum) : undefined;
        }
        if (body.MitgliedSeit !== undefined) {
            updateData.MitgliedSeit = new Date(body.MitgliedSeit);
        }
        if (body.PassivSeit !== undefined) {
            updateData.PassivSeit = body.PassivSeit ? new Date(body.PassivSeit) : undefined;
        }
        if (body.AusgeschiedenAm !== undefined) {
            updateData.AusgeschiedenAm = body.AusgeschiedenAm ? new Date(body.AusgeschiedenAm) : undefined;
        }

        // Mitglied aktualisieren
        const updatedMitglied = await prisma.tblMitglieder.update({
            where: { ID: mitgliedId },
            data: updateData
        });

        console.log('Mitglied erfolgreich aktualisiert:', updatedMitglied);
        return Response.json(updatedMitglied);

    } catch (error) {
        console.error('Fehler beim Aktualisieren des Mitglieds:', error);
        return Response.json(
            { error: 'Fehler beim Aktualisieren der Mitgliederdaten' },
            { status: 500 }
        );
    } finally {
        await prisma.$disconnect();
    }
}
