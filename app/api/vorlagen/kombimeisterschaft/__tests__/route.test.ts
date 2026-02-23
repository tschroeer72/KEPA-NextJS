/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/utils/vpe-to-jspdf', () => ({
    VpeToJsPdf: jest.fn().mockImplementation(() => ({
        doc: { internal: { pageSize: { getWidth: jest.fn().mockReturnValue(210), getHeight: jest.fn().mockReturnValue(297) } } },
        cm: 10,
        setMargins: jest.fn(),
        selectFont: jest.fn(),
        setFontAttr: jest.fn(),
        write: jest.fn(),
        writeBox: jest.fn(),
        box: jest.fn(),
        line: jest.fn(),
        getOutput: jest.fn().mockReturnValue(new Uint8Array(8)),
        nLeftMargin: 0, nRightMargin: 0, nTopMargin: 0, nBottom: 0, nRight: 0, nLeft: 0, penStyle: 0
    })),
    TextAlignment: { Center: 'center', Left: 'left', Right: 'right' },
    PenStyle: { Solid: 'solid', Dash: 'dash' }
}));

describe('GET /api/vorlagen/kombimeisterschaft', () => {
    it('sollte ein Kombimeisterschaft PDF generieren', async () => {
        const req = new NextRequest('http://localhost/api/vorlagen/kombimeisterschaft');
        const response = await GET(req);
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });
});
