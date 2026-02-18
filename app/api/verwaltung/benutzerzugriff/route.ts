import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

function isAdmin(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    if (!token) return false;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        return !!decoded.isAdmin;
    } catch {
        return false;
    }
}

export async function GET(request: NextRequest) {
    if (!isAdmin(request)) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    try {
        const mitglieder = await prisma.tblMitglieder.findMany({
            select: {
                ID: true,
                Vorname: true,
                Nachname: true,
                Login: true,
                Password: true,
            },
            orderBy: [
                { Nachname: 'asc' },
                { Vorname: 'asc' },
            ],
        });

        // Passwort nur als Sternchen markieren oder einfach anzeigen, dass eines da ist
        const sanitizedMitglieder = mitglieder.map(m => ({
            ...m,
            Password: m.Password ? '********' : '',
        }));

        return NextResponse.json(sanitizedMitglieder);
    } catch (error) {
        console.error('Fehler beim Abrufen der Mitglieder:', error);
        return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    if (!isAdmin(request)) {
        return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, login, passwort, action } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID fehlt' }, { status: 400 });
        }

        if (action === 'deaktivieren') {
            await prisma.tblMitglieder.update({
                where: { ID: id },
                data: {
                    Login: null,
                    Password: null,
                },
            });
            return NextResponse.json({ message: 'Benutzer deaktiviert' });
        } else if (action === 'speichern') {
            if (!login) {
                return NextResponse.json({ error: 'Login fehlt' }, { status: 400 });
            }

            const data: any = { Login: login };
            if (passwort && passwort !== '********') {
                data.Password = crypto.createHash('sha256').update(passwort).digest('hex');
            }

            await prisma.tblMitglieder.update({
                where: { ID: id },
                data,
            });
            return NextResponse.json({ message: 'Benutzer aktualisiert' });
        }

        return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 });
    } catch (error) {
        console.error('Fehler beim Aktualisieren des Benutzers:', error);
        return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
    }
}
