
import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
    // Cookie löschen durch Setzen mit negativem maxAge
    const serialized = serialize('token', '', {
        maxAge: -1, // Negative Werte löschen das Cookie
        sameSite: 'strict',
        path: '/',
        httpOnly: true,
    });

    const response = NextResponse.json('Erfolgreich abgemeldet', { status: 200 });
    response.headers.set('Set-Cookie', serialized);

    return response;
}