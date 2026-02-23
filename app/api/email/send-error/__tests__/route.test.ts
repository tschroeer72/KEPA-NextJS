/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('POST /api/email/send-error', () => {
    let mockSendMail: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
        (nodemailer.createTransport as jest.Mock).mockReturnValue({
            sendMail: mockSendMail,
        });
    });

    it('sollte eine Fehler-E-Mail erfolgreich versenden', async () => {
        const payload = {
            to: ['admin@example.com'],
            subject: 'System Error',
            message: 'Stacktrace...',
            type: 'Fehler'
        };

        const req = new Request('http://localhost/api/email/send-error', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
            subject: 'KEPAVerwaltung (FEHLER) System Error'
        }));
    });

    it('sollte 400 zurückgeben, wenn keine Hauptempfänger angegeben sind', async () => {
        const req = new Request('http://localhost/api/email/send-error', {
            method: 'POST',
            body: JSON.stringify({ to: [] }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Keine Hauptempfänger angegeben');
    });
});
