import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const meisterschaften = await prisma.tblMeisterschaften.findMany({
            include: {
                tblMeisterschaftstyp: {
                    select: {
                        Meisterschaftstyp: true
                    }
                }
            },
            orderBy: [
                { Beginn: 'desc' },
                { Ende: 'desc' },
            ]
        });

        return NextResponse.json(meisterschaften);
    } catch (error) {
        console.error('Fehler beim Laden der Meisterschaftsliste:', error);
        return NextResponse.json(
            { error: 'Fehler beim Laden der Meisterschaftsliste' },
            { status: 500 }
        );
    }
}