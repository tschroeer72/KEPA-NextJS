/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { getMitgliedById } from '@/app/actions/verwaltung/mitglieder/actions';
import { getStatistikSpielerById, getStatistikSpielerErgebnisse } from '@/app/actions/verwaltung/statistik/actions';

jest.mock('@/app/actions/verwaltung/mitglieder/actions');
jest.mock('@/app/actions/verwaltung/statistik/actions');

const mGet = getMitgliedById as jest.Mock;
const mStat = getStatistikSpielerById as jest.Mock;
const mErg = getStatistikSpielerErgebnisse as jest.Mock;

const post = (body: any) =>
    POST(new NextRequest('http://localhost/api/mitglieder/statistik-pdf', { method: 'POST', body: JSON.stringify(body) }));

const ergebnis = (over: any = {}) => ({
    Spieltag: new Date('2024-01-10T00:00:00Z'),
    Meisterschaft: 'Winter',
    Gegenspieler: 'Anna',
    Ergebnis: 2,
    Holz: 45,
    SechsTageRennen_Runden: 3,
    SechsTageRennen_Punkte: 4,
    SechsTageRennen_Platz: 1,
    Sarg: 2,
    Pokal: 1,
    Neuner: 1,
    Ratten: 0,
    ...over,
});

const statistik = {
    HolzSumme: 500, HolzMax: 60, HolzMin: 20, HolzAVG: 41.666,
    RattenSumme: 2, RattenMax: 1, NeunerSumme: 3, NeunerMax: 2, Kranz8Summe: 1, Kranz8Max: 1,
};

async function pdf(res: Response) {
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    return buf;
}

describe('POST /api/mitglieder/statistik-pdf', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {}); // jspdf-autotable meldet Breitenwarnungen
        mGet.mockResolvedValue({ success: true, data: { ID: 1, Vorname: 'Max', Nachname: 'Mustermann' } });
        mStat.mockResolvedValue({ success: true, data: statistik });
        mErg.mockResolvedValue([ergebnis(), ergebnis({ Spieltag: null, Meisterschaft: null, Gegenspieler: null,
            Ergebnis: undefined, Holz: undefined, SechsTageRennen_Runden: undefined, SechsTageRennen_Punkte: undefined,
            SechsTageRennen_Platz: undefined, Sarg: undefined, Pokal: undefined, Neuner: undefined, Ratten: undefined })]);
    });
    afterEach(() => jest.restoreAllMocks());

    it('400 wenn mitgliedId fehlt', async () => {
        const res = await post({ showErgebnisse: true });
        expect(res.status).toBe(400);
        expect(await res.json()).toEqual({ error: 'MitgliedID fehlt' });
        expect(mGet).not.toHaveBeenCalled();
    });

    it('404 wenn Mitglied nicht gefunden (success false)', async () => {
        mGet.mockResolvedValue({ success: false });
        const res = await post({ mitgliedId: 1, showErgebnisse: true });
        expect(res.status).toBe(404);
        expect(await res.json()).toEqual({ error: 'Mitglied nicht gefunden' });
    });

    it('404 wenn Mitglied ohne Daten', async () => {
        mGet.mockResolvedValue({ success: true, data: null });
        expect((await post({ mitgliedId: 1 })).status).toBe(404);
    });

    it('ruft Actions mit numerischer ID auf', async () => {
        await post({ mitgliedId: '12', showErgebnisse: true });
        expect(mGet).toHaveBeenCalledWith(12);
        expect(mStat).toHaveBeenCalledWith(12);
        expect(mErg).toHaveBeenCalledWith(12);
    });

    it('PDF nur mit Ergebnissen, Dateiname enthaelt Namen', async () => {
        const res = await post({ mitgliedId: 1, showErgebnisse: true, showStatistik: false });
        await pdf(res);
        expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="Statistik_Mustermann_Max.pdf"');
    });

    it('PDF nur mit Statistik', async () => {
        await pdf(await post({ mitgliedId: 1, showStatistik: true }));
    });

    it('PDF mit beidem hat mehr Seiten/Inhalt als nur Ergebnisse', async () => {
        const nurErg = await pdf(await post({ mitgliedId: 1, showErgebnisse: true }));
        const beides = await pdf(await post({ mitgliedId: 1, showErgebnisse: true, showStatistik: true }));
        expect(beides.length).toBeGreaterThan(nurErg.length);
    });

    it('Statistik mit fehlenden Werten (0-Fallbacks)', async () => {
        mStat.mockResolvedValue({ success: true, data: {} });
        await pdf(await post({ mitgliedId: 1, showStatistik: true }));
    });

    it('Statistik ohne Daten erzeugt trotzdem PDF', async () => {
        mStat.mockResolvedValue({ success: true, data: null });
        await pdf(await post({ mitgliedId: 1, showStatistik: true }));
    });

    it('leere Ergebnisliste', async () => {
        mErg.mockResolvedValue([]);
        await pdf(await post({ mitgliedId: 1, showErgebnisse: true }));
    });

    it('ohne show-Flags wird ein leeres PDF geliefert', async () => {
        await pdf(await post({ mitgliedId: 1 }));
    });

    it('500 bei Fehler in einer Action', async () => {
        mErg.mockRejectedValue(new Error('DB kaputt'));
        const res = await post({ mitgliedId: 1, showErgebnisse: true });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: 'DB kaputt' });
    });

    it('500 mit Standardmeldung ohne Fehlernachricht', async () => {
        mGet.mockRejectedValue({});
        const res = await post({ mitgliedId: 1 });
        expect(res.status).toBe(500);
        expect(await res.json()).toEqual({ error: 'Interner Serverfehler' });
    });
});
