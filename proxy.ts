import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Öffentliche Seiten und Auth-Endpunkte, die keine Authentifizierung benötigen
const publicRoutes = [
    "/login", "/impressum", "/kontakt", "/aktuelles", "/termine",
    "/api/login", "/api/logout", "/api/auth/verify",
];

// Matcht exakt oder als Pfad-Präfix an einer Segmentgrenze ("/login/x", nicht "/loginx")
function isPublicRoute(pathname: string): boolean {
    if (pathname === "/") return true;
    return publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Prüfe, ob die Route öffentlich ist
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }

    // Token aus Cookie extrahieren
    const token = request.cookies.get('token')?.value;

    if (!token) {
        // Für API-Anfragen: JSON-Response
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Authentifizierung erforderlich' },
                { status: 401 }
            );
        }

        // Für Seiten: Weiterleitung zu Login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // Token validieren mit jose (Edge Runtime kompatibel)
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        const { payload } = await jwtVerify(token, secret);

        // Token gültig - Request durchlassen
        const response = NextResponse.next();

        // Token-Informationen zum Request hinzufügen (optional für Server Components)
        response.headers.set('x-user-id', String(payload.userId ?? ""));
        response.headers.set('x-user-email', String(payload.login ?? ""));

        return response;
    } catch (error) {
        // Für API-Anfragen: JSON-Response
        if (pathname.startsWith('/api/')) {
            return NextResponse.json(
                { error: 'Ungültiger oder abgelaufener Token' },
                { status: 401 }
            );
        }

        // Für Seiten: Weiterleitung zu Login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(loginUrl);
    }
}

// Keine Prüfung für interne Next.js-Pfade und statische Dateien (alles mit Dateiendung)
export const config = {
    matcher: ["/((?!_next/|.*\\..*).*)"],
};
