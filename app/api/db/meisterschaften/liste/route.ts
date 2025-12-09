import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const meisterschaften = await prisma.tblMeisterschaften.findMany({
            orderBy: [
                { Beginn: 'desc' },
                { Ende: 'desc' },
            ]
        });

        // Prisma-Schema enthält keine Relationen; daher Meisterschaftstypen separat laden
        const typIds = Array.from(new Set(meisterschaften.map(m => m.MeisterschaftstypID)));
        const typen = await prisma.tblMeisterschaftstyp.findMany({
            where: { ID: { in: typIds } },
            select: { ID: true, Meisterschaftstyp: true }
        });
        const typenMap = new Map(typen.map(t => [t.ID, t.Meisterschaftstyp]));

        // Ergebnis so formen, als wäre include benutzt worden
        const result = meisterschaften.map(m => ({
            ...m,
            tblMeisterschaftstyp: {
                Meisterschaftstyp: typenMap.get(m.MeisterschaftstypID) ?? null,
            },
        }));

        return NextResponse.json(result);
    } catch (error) {
        console.error('Fehler beim Laden der Meisterschaftsliste:', error);
        return NextResponse.json(
            { error: 'Fehler beim Laden der Meisterschaftsliste' },
            { status: 500 }
        );
    }
}