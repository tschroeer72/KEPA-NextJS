/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest } from 'next/server';
import * as actions from '@/app/actions/verwaltung/statistik/actions';

jest.mock('@/app/actions/verwaltung/statistik/actions');
jest.mock('jspdf', () => {
    return jest.fn().mockImplementation(() => ({
        setFontSize: jest.fn(),
        text: jest.fn(),
        output: jest.fn().mockReturnValue(new ArrayBuffer(8)),
        addPage: jest.fn(),
        deletePage: jest.fn(),
        setProperties: jest.fn(),
        lastAutoTable: { finalY: 10 }
    }));
});
jest.mock('jspdf-autotable', () => jest.fn());

describe('POST /api/statistik/pdf', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('sollte ein Neuner-PDF generieren', async () => {
        (actions.getStatistik9er as jest.Mock).mockResolvedValue([{ Spieler: 'Max', Gesamt: 10 }]);

        const req = new NextRequest('http://localhost/api/statistik/pdf', {
            method: 'POST',
            body: JSON.stringify({ auswahl: 'neuner', zeit: 'gesamt' }),
        });

        const response = await POST(req);

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/pdf');
        expect(actions.getStatistik9er).toHaveBeenCalled();
    });

    it('sollte ein Ratten-PDF generieren', async () => {
        (actions.getStatistikRatten as jest.Mock).mockResolvedValue([{ Spieler: 'Max', Gesamt: 5 }]);

        const req = new NextRequest('http://localhost/api/statistik/pdf', {
            method: 'POST',
            body: JSON.stringify({ auswahl: 'ratten', zeit: 'laufende' }),
        });

        const response = await POST(req);

        expect(response.status).toBe(200);
        expect(actions.getStatistikRatten).toHaveBeenCalledWith(1, undefined, undefined);
    });

    it('sollte ein Pokal-PDF generieren', async () => {
        (actions.getStatistikPokal as jest.Mock).mockResolvedValue([]);

        const req = new NextRequest('http://localhost/api/statistik/pdf', {
            method: 'POST',
            body: JSON.stringify({ auswahl: 'pokal', zeit: 'gesamt' }),
        });

        const response = await POST(req);
        expect(response.status).toBe(200);
        expect(actions.getStatistikPokal).toHaveBeenCalled();
    });

    it('sollte 500 zurückgeben bei Fehlern', async () => {
        (actions.getStatistik9er as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const req = new NextRequest('http://localhost/api/statistik/pdf', {
            method: 'POST',
            body: JSON.stringify({ auswahl: 'neuner', zeit: 'gesamt' }),
        });

        const response = await POST(req);
        expect(response.status).toBe(500);
    });
});
