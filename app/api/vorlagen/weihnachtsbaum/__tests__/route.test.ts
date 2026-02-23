/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/utils/vpe-to-jspdf', () => ({
    VpeToJsPdf: jest.fn().mockImplementation(() => ({
        doc: { 
            internal: { pageSize: { getWidth: jest.fn().mockReturnValue(210), getHeight: jest.fn().mockReturnValue(297) } },
            ellipse: jest.fn()
        },
        cm: 10,
        setMargins: jest.fn(),
        selectFont: jest.fn(),
        setFontAttr: jest.fn(),
        write: jest.fn(),
        writeBox: jest.fn(),
        box: jest.fn(),
        line: jest.fn(),
        image: jest.fn(),
        getOutput: jest.fn().mockReturnValue(new Uint8Array(8)),
        nLeftMargin: 0, nRightMargin: 0, nTopMargin: 0, nBottom: 0, nRight: 0, nLeft: 0, penStyle: 0
    })),
    TextAlignment: { Center: 'center', Left: 'left', Right: 'right' },
    PenStyle: { Solid: 'solid', Dash: 'dash' }
}));

jest.mock('fs', () => ({
    readFileSync: jest.fn().mockReturnValue(Buffer.from('fake-image'))
}));

jest.mock('path', () => ({
    join: jest.fn().mockReturnValue('fake-path')
}));

describe('GET /api/vorlagen/weihnachtsbaum', () => {
    it('sollte ein Weihnachtsbaum PDF generieren', async () => {
        const req = new NextRequest('http://localhost/api/vorlagen/weihnachtsbaum');
        const response = await GET(req);
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });
});
