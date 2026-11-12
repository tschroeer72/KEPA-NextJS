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

    it('variant=2 liefert nur das Bild-PDF ohne Beschriftung', async () => {
        const { VpeToJsPdf } = jest.requireMock('@/utils/vpe-to-jspdf');
        VpeToJsPdf.mockClear();
        const res = await GET(new NextRequest('http://localhost/api/vorlagen/weihnachtsbaum?variant=2'));
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Disposition')).toBe('attachment; filename=Weihnachtsbaum.pdf');
        const vpe = VpeToJsPdf.mock.results[0].value;
        expect(vpe.image).toHaveBeenCalledTimes(1);
        expect(vpe.write).not.toHaveBeenCalled();
        const path = jest.requireMock('path');
        expect(path.join).toHaveBeenLastCalledWith(expect.any(String), 'public', 'vorlagen', 'Weihnachtsbaumkegeln2.jpg');
    });

    it('Standard-Variante nutzt das erste Bild und beschriftet es', async () => {
        const { VpeToJsPdf } = jest.requireMock('@/utils/vpe-to-jspdf');
        VpeToJsPdf.mockClear();
        await GET(new NextRequest('http://localhost/api/vorlagen/weihnachtsbaum'));
        const vpe = VpeToJsPdf.mock.results[0].value;
        expect(vpe.write).toHaveBeenCalledWith(9, 2, 4, 1.5, 'Name:');
        const path = jest.requireMock('path');
        expect(path.join).toHaveBeenLastCalledWith(expect.any(String), 'public', 'vorlagen', 'Weihnachtsbaumkegeln.jpg');
    });

    it('liefert 500 wenn das Bild nicht gelesen werden kann', async () => {
        const fs = jest.requireMock('fs');
        fs.readFileSync.mockImplementationOnce(() => { throw new Error('ENOENT'); });
        const res = await GET(new NextRequest('http://localhost/api/vorlagen/weihnachtsbaum'));
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: 'Fehler bei PDF Erstellung' });
    });
});
