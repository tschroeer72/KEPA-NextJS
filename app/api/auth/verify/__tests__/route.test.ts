/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');

describe('GET /api/auth/verify', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    it('sollte 401 zurückgeben, wenn kein Token vorhanden ist', async () => {
        const req = new NextRequest('http://localhost/api/auth/verify');
        // @ts-ignore - Mocking cookies.get
        jest.spyOn(req.cookies, 'get').mockReturnValue(undefined);

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Kein Token vorhanden');
    });

    it('sollte 200 und Benutzerdaten zurückgeben, wenn der Token gültig ist', async () => {
        const mockPayload = { userId: 1, login: 'testuser', vorname: 'Max', nachname: 'Mustermann', isAdmin: true };
        (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

        const req = new NextRequest('http://localhost/api/auth/verify');
        // @ts-ignore
        jest.spyOn(req.cookies, 'get').mockReturnValue({ value: 'valid-token' });

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.username).toBe('testuser');
        expect(data.isAdmin).toBe(true);
        expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
    });

    it('sollte 401 zurückgeben, wenn der Token ungültig ist', async () => {
        (jwt.verify as jest.Mock).mockImplementation(() => {
            throw new Error('Invalid token');
        });

        const req = new NextRequest('http://localhost/api/auth/verify');
        // @ts-ignore
        jest.spyOn(req.cookies, 'get').mockReturnValue({ value: 'invalid-token' });

        const response = await GET(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Token ungültig');
    });
});
