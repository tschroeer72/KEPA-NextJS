/**
 * @jest-environment node
 */
import { POST } from '../route';
import { NextRequest } from 'next/server';
import * as actions from '@/app/actions/verwaltung/statistik/actions';
import { prisma } from '@/lib/prisma';

jest.mock('@/app/actions/verwaltung/statistik/actions');
jest.mock('@/lib/prisma', () => ({
    prisma: { tblMeisterschaften: { findUnique: jest.fn() } },
}));

const a = actions as jest.Mocked<typeof actions>;
const findMs = prisma.tblMeisterschaften.findUnique as jest.Mock;

const post = (body: any) =>
    POST(new NextRequest('http://localhost/api/statistik/pdf', { method: 'POST', body: JSON.stringify(body) }));

async function expectPdf(res: Response, filename: string) {
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toBe(`attachment; filename="${filename}"`);
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    return buf;
}

const platz = (n: number) => Array.from({ length: n }, (_, i) => ({
    Spieler: `Spieler ${i}`, Gesamt: 100 - i, AnzTeilnahmen: 5,
    Zehn: 1, Neun: 0, Acht: 2, Sieben: 0, Sechs: 0, Fünf: 1, Vier: 0, Drei: 0, Zwei: 0, Eins: 3,
}));

describe('POST /api/statistik/pdf', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => jest.restoreAllMocks());

    describe('Auswahl', () => {
        it('neuner', async () => {
            a.getStatistik9er.mockResolvedValue(platz(3) as any);
            await expectPdf(await post({ auswahl: 'neuner', zeit: 'gesamt' }), 'Druck_Statistik_Neuner.pdf');
            expect(a.getStatistik9er).toHaveBeenCalledWith(4, undefined, undefined);
        });

        it('ratten', async () => {
            a.getStatistikRatten.mockResolvedValue(platz(2) as any);
            await expectPdf(await post({ auswahl: 'ratten', zeit: 'gesamt' }), 'Druck_Statistik_Ratten.pdf');
        });

        it('pokal', async () => {
            a.getStatistikPokal.mockResolvedValue(platz(2) as any);
            await expectPdf(await post({ auswahl: 'pokal', zeit: 'gesamt' }), 'Druck_Statistik_Pokal.pdf');
        });

        it('sarg', async () => {
            a.getStatistikSarg.mockResolvedValue(platz(2) as any);
            await expectPdf(await post({ auswahl: 'sarg', zeit: 'gesamt' }), 'Druck_Statistik_Sarg.pdf');
        });

        it('ergebnisse-spieler (ueberspringt Spieler ohne Daten, sortiert nach Name)', async () => {
            const g = { Gewonnen: 1, Unentschieden: 2, Verloren: 3 };
            const komb = { dict3bis8: { Anna: g }, dict5Kugeln: { Anna: g }, dictGesamt: { Anna: g } };
            a.getStatistikSpielerSpieler.mockResolvedValue([
                { Spielername: 'Zora', dictMeisterschaft: { Anna: g }, dictBlitztunier: {}, dictKombimeisterschaft: { Anna: komb } },
                { Spielername: 'Leer', dictMeisterschaft: {}, dictBlitztunier: {}, dictKombimeisterschaft: {} },
                { Spielername: 'Berta', dictMeisterschaft: {}, dictBlitztunier: { Zora: g }, dictKombimeisterschaft: { Zora: komb } },
            ] as any);
            await expectPdf(await post({ auswahl: 'ergebnisse-spieler', zeit: 'gesamt' }), 'Statistik_Spieler_Spieler.pdf');
        });

        it('platzierung-6tage', async () => {
            a.getStatistik6TageRennenPlatz.mockResolvedValue(platz(2) as any);
            await expectPdf(await post({ auswahl: 'platzierung-6tage', zeit: 'gesamt' }), 'Druck_Statistik_6TageRennen_Platzierung.pdf');
        });

        it('beste-mannschaft-6tage', async () => {
            a.getStatistik6TageRennenBesteMannschaft.mockResolvedValue(
                [{ Mannschaft: 'A / B', Anzahl: 2, Eins: 1, Zwei: 1 }] as any);
            await expectPdf(await post({ auswahl: 'beste-mannschaft-6tage', zeit: 'gesamt' }), 'Druck_Statistik_6TageRennen_Beste.pdf');
        });

        it('mannschaft-mitglied-6tage (mehrere Mitglieder)', async () => {
            a.getStatistik6TageRennenMannschaftMitglied.mockResolvedValue({
                Anna: [{ Mannschaft: 'A / B', Anzahl: 2, Eins: 1 }],
                Berta: [{ Mannschaft: 'B / C', Anzahl: 1, Sechs: 1 }],
            } as any);
            await expectPdf(await post({ auswahl: 'mannschaft-mitglied-6tage', zeit: 'gesamt' }), 'Druck_Statistik_6TageRennen_Mannschaft.pdf');
        });

        it('neunerkoenig-rattenorden', async () => {
            a.getStatistikNeunerRattenKoenig.mockResolvedValue({
                lstStatistik9erRatten: [
                    { Spieltag: new Date('2024-01-10T00:00:00Z'), Neunerkönig: 'Anna', Rattenorden: 'Berta' },
                    { Spieltag: new Date('2024-01-17T00:00:00Z'), Neunerkönig: '', Rattenorden: '' },
                ],
                dictNeunerkönig: { Anna: 2, Berta: 2, Carl: 5 },
                dictRattenkönig: { Berta: 1 },
            } as any);
            await expectPdf(await post({ auswahl: 'neunerkoenig-rattenorden', zeit: 'gesamt' }), 'Druck_Statistik_NeunerRatten.pdf');
        });

        it('unbekannte Auswahl liefert trotzdem ein (leeres) PDF mit Standardname', async () => {
            await expectPdf(await post({ auswahl: 'xyz', zeit: 'gesamt' }), 'statistik.pdf');
        });

        it('viele Zeilen erzeugen groessere PDFs als wenige', async () => {
            a.getStatistikPokal.mockResolvedValue(platz(3) as any);
            const few = await expectPdf(await post({ auswahl: 'pokal', zeit: 'gesamt' }), 'Druck_Statistik_Pokal.pdf');
            a.getStatistikPokal.mockResolvedValue(platz(120) as any);
            const many = await expectPdf(await post({ auswahl: 'pokal', zeit: 'gesamt' }), 'Druck_Statistik_Pokal.pdf');
            expect(many.length).toBeGreaterThan(few.length);
        });
    });

    describe('Zeitbereich', () => {
        beforeEach(() => a.getStatistik9er.mockResolvedValue([] as any));

        it('laufende ohne meisterschaftId -> Bereich 1', async () => {
            await post({ auswahl: 'neuner', zeit: 'laufende' });
            expect(a.getStatistik9er).toHaveBeenCalledWith(1, undefined, undefined);
            expect(findMs).not.toHaveBeenCalled();
        });

        it('laufende mit bekannter meisterschaftId -> Bereich 3 mit Beginn/Ende', async () => {
            const beginn = new Date('2024-01-01'); const ende = new Date('2024-06-30');
            findMs.mockResolvedValue({ Beginn: beginn, Ende: ende, Bezeichnung: 'Sommer' });
            await post({ auswahl: 'neuner', zeit: 'laufende', meisterschaftId: '7' });
            expect(findMs).toHaveBeenCalledWith({ where: { ID: 7 } });
            expect(a.getStatistik9er).toHaveBeenCalledWith(3, beginn, ende);
        });

        it('laufende mit Meisterschaft ohne Beginn/Ende', async () => {
            findMs.mockResolvedValue({ Beginn: null, Ende: null, Bezeichnung: 'X' });
            await post({ auswahl: 'neuner', zeit: 'laufende', meisterschaftId: 7 });
            expect(a.getStatistik9er).toHaveBeenCalledWith(3, undefined, undefined);
        });

        it('laufende mit unbekannter meisterschaftId -> Bereich 1', async () => {
            findMs.mockResolvedValue(null);
            await post({ auswahl: 'neuner', zeit: 'laufende', meisterschaftId: 99 });
            expect(a.getStatistik9er).toHaveBeenCalledWith(1, undefined, undefined);
        });

        it('letzte -> Bereich 2', async () => {
            await post({ auswahl: 'neuner', zeit: 'letzte' });
            expect(a.getStatistik9er).toHaveBeenCalledWith(2, undefined, undefined);
        });

        it('individuell mit von/bis -> Bereich 3 mit Datumsobjekten', async () => {
            await post({ auswahl: 'neuner', zeit: 'individuell', dateVon: '2024-01-01', dateBis: '2024-02-01' });
            expect(a.getStatistik9er).toHaveBeenCalledWith(3, new Date('2024-01-01'), new Date('2024-02-01'));
        });

        it('individuell ohne Datum -> Bereich 3, undefined', async () => {
            await post({ auswahl: 'neuner', zeit: 'individuell' });
            expect(a.getStatistik9er).toHaveBeenCalledWith(3, undefined, undefined);
        });
    });

    describe('Fehler', () => {
        it('500 mit Fehlermeldung bei Action-Fehler', async () => {
            a.getStatistik9er.mockRejectedValue(new Error('DB Error'));
            const res = await post({ auswahl: 'neuner', zeit: 'gesamt' });
            expect(res.status).toBe(500);
            expect(await res.json()).toEqual({ error: 'DB Error' });
        });

        it('500 mit Standardmeldung wenn Fehler keine Nachricht hat', async () => {
            a.getStatistik9er.mockRejectedValue({});
            const res = await post({ auswahl: 'neuner', zeit: 'gesamt' });
            expect(res.status).toBe(500);
            expect(await res.json()).toEqual({ error: 'Interner Serverfehler' });
        });

        it('500 bei ungueltigem JSON-Body', async () => {
            const res = await POST(new NextRequest('http://localhost/api/statistik/pdf', { method: 'POST', body: '{kaputt' }));
            expect(res.status).toBe(500);
        });
    });
});
