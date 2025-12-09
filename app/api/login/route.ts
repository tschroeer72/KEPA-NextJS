import { NextResponse, NextRequest } from 'next/server';
import {serialize} from 'cookie';
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken';
import crypto from 'crypto';


export async function POST(request: NextRequest) {
    const body = await request.json();
    const { benutzer, passwort } = body;

    //console.log('Login Route - JWT_SECRET vorhanden:', !!process.env.JWT_SECRET);

    const hashedPassword = crypto.createHash('sha256').update(passwort).digest('hex');
    //console.log(hashedPassword)

    const usr = await prisma.tblMitglieder.findFirst({
      where: {
        Login: benutzer,
        Password: hashedPassword,
      },
    });

    if (usr !== null && usr !== undefined) {
        //console.log('Login Route - Benutzer gefunden, erstelle Token');

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

        //console.log('Login Route - Token erstellt:', token);

        const serialized = serialize('token', token, {
            maxAge: 60 * 60, // 1 Stunde
            sameSite: 'strict',
            path: '/',
            httpOnly: true, // Zusätzlicher Schutz - Cookie nur serverseitig zugänglich
        });
        //console.log('Login Route - Cookie serialisiert:', serialized);

        const response = NextResponse.json('Erfolgreich', { status: 200 });
        response.headers.set('Set-Cookie', serialized);

        return response;
    } else {
        return NextResponse.json('Login fehlgeschlagen', { status: 401 });
    }
}
