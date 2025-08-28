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
        jwt.verify(token, process.env.JWT_SECRET!);
        //console.log('Verify Route - Token erfolgreich verifiziert');
        return NextResponse.json({ message: 'Token gültig' }, { status: 200 });
    } catch (error) {
        console.log('Verify Route - Token Verifikation fehlgeschlagen:', error);
        return NextResponse.json({ error: 'Token ungültig' }, { status: 401 });
    }
}