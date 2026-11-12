/**
 * @jest-environment node
 */
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

    describe('Autorisierung', () => {
        const withToken = (req: NextRequest, token?: string) => {
            // @ts-ignore
            jest.spyOn(req.cookies, 'get').mockReturnValue(token ? { value: token } : undefined);
            return req;
        };
        const postReq = (body: any, token?: string) =>
            withToken(new NextRequest('http://localhost/api/verwaltung/benutzerzugriff', {
                method: 'POST', body: JSON.stringify(body),
            }), token);
        const asAdmin = () => (jwt.verify as jest.Mock).mockReturnValue({ isAdmin: true });

        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            (prisma.tblMitglieder.update as jest.Mock).mockReset();
            (prisma.tblMitglieder.findMany as jest.Mock).mockReset();
            (jwt.verify as jest.Mock).mockReset();
        });
        afterEach(() => jest.restoreAllMocks());

        it('GET ohne Token -> 403, JWT wird nicht geprueft', async () => {
            const res = await GET(withToken(new NextRequest('http://localhost/api/verwaltung/benutzerzugriff')));
            expect(res.status).toBe(403);
            expect(jwt.verify).not.toHaveBeenCalled();
            expect(prisma.tblMitglieder.findMany).not.toHaveBeenCalled();
        });

        it('GET mit ungueltigem Token (verify wirft) -> 403', async () => {
            (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });
            const res = await GET(withToken(new NextRequest('http://localhost/api/verwaltung/benutzerzugriff'), 'bad'));
            expect(res.status).toBe(403);
        });

        it('GET mit Token ohne isAdmin-Claim (z.B. FILME-User) -> 403', async () => {
            (jwt.verify as jest.Mock).mockReturnValue({ userId: -1, isFilmeUser: true });
            const res = await GET(withToken(new NextRequest('http://localhost/api/verwaltung/benutzerzugriff'), 't'));
            expect(res.status).toBe(403);
        });

        it('POST ohne Admin -> 403 und keine DB-Aenderung', async () => {
            (jwt.verify as jest.Mock).mockReturnValue({ isAdmin: false });
            const res = await POST(postReq({ id: 1, action: 'deaktivieren' }, 't'));
            expect(res.status).toBe(403);
            expect(prisma.tblMitglieder.update).not.toHaveBeenCalled();
        });

        it('GET prueft Token mit JWT_SECRET und sortiert nach Nachname, Vorname', async () => {
            asAdmin();
            (prisma.tblMitglieder.findMany as jest.Mock).mockResolvedValue([]);
            const res = await GET(withToken(new NextRequest('http://localhost/api/verwaltung/benutzerzugriff'), 'tok'));
            expect(res.status).toBe(200);
            expect(await res.json()).toEqual([]);
            expect(jwt.verify).toHaveBeenCalledWith('tok', 'test-secret');
            expect(prisma.tblMitglieder.findMany).toHaveBeenCalledWith(expect.objectContaining({
                orderBy: [{ Nachname: 'asc' }, { Vorname: 'asc' }],
            }));
        });

        it('GET maskiert Passwoerter, leere bleiben leer', async () => {
            asAdmin();
            (prisma.tblMitglieder.findMany as jest.Mock).mockResolvedValue([
                { ID: 1, Vorname: 'A', Nachname: 'B', Login: 'a', Password: 'hash' },
                { ID: 2, Vorname: 'C', Nachname: 'D', Login: null, Password: null },
            ]);
            const data = await (await GET(withToken(new NextRequest('http://localhost/api/verwaltung/benutzerzugriff'), 't'))).json();
            expect(data[0].Password).toBe('********');
            expect(data[1].Password).toBe('');
            expect(JSON.stringify(data)).not.toContain('hash');
        });

        it('GET -> 500 bei DB-Fehler', async () => {
            asAdmin();
            (prisma.tblMitglieder.findMany as jest.Mock).mockRejectedValue(new Error('db'));
            const res = await GET(withToken(new NextRequest('http://localhost/api/verwaltung/benutzerzugriff'), 't'));
            expect(res.status).toBe(500);
            expect(await res.json()).toEqual({ error: 'Interner Serverfehler' });
        });

        it('POST ohne id -> 400', async () => {
            asAdmin();
            const res = await POST(postReq({ action: 'deaktivieren' }, 't'));
            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({ error: 'ID fehlt' });
        });

        it('POST speichern ohne login -> 400', async () => {
            asAdmin();
            const res = await POST(postReq({ id: 1, action: 'speichern', passwort: 'x' }, 't'));
            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({ error: 'Login fehlt' });
            expect(prisma.tblMitglieder.update).not.toHaveBeenCalled();
        });

        it('POST speichern ohne Passwort aktualisiert nur das Login', async () => {
            asAdmin();
            await POST(postReq({ id: 3, action: 'speichern', login: 'neu' }, 't'));
            expect(prisma.tblMitglieder.update).toHaveBeenCalledWith({ where: { ID: 3 }, data: { Login: 'neu' } });
        });

        it('POST speichern mit Platzhalter-Passwort laesst das Passwort unveraendert', async () => {
            asAdmin();
            await POST(postReq({ id: 3, action: 'speichern', login: 'neu', passwort: '********' }, 't'));
            expect(prisma.tblMitglieder.update).toHaveBeenCalledWith({ where: { ID: 3 }, data: { Login: 'neu' } });
        });

        it('POST speichern mit neuem Passwort speichert den SHA-256-Hash', async () => {
            asAdmin();
            await POST(postReq({ id: 3, action: 'speichern', login: 'neu', passwort: 'secret' }, 't'));
            const expected = crypto.createHash('sha256').update('secret').digest('hex');
            expect(prisma.tblMitglieder.update).toHaveBeenCalledWith({
                where: { ID: 3 }, data: { Login: 'neu', Password: expected },
            });
        });

        it('POST mit unbekannter Aktion -> 400', async () => {
            asAdmin();
            const res = await POST(postReq({ id: 1, action: 'loeschen' }, 't'));
            expect(res.status).toBe(400);
            expect(await res.json()).toEqual({ error: 'Ungültige Aktion' });
            expect(prisma.tblMitglieder.update).not.toHaveBeenCalled();
        });

        it('POST -> 500 bei DB-Fehler', async () => {
            asAdmin();
            (prisma.tblMitglieder.update as jest.Mock).mockRejectedValue(new Error('db'));
            const res = await POST(postReq({ id: 1, action: 'deaktivieren' }, 't'));
            expect(res.status).toBe(500);
        });

        it('POST -> 500 bei ungueltigem JSON', async () => {
            asAdmin();
            const req = withToken(new NextRequest('http://localhost/api/verwaltung/benutzerzugriff', {
                method: 'POST', body: '{kaputt',
            }), 't');
            const res = await POST(req);
            expect(res.status).toBe(500);
        });
    });
});
