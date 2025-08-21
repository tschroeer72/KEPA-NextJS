import { NextResponse, NextRequest } from 'next/server';
import cookie, {serialize} from 'cookie';
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
    const body = await request.json();
    const { benutzer, passwort } = body;

    const hashedPassword = crypto.createHash('sha256').update(passwort).digest('hex');
    console.log(hashedPassword)

    const usr = await prisma.tblMitglieder.findFirst({
            where: {
                Login: benutzer,
                Password: hashedPassword
            }
        }
    );

    if (usr !== null && usr !== undefined) {
        // Token generieren
        const token = jwt.sign(
            {
                userId: usr?.ID,
                login: usr?.Login,
                // weitere User-Daten nach Bedarf
            },
            process.env.JWT_SECRET!, // Verwende JWT_SECRET statt TOKEN
            {
                expiresIn: '1h' // Token läuft nach 1 Stunde ab
            }
        );

        const serialized = serialize('token', token, {
            maxAge: 60 * 60, // 1 Stunde
            sameSite: 'strict',
            path: '/',
            httpOnly: true, // Zusätzlicher Schutz - Cookie nur serverseitig zugänglich
        });


        const response = NextResponse.json('Erfolgreich', { status: 200 });
        response.headers.set('Set-Cookie', serialized);

        return response;
    } else {
        return NextResponse.json('Login fehlgeschlagen', { status: 401 });
    }
}
