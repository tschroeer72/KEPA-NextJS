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
});
