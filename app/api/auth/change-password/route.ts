import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number, login: string, isAdmin?: boolean };
        
        // Admin Passwort-Änderung über diesen Weg verhindern oder separat behandeln
        if (decoded.isAdmin || decoded.userId === 0) {
            return NextResponse.json({ error: 'Admin-Passwort kann hier nicht geändert werden' }, { status: 403 });
        }

        const body = await request.json();
        const { altesPasswort, neuesPasswort } = body;

        if (!altesPasswort || !neuesPasswort) {
            return NextResponse.json({ error: 'Passwörter fehlen' }, { status: 400 });
        }

        if (altesPasswort === neuesPasswort) {
            return NextResponse.json({ error: 'Das neue Passwort darf nicht dem alten entsprechen' }, { status: 400 });
        }

        // Benutzer aus DB laden
        const user = await prisma.tblMitglieder.findUnique({
            where: { ID: decoded.userId }
        });

        if (!user) {
            return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
        }

        // Altes Passwort prüfen
        const hashedOldPassword = crypto.createHash('sha256').update(altesPasswort).digest('hex');
        if (user.Password !== hashedOldPassword) {
            return NextResponse.json({ error: 'Das alte Passwort ist nicht korrekt' }, { status: 400 });
        }

        // Neues Passwort hashen und speichern
        const hashedNewPassword = crypto.createHash('sha256').update(neuesPasswort).digest('hex');
        await prisma.tblMitglieder.update({
            where: { ID: user.ID },
            data: { Password: hashedNewPassword }
        });

        return NextResponse.json({ message: 'Passwort erfolgreich geändert' }, { status: 200 });

    } catch (error) {
        console.error('Change Password Error:', error);
        return NextResponse.json({ error: 'Serverfehler' }, { status: 500 });
    }
}
