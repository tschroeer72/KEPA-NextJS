/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextResponse } from 'next/server';

// Mock cookie serialize
jest.mock('cookie', () => ({
    serialize: jest.fn().mockReturnValue('token=; Max-Age=-1; SameSite=Strict; Path=/; HttpOnly'),
}));

describe('POST /api/logout', () => {
    it('sollte erfolgreich abgemeldet werden und den Token-Cookie löschen', async () => {
        const response = await POST();
        const data = await response.json();

        expect(response).toBeInstanceOf(NextResponse);
        expect(response.status).toBe(200);
        expect(data).toBe('Erfolgreich abgemeldet');
        expect(response.headers.get('Set-Cookie')).toContain('Max-Age=-1');
    });
});
