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
            findFirst: jest.fn(),
        },
    },
}));

jest.mock('jsonwebtoken');

describe('POST /api/login', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { 
            ...originalEnv, 
            JWT_SECRET: 'test-secret',
            ADMIN_USERNAME: 'admin',
            ADMIN_PASSWORD: crypto.createHash('sha256').update('admin123').digest('hex')
        };
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('sollte sich als Admin erfolgreich anmelden', async () => {
        const req = new NextRequest('http://localhost/api/login', {
            method: 'POST',
            body: JSON.stringify({ benutzer: 'admin', passwort: 'admin123' }),
        });

        (jwt.sign as jest.Mock).mockReturnValue('mock-admin-token');

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.username).toBe('admin');
        expect(data.isAdmin).toBe(true);
        expect(response.headers.get('Set-Cookie')).toContain('mock-admin-token');
    });

    it('sollte sich als regulärer Benutzer erfolgreich anmelden', async () => {
        const mockUser = {
            ID: 1,
            Login: 'user1',
            Vorname: 'Max',
            Nachname: 'Mustermann',
            Password: crypto.createHash('sha256').update('password123').digest('hex')
        };

        (prisma.tblMitglieder.findFirst as jest.Mock).mockResolvedValue(mockUser);
        (jwt.sign as jest.Mock).mockReturnValue('mock-user-token');

        const req = new NextRequest('http://localhost/api/login', {
            method: 'POST',
            body: JSON.stringify({ benutzer: 'user1', passwort: 'password123' }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.username).toBe('user1');
        expect(data.isAdmin).toBe(false);
        expect(response.headers.get('Set-Cookie')).toContain('mock-user-token');
    });

    it('sollte 401 zurückgeben bei falschen Anmeldedaten', async () => {
        (prisma.tblMitglieder.findFirst as jest.Mock).mockResolvedValue(null);

        const req = new NextRequest('http://localhost/api/login', {
            method: 'POST',
            body: JSON.stringify({ benutzer: 'wrong', passwort: 'wrong' }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toBe('Login fehlgeschlagen');
    });

    describe('erweiterte Faelle', () => {
        const sha = (v: string) => crypto.createHash('sha256').update(v).digest('hex');
        const post = (body: any) => POST(new NextRequest('http://localhost/api/login', {
            method: 'POST',
            body: JSON.stringify(body),
        }));

        beforeEach(() => {
            process.env.FILME_USERNAME = 'filme';
            process.env.FILME_PASSWORD = sha('filmpw');
            (jwt.sign as jest.Mock).mockReturnValue('signed-token');
            (prisma.tblMitglieder.findFirst as jest.Mock).mockResolvedValue(null);
        });

        it('FILME-Benutzer: Antwort, JWT-Payload und Cookie', async () => {
            const res = await post({ benutzer: 'filme', passwort: 'filmpw' });
            const data = await res.json();

            expect(res.status).toBe(200);
            expect(data).toEqual({
                message: 'Erfolgreich', userId: -1, username: 'filme',
                vorname: 'Kegelfahrten', nachname: 'Benutzer', isAdmin: false, isFilmeUser: true,
            });
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: -1, login: 'filme', isAdmin: false, isFilmeUser: true, vorname: 'Kegelfahrten', nachname: 'Benutzer' },
                'test-secret',
                { expiresIn: '1h' },
            );
            expect(prisma.tblMitglieder.findFirst).not.toHaveBeenCalled();
        });

        it('FILME-Benutzer hat Vorrang vor Admin bei gleichem Login', async () => {
            process.env.ADMIN_USERNAME = 'filme';
            process.env.ADMIN_PASSWORD = sha('filmpw');
            const data = await (await post({ benutzer: 'filme', passwort: 'filmpw' })).json();
            expect(data.isFilmeUser).toBe(true);
            expect(data.isAdmin).toBe(false);
        });

        it('Admin: JWT-Payload enthaelt isAdmin und userId 0', async () => {
            const res = await post({ benutzer: 'admin', passwort: 'admin123' });
            const data = await res.json();
            expect(data).toEqual({
                message: 'Erfolgreich', userId: 0, username: 'admin',
                vorname: 'Admin', nachname: 'User', isAdmin: true,
            });
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 0, login: 'admin', isAdmin: true, vorname: 'Admin', nachname: 'User' },
                'test-secret',
                { expiresIn: '1h' },
            );
            expect(prisma.tblMitglieder.findFirst).not.toHaveBeenCalled();
        });

        it('Cookie: httpOnly, SameSite=Strict, Path=/, Max-Age 3600', async () => {
            const res = await post({ benutzer: 'admin', passwort: 'admin123' });
            const cookie = res.headers.get('Set-Cookie')!;
            expect(cookie).toContain('token=signed-token');
            expect(cookie).toContain('HttpOnly');
            expect(cookie).toContain('SameSite=Strict');
            expect(cookie).toContain('Path=/');
            expect(cookie).toContain('Max-Age=3600');
            expect(cookie).not.toContain('Secure');
        });

        it('trimmt den Benutzernamen (Admin)', async () => {
            const res = await post({ benutzer: '  admin  ', passwort: 'admin123' });
            expect(res.status).toBe(200);
            expect((await res.json()).username).toBe('admin');
        });

        it('trimmt Umgebungsvariablen beim Vergleich', async () => {
            process.env.ADMIN_USERNAME = ' admin ';
            process.env.ADMIN_PASSWORD = ` ${sha('admin123')} `;
            const res = await post({ benutzer: 'admin', passwort: 'admin123' });
            expect(res.status).toBe(200);
            expect((await res.json()).isAdmin).toBe(true);
        });

        it('Admin-Name mit falschem Passwort faellt auf DB-Pruefung zurueck und liefert 401', async () => {
            const res = await post({ benutzer: 'admin', passwort: 'falsch' });
            expect(res.status).toBe(401);
            expect(prisma.tblMitglieder.findFirst).toHaveBeenCalledWith({
                where: { Login: 'admin', Password: sha('falsch') },
            });
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(res.headers.get('Set-Cookie')).toBeNull();
        });

        it('DB-Mitglied: Passwort wird als SHA-256 gesucht, Payload ohne isAdmin', async () => {
            (prisma.tblMitglieder.findFirst as jest.Mock).mockResolvedValue({
                ID: 7, Login: 'hans', Vorname: 'Hans', Nachname: 'Meier',
            });
            const res = await post({ benutzer: ' hans ', passwort: 'geheim' });
            const data = await res.json();

            expect(prisma.tblMitglieder.findFirst).toHaveBeenCalledWith({
                where: { Login: 'hans', Password: sha('geheim') },
            });
            expect(data).toEqual({
                message: 'Erfolgreich', userId: 7, username: 'hans',
                vorname: 'Hans', nachname: 'Meier', isAdmin: false,
            });
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 7, login: 'hans', vorname: 'Hans', nachname: 'Meier' },
                'test-secret',
                { expiresIn: '1h' },
            );
        });

        it('DB-Mitglied ohne Login-Wert: username faellt auf eingegebenen Namen zurueck', async () => {
            (prisma.tblMitglieder.findFirst as jest.Mock).mockResolvedValue({
                ID: 8, Login: null, Vorname: 'A', Nachname: 'B',
            });
            const data = await (await post({ benutzer: 'x', passwort: 'y' })).json();
            expect(data.username).toBe('x');
        });

        it('deaktiviertes Mitglied (Login/Passwort NULL) kann sich nicht anmelden', async () => {
            // findFirst findet wegen Login/Password = NULL keinen Treffer
            const res = await post({ benutzer: 'deaktiviert', passwort: 'irgendwas' });
            expect(res.status).toBe(401);
            expect(await res.json()).toBe('Login fehlgeschlagen');
        });

        it('falsches Passwort fuer FILME-Benutzer -> 401', async () => {
            const res = await post({ benutzer: 'filme', passwort: 'falsch' });
            expect(res.status).toBe(401);
        });

        it("fehlendes Passwort -> 400, kein Token, keine DB-Suche", async () => {
            const res = await post({ benutzer: "admin" });
            expect(res.status).toBe(400);
            expect(jwt.sign).not.toHaveBeenCalled();
            expect(prisma.tblMitglieder.findFirst).not.toHaveBeenCalled();
        });

        it("fehlender Benutzer -> 400, keine DB-Suche ohne Login-Filter", async () => {
            const res = await post({ passwort: "irgendwas" });
            expect(res.status).toBe(400);
            expect(prisma.tblMitglieder.findFirst).not.toHaveBeenCalled();
        });

        it.each([
            ["leere Strings", { benutzer: "", passwort: "" }],
            ["nur Leerzeichen als Benutzer", { benutzer: "   ", passwort: "x" }],
            ["leeres Passwort", { benutzer: "a", passwort: "" }],
            ["Zahlen statt Strings", { benutzer: 1, passwort: 2 }],
            ["Objekt als Benutzer (Prisma-Operator-Injection)", { benutzer: { not: "" }, passwort: "x" }],
        ])("%s -> 400", async (_n, body) => {
            const res = await post(body as any);
            expect(res.status).toBe(400);
            expect(prisma.tblMitglieder.findFirst).not.toHaveBeenCalled();
        });

        it("ungueltiger JSON-Body -> 400", async () => {
            const req = new NextRequest("http://localhost/api/login", { method: "POST", body: "{kaputt" });
            const res = await POST(req);
            expect(res.status).toBe(400);
        });

        it('ohne konfigurierte FILME-/ADMIN-Variablen ist ein Login mit undefined-Namen nicht moeglich', async () => {
            delete process.env.FILME_USERNAME; delete process.env.FILME_PASSWORD;
            delete process.env.ADMIN_USERNAME; delete process.env.ADMIN_PASSWORD;
            const res = await post({ benutzer: "u", passwort: "x" });
            expect(res.status).toBe(401);
            expect(jwt.sign).not.toHaveBeenCalled();
        });

    });
});
