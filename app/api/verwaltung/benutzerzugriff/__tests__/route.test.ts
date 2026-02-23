/**
 * @jest-environment node
 */
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        tblMitglieder: {
            findMany: jest.fn(),
            update: jest.fn(),
        },
    },
}));

jest.mock('jsonwebtoken');

describe('API /api/verwaltung/benutzerzugriff', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    describe('GET', () => {
        it('sollte 403 zurückgeben, wenn nicht Admin', async () => {
            const req = new NextRequest('http://localhost/api/verwaltung/benutzerzugriff');
            // @ts-ignore
            jest.spyOn(req.cookies, 'get').mockReturnValue({ value: 'user-token' });
            (jwt.verify as jest.Mock).mockReturnValue({ isAdmin: false });

            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe('Nicht autorisiert');
        });

        it('sollte Mitgliederliste zurückgeben, wenn Admin', async () => {
            const req = new NextRequest('http://localhost/api/verwaltung/benutzerzugriff');
            // @ts-ignore
            jest.spyOn(req.cookies, 'get').mockReturnValue({ value: 'admin-token' });
            (jwt.verify as jest.Mock).mockReturnValue({ isAdmin: true });
            (prisma.tblMitglieder.findMany as jest.Mock).mockResolvedValue([
                { ID: 1, Vorname: 'Max', Nachname: 'M', Login: 'max', Password: 'hashed-password' }
            ]);

            const response = await GET(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data[0].Password).toBe('********');
        });
    });

    describe('POST', () => {
        it('sollte einen Benutzer deaktivieren', async () => {
            const req = new NextRequest('http://localhost/api/verwaltung/benutzerzugriff', {
                method: 'POST',
                body: JSON.stringify({ id: 1, action: 'deaktivieren' }),
            });
            // @ts-ignore
            jest.spyOn(req.cookies, 'get').mockReturnValue({ value: 'admin-token' });
            (jwt.verify as jest.Mock).mockReturnValue({ isAdmin: true });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe('Benutzer deaktiviert');
            expect(prisma.tblMitglieder.update).toHaveBeenCalledWith(expect.objectContaining({
                data: { Login: null, Password: null }
            }));
        });

        it('sollte einen Benutzer aktualisieren', async () => {
            const req = new NextRequest('http://localhost/api/verwaltung/benutzerzugriff', {
                method: 'POST',
                body: JSON.stringify({ id: 1, login: 'newlogin', action: 'speichern' }),
            });
            // @ts-ignore
            jest.spyOn(req.cookies, 'get').mockReturnValue({ value: 'admin-token' });
            (jwt.verify as jest.Mock).mockReturnValue({ isAdmin: true });

            const response = await POST(req);
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.message).toBe('Benutzer aktualisiert');
            expect(prisma.tblMitglieder.update).toHaveBeenCalled();
        });
    });
});
