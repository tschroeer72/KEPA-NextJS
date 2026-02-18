import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    //console.log('Verify Route - Token vorhanden:', !!token);
    //console.log('Verify Route - JWT_SECRET vorhanden:', !!process.env.JWT_SECRET);
    //console.log('Verify Route - JWT_SECRET:', process.env.JWT_SECRET);

    if (!token) {
        return NextResponse.json({ error: 'Kein Token vorhanden' }, { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number, login: string, vorname?: string, nachname?: string, isAdmin?: boolean };
        //console.log('Verify Route - Token erfolgreich verifiziert');
        return NextResponse.json({ 
            message: 'Token gültig', 
            userId: decoded.userId,
            username: decoded.login,
            vorname: decoded.vorname || null,
            nachname: decoded.nachname || null,
            isAdmin: !!decoded.isAdmin
        }, { status: 200 });
    } catch (error) {
        console.log('Verify Route - Token Verifikation fehlgeschlagen:', error);
        return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }
}