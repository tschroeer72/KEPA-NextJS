import { NextResponse, NextRequest } from 'next/server';
import {serialize} from 'cookie';
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken';
import crypto from 'crypto';


export async function POST(request: NextRequest) {
    const body = await request.json();
    const { benutzer, passwort } = body;
    const trimmedBenutzer = benutzer?.trim();

    const hashedPassword = crypto.createHash('sha256').update(passwort).digest('hex');

    // Check for FILME user credentials first
    if (trimmedBenutzer === process.env.FILME_USERNAME?.trim() && hashedPassword === process.env.FILME_PASSWORD?.trim()) {
        const token = jwt.sign(
            {
                userId: -1, // Filme-User ID -1
                login: trimmedBenutzer,
                isAdmin: false,
                isFilmeUser: true,
                vorname: 'Kegelfahrten',
                nachname: 'Benutzer',
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: '1h'
            }
        );

        const serialized = serialize('token', token, {
            maxAge: 60 * 60,
            sameSite: 'strict',
            path: '/',
            httpOnly: true,
        });

        const response = NextResponse.json({ 
            message: 'Erfolgreich', 
            userId: -1,
            username: trimmedBenutzer,
            vorname: 'Kegelfahrten',
            nachname: 'Benutzer',
            isAdmin: false,
            isFilmeUser: true
        }, { status: 200 });
        response.headers.set('Set-Cookie', serialized);

        return response;
    }

    // Check for ADMIN credentials
    if (trimmedBenutzer === process.env.ADMIN_USERNAME?.trim() && hashedPassword === process.env.ADMIN_PASSWORD?.trim()) {
        const token = jwt.sign(
            {
                userId: 0, // Admin ID 0
                login: trimmedBenutzer,
                isAdmin: true,
                vorname: 'Admin',
                nachname: 'User',
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: '1h'
            }
        );

        const serialized = serialize('token', token, {
            maxAge: 60 * 60,
            sameSite: 'strict',
            path: '/',
            httpOnly: true,
        });

        const response = NextResponse.json({ 
            message: 'Erfolgreich', 
            userId: 0,
            username: trimmedBenutzer,
            vorname: 'Admin',
            nachname: 'User',
            isAdmin: true
        }, { status: 200 });
        response.headers.set('Set-Cookie', serialized);

        return response;
    }

    // Check for standard users in database
    const usr = await prisma.tblMitglieder.findFirst({
      where: {
        Login: trimmedBenutzer,
        Password: hashedPassword,
      },
    });

    if (usr) {
        const token = jwt.sign(
            {
                userId: usr.ID,
                login: usr.Login,
                vorname: usr.Vorname,
                nachname: usr.Nachname,
            },
            process.env.JWT_SECRET!,
            {
                expiresIn: '1h'
            }
        );

        const serialized = serialize('token', token, {
            maxAge: 60 * 60,
            sameSite: 'strict',
            path: '/',
            httpOnly: true,
        });

        const response = NextResponse.json({ 
            message: 'Erfolgreich', 
            userId: usr.ID,
            username: usr.Login || trimmedBenutzer,
            vorname: usr.Vorname,
            nachname: usr.Nachname,
            isAdmin: false
        }, { status: 200 });
        response.headers.set('Set-Cookie', serialized);

        return response;
    }

    return NextResponse.json('Login fehlgeschlagen', { status: 401 });
}
