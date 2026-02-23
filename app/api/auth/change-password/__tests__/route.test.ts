/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        tblMitglieder: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('jsonwebtoken');

describe('POST /api/auth/change-password', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    it('sollte 401 zurückgeben, wenn kein Token vorhanden ist', async () => {
        const req = new NextRequest('http://localhost/api/auth/change-password', { method: 'POST' });
        // @ts-ignore
        jest.spyOn(req.cookies, 'get').mockReturnValue(undefined);

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Nicht autorisiert');
    });

    it('sollte 403 zurückgeben, wenn ein Admin versucht das Passwort zu ändern', async () => {
        const req = new NextRequest('http://localhost/api/auth/change-password', { method: 'POST' });
        // @ts-ignore
        jest.spyOn(req.cookies, 'get').mockReturnValue({ value: 'admin-token' });
        (jwt.verify as jest.Mock).mockReturnValue({ userId: 0, login: 'admin', isAdmin: true });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toBe('Admin-Passwort kann hier nicht geändert werden');
    });

    it('sollte das Passwort erfolgreich ändern', async () => {
        const userId = 1;
        const oldPass = 'old123';
        const newPass = 'new123';
        const hashedOldPass = crypto.createHash('sha256').update(oldPass).digest('hex');

        (jwt.verify as jest.Mock).mockReturnValue({ userId, login: 'user1' });
        (prisma.tblMitglieder.findUnique as jest.Mock).mockResolvedValue({ ID: userId, Password: hashedOldPass });

        const req = new NextRequest('http://localhost/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ altesPasswort: oldPass, neuesPasswort: newPass }),
        });
        // @ts-ignore
        jest.spyOn(req.cookies, 'get').mockReturnValue({ value: 'user-token' });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.message).toBe('Passwort erfolgreich geändert');
        expect(prisma.tblMitglieder.update).toHaveBeenCalled();
    });

    it('sollte 400 zurückgeben, wenn das alte Passwort falsch ist', async () => {
        const userId = 1;
        (jwt.verify as jest.Mock).mockReturnValue({ userId, login: 'user1' });
        (prisma.tblMitglieder.findUnique as jest.Mock).mockResolvedValue({ ID: userId, Password: 'correct-hash' });

        const req = new NextRequest('http://localhost/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ altesPasswort: 'wrong-old', neuesPasswort: 'new' }),
        });
        // @ts-ignore
        jest.spyOn(req.cookies, 'get').mockReturnValue({ value: 'user-token' });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Das alte Passwort ist nicht korrekt');
    });
});
