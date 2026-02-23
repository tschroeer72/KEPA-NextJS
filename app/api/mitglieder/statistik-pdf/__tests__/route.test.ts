/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest, NextResponse } from 'next/server';
import { getMitgliedById } from '@/app/actions/verwaltung/mitglieder/actions';
import { getStatistikSpielerById, getStatistikSpielerErgebnisse } from '@/app/actions/verwaltung/statistik/actions';

jest.mock('@/app/actions/verwaltung/mitglieder/actions');
jest.mock('@/app/actions/verwaltung/statistik/actions');
jest.mock('jspdf', () => {
    return jest.fn().mockImplementation(() => ({
        setFontSize: jest.fn(),
        text: jest.fn(),
        output: jest.fn().mockReturnValue(new ArrayBuffer(8)),
        addPage: jest.fn(),
        lastAutoTable: { finalY: 10 }
    }));
});
jest.mock('jspdf-autotable', () => jest.fn());

describe('POST /api/mitglieder/statistik-pdf', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sollte ein PDF generieren', async () => {
        (getMitgliedById as jest.Mock).mockResolvedValue({
            success: true,
            data: { ID: 1, Vorname: 'Max', Nachname: 'Mustermann' }
        });
        (getStatistikSpielerById as jest.Mock).mockResolvedValue({ success: true, data: {} });
        (getStatistikSpielerErgebnisse as jest.Mock).mockResolvedValue([]);

        const req = new NextRequest('http://localhost/api/mitglieder/statistik-pdf', {
            method: 'POST',
            body: JSON.stringify({ mitgliedId: 1, showErgebnisse: true, showStatistik: true }),
        });

        const response = await POST(req);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/pdf');
        const buffer = await response.arrayBuffer();
        expect(buffer.byteLength).toBeGreaterThan(0);
    });

    it('sollte 400 zurückgeben, wenn mitgliedId fehlt', async () => {
        const req = new NextRequest('http://localhost/api/mitglieder/statistik-pdf', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('MitgliedID fehlt');
    });

    it('sollte 404 zurückgeben, wenn Mitglied nicht gefunden wurde', async () => {
        (getMitgliedById as jest.Mock).mockResolvedValue({ success: false });

        const req = new NextRequest('http://localhost/api/mitglieder/statistik-pdf', {
            method: 'POST',
            body: JSON.stringify({ mitgliedId: 999 }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.error).toBe('Mitglied nicht gefunden');
    });
});
