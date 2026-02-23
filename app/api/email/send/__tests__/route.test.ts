/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('POST /api/email/send', () => {
    let mockSendMail: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
        (nodemailer.createTransport as jest.Mock).mockReturnValue({
            sendMail: mockSendMail,
        });
    });

    it('sollte eine E-Mail erfolgreich versenden', async () => {
        const payload = {
            recipients: ['test@example.com'],
            subject: 'Test Subject',
            message: 'Test Message',
        };

        const req = new Request('http://localhost/api/email/send', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockSendMail).toHaveBeenCalled();
    });

    it('sollte 400 zurückgeben, wenn keine Empfänger angegeben sind', async () => {
        const req = new Request('http://localhost/api/email/send', {
            method: 'POST',
            body: JSON.stringify({ recipients: [] }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Keine Empfänger angegeben');
    });

    it('sollte 500 zurückgeben, wenn nodemailer fehlschlägt', async () => {
        mockSendMail.mockRejectedValue(new Error('SMTP Error'));

        const req = new Request('http://localhost/api/email/send', {
            method: 'POST',
            body: JSON.stringify({ recipients: ['test@example.com'], subject: 'S', message: 'M' }),
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('SMTP Error');
    });
});
