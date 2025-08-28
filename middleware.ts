import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
    //console.log('Middleware aufgerufen für:', request.url);

    // Token aus Cookie extrahieren
    const token = request.cookies.get('token')?.value;
    //console.log('Token gefunden:', !!token);

    if (!token) {
        //console.log('Kein Token - Weiterleitung zu Login');
        return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
        // Token validieren mit jose (Edge Runtime kompatibel)
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(token, secret);
        //console.log('Token gültig - Request durchgelassen');
        //console.log('Dekodierter Token:', payload);

        // Token gültig - Request durchlassen
        return NextResponse.next();
    } catch (error) {
        //console.log('Token ungültig - Weiterleitung zu Login');
        //console.log('Middleware Fehler:', error);

        // Token ungültig - weiterleiten zu Login
        return NextResponse.redirect(new URL('/login', request.url));
    }
}

export const config = {
    matcher: ['/verwaltung/:path*', '/api/db/:path*']
};