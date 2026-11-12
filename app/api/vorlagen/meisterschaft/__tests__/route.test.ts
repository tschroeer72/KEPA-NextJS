/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { VpeToJsPdf } from '@/utils/vpe-to-jspdf';

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

describe('GET /api/vorlagen/meisterschaft', () => {
    it('sollte ein Meisterschaft PDF generieren', async () => {
        const req = new NextRequest('http://localhost/api/vorlagen/meisterschaft');
        const response = await GET(req);
        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/pdf');
    });

    const calls = (anzahl?: number) => {
        (VpeToJsPdf as unknown as jest.Mock).mockClear();
        const qs = anzahl === undefined ? '' : `?anzahl=${anzahl}`;
        return GET(new NextRequest(`http://localhost/api/vorlagen/meisterschaft${qs}`)).then(res => ({
            res,
            vpe: (VpeToJsPdf as unknown as jest.Mock).mock.results[0].value,
        }));
    };

    it('verwendet den richtigen Titel', async () => {
        const { vpe } = await calls();
        const titles = vpe.write.mock.calls.map((c: any[]) => c[4]);
        expect(titles).toContain('Meisterschaft');
    });

    it('mehr Spielerspalten bei groesserem anzahl-Parameter', async () => {
        const small = await calls(2);
        const big = await calls(6);
        expect(small.res.status).toBe(200);
        expect(big.res.status).toBe(200);
        const count = (v: any) => v.write.mock.calls.length + v.writeBox.mock.calls.length + v.box.mock.calls.length + v.line.mock.calls.length;
        expect(count(big.vpe)).toBeGreaterThan(count(small.vpe));
    });

    it('Standardwert 3 wenn anzahl fehlt', async () => {
        const def = await calls();
        const three = await calls(3);
        const count = (v: any) => v.write.mock.calls.length + v.writeBox.mock.calls.length + v.box.mock.calls.length + v.line.mock.calls.length;
        expect(count(def.vpe)).toBe(count(three.vpe));
    });
});
