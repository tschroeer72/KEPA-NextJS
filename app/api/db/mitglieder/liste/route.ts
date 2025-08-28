import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const mitglieder = await prisma.tblMitglieder.findMany({
            orderBy: [
                { Nachname: 'asc' },
                { Vorname: 'asc' },
            ],
            select: {
                ID: true,
                Vorname: true,
                Nachname: true,
            }
        });

        return NextResponse.json(mitglieder);
    } catch (error) {
        console.error('Fehler beim Laden der Mitgliederliste:', error);
        return NextResponse.json(
            { error: 'Fehler beim Laden der Mitgliederliste' },
            { status: 500 }
        );
    }
}