/**
 * @jest-environment node
 */
import { GET } from '../route';
import { NextRequest } from 'next/server';
import { getAktiveMitglieder, getAlleMitglieder } from '@/app/actions/verwaltung/mitglieder/actions';

const vpe: any = {};

jest.mock('@/utils/vpe-to-jspdf', () => ({
    VpeToJsPdf: jest.fn().mockImplementation(() => vpe),
    TextAlignment: { Center: 'center', Left: 'left', Right: 'right' },
    PenStyle: { Solid: 'solid', Dash: 'dash' },
}));

jest.mock('@/app/actions/verwaltung/mitglieder/actions', () => ({
    getAktiveMitglieder: jest.fn(),
    getAlleMitglieder: jest.fn(),
}));

const mAktive = getAktiveMitglieder as jest.Mock;
const mAlle = getAlleMitglieder as jest.Mock;

const resetVpe = () => {
    Object.keys(vpe).forEach(k => delete vpe[k]);
    Object.assign(vpe, {
        doc: { getTextWidth: jest.fn().mockReturnValue(10) },
        cm: 10,
        setMargins: jest.fn(),
        selectFont: jest.fn(),
        setFontAttr: jest.fn(),
        write: jest.fn(),
        writeBox: jest.fn(),
        box: jest.fn(),
        storePos: jest.fn(),
        restorePos: jest.fn(),
        pageBreak: jest.fn(),
        getOutput: jest.fn().mockReturnValue(new Uint8Array([37, 80, 68, 70])),
        nLeftMargin: 2, nTopMargin: 2, nBottomMargin: 27, nBottom: 3, nRight: 5, nTop: 3, nLeft: 2,
    });
};

const mitglied = (over: any = {}) => ({
    Nachname: 'Muster', Vorname: 'Max', Geburtsdatum: new Date('1980-05-17T00:00:00Z'),
    Strasse: 'Weg 1', PLZ: '12345', Ort: 'Stadt', EMail: 'max@x.de',
    TelefonPrivat: '123', TelefonMobil: '456',
    MitgliedSeit: new Date('2000-01-01T00:00:00Z'), AusgeschiedenAm: new Date('2020-02-02T00:00:00Z'),
    ...over,
});

const get = (qs = '') => GET(new NextRequest(`http://localhost/api/vorlagen/mitgliederliste${qs}`));
const texts = () => vpe.writeBox.mock.calls.map((c: any[]) => c[4]);

describe('GET /api/vorlagen/mitgliederliste', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        resetVpe();
        mAktive.mockResolvedValue({ success: true, data: [mitglied()] });
        mAlle.mockResolvedValue({ success: true, data: [mitglied()] });
    });

    it('liefert ein PDF mit Headern und Dateiname', async () => {
        const res = await get();
        expect(res.status).toBe(200);
        expect(res.headers.get('Content-Type')).toBe('application/pdf');
        expect(res.headers.get('Content-Disposition')).toContain('Mitgliederliste.pdf');
        expect(vpe.setMargins).toHaveBeenCalledWith(2, 2, 2, 2);
    });

    it('verwendet standardmaessig aktive Mitglieder und passenden Titel', async () => {
        await get();
        expect(mAktive).toHaveBeenCalledTimes(1);
        expect(mAlle).not.toHaveBeenCalled();
        expect(texts()).toContain('Mitgliederliste (aktive Kegler)');
    });

    it('aktiv=false laedt alle Mitglieder mit anderem Titel', async () => {
        await get('?aktiv=false');
        expect(mAlle).toHaveBeenCalledTimes(1);
        expect(mAktive).not.toHaveBeenCalled();
        expect(texts()).toContain('Mitgliederliste');
        expect(texts()).not.toContain('Mitgliederliste (aktive Kegler)');
    });

    it('aktiv=true verhaelt sich wie Standard', async () => {
        await get('?aktiv=true');
        expect(mAktive).toHaveBeenCalled();
    });

    it('schreibt Daten der Mitglieder in das PDF', async () => {
        await get();
        const t = texts();
        expect(t).toEqual(expect.arrayContaining(['Muster', 'Max']));
        const written = vpe.write.mock.calls.map((c: any[]) => c[4]);
        expect(written).toEqual(expect.arrayContaining(['Weg 1', '12345 Stadt', 'max@x.de', '123', '456']));
    });

    it('formatiert Datumsfelder (Geburtstag, Eintritt, Austritt)', async () => {
        await get();
        const all = [...texts(), ...vpe.write.mock.calls.map((c: any[]) => c[4])];
        const fmt = (y: number, m: number, d: number) => new Date(y, m - 1, d).toLocaleDateString('de-DE');
        expect(all).toEqual(expect.arrayContaining([fmt(1980, 5, 17), fmt(2000, 1, 1), fmt(2020, 2, 2)]));
    });

    it('leere Felder werden als leerer String geschrieben', async () => {
        mAktive.mockResolvedValue({ success: true, data: [mitglied({
            Nachname: null, Vorname: null, Geburtsdatum: null, Strasse: null, PLZ: null, Ort: null,
            EMail: null, TelefonPrivat: null, TelefonMobil: null, MitgliedSeit: null, AusgeschiedenAm: null,
        })] });
        const res = await get();
        expect(res.status).toBe(200);
        const written = vpe.write.mock.calls.map((c: any[]) => c[4]);
        expect(written).toContain(' '); // PLZ/Ort leer -> nur Leerzeichen
    });

    it('lange E-Mail wird am @ auf zwei Zeilen umgebrochen', async () => {
        vpe.doc.getTextWidth.mockReturnValue(50); // 5 cm > 3
        mAktive.mockResolvedValue({ success: true, data: [mitglied({ EMail: 'sehr.lange.adresse@domain.de' })] });
        await get();
        const written = vpe.write.mock.calls.map((c: any[]) => c[4]);
        expect(written).toEqual(expect.arrayContaining(['sehr.lange.adresse@', 'domain.de']));
        expect(vpe.storePos).toHaveBeenCalled();
        expect(vpe.restorePos).toHaveBeenCalled();
    });

    it('lange E-Mail ohne @ wird nicht umgebrochen', async () => {
        vpe.doc.getTextWidth.mockReturnValue(50);
        mAktive.mockResolvedValue({ success: true, data: [mitglied({ EMail: 'keinat' })] });
        await get();
        expect(vpe.storePos).not.toHaveBeenCalled();
        expect(vpe.write.mock.calls.map((c: any[]) => c[4])).toContain('keinat');
    });

    it('kurze E-Mail wird in einer Zeile geschrieben', async () => {
        await get();
        expect(vpe.storePos).not.toHaveBeenCalled();
    });

    it('Seitenumbruch wenn der Platz nicht reicht', async () => {
        vpe.nBottom = 26; // nBottomMargin - nBottom = 1 < 2
        await get();
        expect(vpe.pageBreak).toHaveBeenCalledTimes(1);
        // Header wird neu gezeichnet: "KEPA 1958" zweimal
        expect(texts().filter((x: string) => x === 'KEPA 1958')).toHaveLength(2);
    });

    it('kein Seitenumbruch bei genug Platz', async () => {
        await get();
        expect(vpe.pageBreak).not.toHaveBeenCalled();
    });

    it('leere Liste liefert trotzdem ein PDF (nur Header)', async () => {
        mAktive.mockResolvedValue({ success: true, data: [] });
        const res = await get();
        expect(res.status).toBe(200);
        expect(texts().filter((x: string) => x === 'KEPA 1958')).toHaveLength(1);
    });

    it('500 wenn das Laden fehlschlaegt (success false)', async () => {
        mAktive.mockResolvedValue({ success: false });
        const res = await get();
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: 'Fehler beim Laden der Mitglieder' });
    });

    it('500 wenn data fehlt', async () => {
        mAlle.mockResolvedValue({ success: true, data: undefined });
        const res = await get('?aktiv=false');
        expect(res.status).toBe(500);
    });
});
