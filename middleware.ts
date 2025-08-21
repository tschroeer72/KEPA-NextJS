import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
    // Token aus Cookie extrahieren
    const token = request.cookies.get('token')?.value;

    if (!token) {
        // Kein Token vorhanden - weiterleiten zu Login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // Token validieren
        jwt.verify(token, process.env.JWT_SECRET!);

        // Token gültig - Request durchlassen
        return NextResponse.next();
    } catch (error) {
        // Token ungültig - weiterleiten zu Login
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

// Definieren, welche Routen geschützt werden sollen
export const config = {
    matcher: ['/verwaltung/:path*'] // Alle Verwaltungsrouten
};