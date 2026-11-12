/**
 * @jest-environment node
 */
import { GET } from '../route';
import { prisma } from '@/lib/prisma';

jest.mock('@/lib/prisma', () => ({
    prisma: {
        tblMeisterschaften: { findUnique: jest.fn() },
        tblSpielKombimeisterschaft: { findMany: jest.fn() },
    },
}));

const findUnique = prisma.tblMeisterschaften.findUnique as jest.Mock;
const findMany = prisma.tblSpielKombimeisterschaft.findMany as jest.Mock;

const mitglied = (id: number, spitz: string | null = null) => ({
    ID: id, Vorname: `Vor${id}`, Nachname: `Nach${id}`, Spitzname: spitz,
});

const spiel = (ID: number, s1: number, s2: number, h1: number, h2: number, hinRueck: number, spieltag: Date) => ({
    ID, SpielerID1: s1, SpielerID2: s2, HinRueckrunde: hinRueck,
    Spieler1Punkte3bis8: h1, Spieler1Punkte5Kugeln: h1 % 3,
    Spieler2Punkte3bis8: h2, Spieler2Punkte5Kugeln: h2 % 3,
    tblMitglieder_SpielerID1: mitglied(s1, s1 === 1 ? 'Eins' : null),
    tblMitglieder_SpielerID2: mitglied(s2),
    tblSpieltag: { Spieltag: spieltag },
});

const d1 = new Date('2024-01-10T00:00:00Z');
const d2 = new Date('2024-02-14T00:00:00Z');

function baseData() {
    const g1 = spiel(1, 1, 2, 10, 5, 0, d1);
    const g2 = spiel(2, 1, 3, 7, 7, 0, d1);
    const g3 = spiel(3, 2, 3, 3, 9, 1, d1);
    const g4 = spiel(4, 1, 2, 4, 8, 1, d2);
    const g5 = spiel(5, 2, 1, 6, 6, 1, d2);
    const meisterschaft = {
        ID: 5,
        Bezeichnung: 'Winter 2024/25 (Test)',
        Beginn: new Date('2024-01-01T00:00:00Z'),
        tblMeisterschaftstyp: { Meisterschaftstyp: 'Einzel' },
        tblTeilnehmer: [
            { SpielerID: 1, NurHinrunde: false, tblMitglieder: mitglied(1, 'Eins') },
            { SpielerID: 2, NurHinrunde: false, tblMitglieder: mitglied(2) },
            { SpielerID: 3, NurHinrunde: true, tblMitglieder: mitglied(3) },
            { SpielerID: 4, NurHinrunde: false, tblMitglieder: mitglied(4) }, // hat nie gespielt
        ],
        tblSpieltag: [
            {
                Spieltag: d1,
                tblSpielKombimeisterschaft: [g1, g2, g3],
                tblSpiel6TageRennen: [{ SpielerID1: 1, SpielerID2: 2, Runden: 5, Punkte: 10, Platz: 1 }],
                tblSpielSargKegeln: [{ SpielerID: 1, Platzierung: 2 }],
                tblSpielPokal: [{ SpielerID: 2, Platzierung: 1 }, { SpielerID: 3, Platzierung: 5 }],
                tbl9erRatten: [{ SpielerID: 2, Neuner: 1, Kranzacht: 2, Ratten: 3 }],
            },
            {
                Spieltag: d2,
                tblSpielKombimeisterschaft: [g4, g5],
                tblSpiel6TageRennen: [], tblSpielSargKegeln: [], tblSpielPokal: [], tbl9erRatten: [],
            },
            {
                Spieltag: new Date('2024-03-01T00:00:00Z'), // leerer Spieltag -> wird uebersprungen
                tblSpielKombimeisterschaft: [], tblSpiel6TageRennen: [], tblSpielSargKegeln: [], tblSpielPokal: [], tbl9erRatten: [],
            },
        ],
    };
    return { meisterschaft, results: [g1, g2, g3, g4, g5, g1 /* Dublette */] };
}

const call = (qs: string) => GET(new Request(`http://localhost/api/ausgabe/kombimeisterschaft${qs}`));

async function expectPdf(res: Response) {
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.subarray(0, 4).toString()).toBe('%PDF');
    return buf;
}

describe('GET /api/ausgabe/kombimeisterschaft', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const { meisterschaft, results } = baseData();
        findUnique.mockResolvedValue(meisterschaft);
        findMany.mockResolvedValue(results);
    });
    afterEach(() => jest.restoreAllMocks());

    it('liefert 400 ohne gueltige ID', async () => {
        expect((await call('')).status).toBe(400);
        expect((await call('?id=abc')).status).toBe(400);
        expect(findUnique).not.toHaveBeenCalled();
    });

    it('liefert 404 wenn Meisterschaft nicht existiert', async () => {
        findUnique.mockResolvedValue(null);
        const res = await call('?id=5&tabelle=true');
        expect(res.status).toBe(404);
        expect(await res.text()).toBe('Meisterschaft nicht gefunden');
        expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { ID: 5 } }));
    });

    it('liefert 404 wenn keine Ergebnisse vorhanden sind', async () => {
        findMany.mockResolvedValue([]);
        const res = await call('?id=5&tabelle=true');
        expect(res.status).toBe(404);
        expect(await res.text()).toContain('Keine Ergebnisse');
        expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: { tblSpieltag: { MeisterschaftsID: 5 } },
        }));
    });

    it('liefert ein PDF mit allen drei Teilen und sauberem Dateinamen', async () => {
        const res = await call('?id=5&spielergebnisse=true&tabelle=true&kreuztabelle=true');
        await expectPdf(res);
        expect(res.headers.get('Content-Disposition')).toBe('inline; filename="Ergebnis_Winter_202425_Test.pdf"');
    });

    it('liefert ein PDF nur mit Tabelle', async () => {
        await expectPdf(await call('?id=5&tabelle=true'));
    });

    it('liefert ein PDF nur mit Spielergebnissen', async () => {
        await expectPdf(await call('?id=5&spielergebnisse=true'));
    });

    it('liefert ein PDF nur mit Kreuztabelle', async () => {
        await expectPdf(await call('?id=5&kreuztabelle=true'));
    });

    it('liefert auch ohne Auswahl ein (leeres) PDF mit Seitennummerierung', async () => {
        await expectPdf(await call('?id=5'));
    });

    it('mehr Seiten bei mehr Optionen', async () => {
        const one = await expectPdf(await call('?id=5&tabelle=true'));
        const three = await expectPdf(await call('?id=5&spielergebnisse=true&tabelle=true&kreuztabelle=true'));
        expect(three.length).toBeGreaterThan(one.length);
    });

    it('erzeugt Seitenumbrueche bei vielen Teilnehmern und Spieltagen', async () => {
        const players = Array.from({ length: 40 }, (_, i) => i + 1);
        const games = players.slice(0, -1).map((p, i) =>
            spiel(100 + i, p, p + 1, 10 + i, 5, i % 2, d1));
        const manyDays = Array.from({ length: 6 }, (_, i) => ({
            Spieltag: new Date(Date.UTC(2024, 0, 10 + i)),
            tblSpielKombimeisterschaft: games.slice(0, 10).map(g => ({ ...g, ID: g.ID + i * 1000 })),
            tblSpiel6TageRennen: [], tblSpielSargKegeln: [], tblSpielPokal: [], tbl9erRatten: [],
        }));
        findUnique.mockResolvedValue({
            ...baseData().meisterschaft,
            tblTeilnehmer: players.map(p => ({ SpielerID: p, NurHinrunde: p % 7 === 0, tblMitglieder: mitglied(p) })),
            tblSpieltag: manyDays,
        });
        findMany.mockResolvedValue(games);
        const small = await expectPdf(await call('?id=5&tabelle=true'));
        const all = await expectPdf(await call('?id=5&spielergebnisse=true&tabelle=true&kreuztabelle=true'));
        expect(all.length).toBeGreaterThan(small.length);
    });

    it('liefert 500 bei Datenbankfehler', async () => {
        findUnique.mockRejectedValue(new Error('DB down'));
        const res = await call('?id=5&tabelle=true');
        expect(res.status).toBe(500);
        expect(await res.text()).toBe('Fehler bei der PDF-Erstellung');
    });
});
