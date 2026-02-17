import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
    getStatistik9er, 
    getStatistikRatten, 
    getStatistikPokal, 
    getStatistikSarg,
    getStatistikSpielerSpieler,
    getStatistik6TageRennenPlatz,
    getStatistik6TageRennenBesteMannschaft,
    getStatistik6TageRennenMannschaftMitglied,
    getStatistikNeunerRattenKoenig
} from '@/app/actions/db/statistik/actions';

export async function POST(req: NextRequest) {
    try {
        const { auswahl, zeit, dateVon, dateBis } = await req.json();

        let zeitbereich = 4; // Gesamt
        if (zeit === "laufende") zeitbereich = 1;
        else if (zeit === "letzte") zeitbereich = 2;
        else if (zeit === "individuell") zeitbereich = 3;

        const von = dateVon ? new Date(dateVon) : undefined;
        const bis = dateBis ? new Date(dateBis) : undefined;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'cm',
            format: 'a4'
        });

        let title = "";
        let filename = "statistik.pdf";
        let zeitraumText = "Gesamt";

        if (zeitbereich === 1) zeitraumText = "Laufende Meisterschaft";
        else if (zeitbereich === 2) zeitraumText = "Letzte Meisterschaft";
        else if (zeitbereich === 3 && von && bis) zeitraumText = `${von.toLocaleDateString('de-DE')} - ${bis.toLocaleDateString('de-DE')}`;

        if (auswahl === "neuner") {
            title = "Neuner";
            filename = "Druck_Statistik_Neuner.pdf";
            doc.setProperties({ title: "Neuner" });
            const data = await getStatistik9er(zeitbereich, von, bis);
            renderStandardTable(doc, title, zeitraumText, data, ["Pos.", "Spieler", "Ges.", "Anz. TN.", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"], "landscape");
        } else if (auswahl === "ratten") {
            title = "Ratten";
            filename = "Druck_Statistik_Ratten.pdf";
            const data = await getStatistikRatten(zeitbereich, von, bis);
            renderStandardTable(doc, title, zeitraumText, data, ["Pos.", "Spieler", "Ges.", "Anz. TN.", "10", "9", "8", "7", "6", "5", "4", "3", "2", "1"], "landscape");
        } else if (auswahl === "pokal") {
            title = "Pokal";
            filename = "Druck_Statistik_Pokal.pdf";
            const data = await getStatistikPokal(zeitbereich, von, bis);
            renderPokalTable(doc, title, zeitraumText, data);
        } else if (auswahl === "sarg") {
            title = "Sarg";
            filename = "Druck_Statistik_Sarg.pdf";
            const data = await getStatistikSarg(zeitbereich, von, bis);
            renderSargTable(doc, title, zeitraumText, data);
        } else if (auswahl === "ergebnisse-spieler") {
            title = "Spieler / Spieler";
            filename = "Statistik_Spieler_Spieler.pdf";
            const data = await getStatistikSpielerSpieler(zeitbereich, von, bis);
            renderSpielerSpielerTable(doc, title, zeitraumText, data);
        } else if (auswahl === "platzierung-6tage") {
            title = "6 Tage Rennen Platzierung";
            filename = "Druck_Statistik_6TageRennen_Platzierung.pdf";
            const data = await getStatistik6TageRennenPlatz(zeitbereich, von, bis);
            render6TagePlatzTable(doc, title, zeitraumText, data);
        } else if (auswahl === "beste-mannschaft-6tage") {
            title = "6 Tage Rennen Beste Mannschaft";
            filename = "Druck_Statistik_6TageRennen_Beste.pdf";
            const data = await getStatistik6TageRennenBesteMannschaft(zeitbereich, von, bis);
            render6TageBesteTable(doc, title, zeitraumText, data);
        } else if (auswahl === "mannschaft-mitglied-6tage") {
            title = "6 Tage Rennen Mannschaft / Mitglied";
            filename = "Druck_Statistik_6TageRennen_Mannschaft.pdf";
            const data = await getStatistik6TageRennenMannschaftMitglied(zeitbereich, von, bis);
            render6TageMannschaftMitgliedTable(doc, title, zeitraumText, data);
        } else if (auswahl === "neunerkoenig-rattenorden") {
            title = "Neunerkönig / Rattenorden";
            filename = "Druck_Statistik_NeunerRatten.pdf";
            const data = await getStatistikNeunerRattenKoenig(zeitbereich, von, bis);
            renderNeunerRattenKoenigTable(doc, title, zeitraumText, data);
        }

        const pdfBuffer = doc.output('arraybuffer');

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        });

    } catch (error: any) {
        console.error('PDF Generation Error:', error);
        return NextResponse.json({ error: error.message || 'Interner Serverfehler' }, { status: 500 });
    }
}

function renderStandardTable(doc: jsPDF, title: string, zeitraum: string, data: any[], head: string[], orientation: 'portrait' | 'landscape' = 'portrait') {
    if (orientation === 'landscape') {
        doc.addPage('a4', 'landscape');
        // Erste Seite entfernen (leere Default-Seite)
        doc.deletePage(1);
    }
    
    const width = orientation === 'landscape' ? 29.7 : 21.0;
    
    doc.setFontSize(18);
    doc.text(title, width / 2, 1.5, { align: 'center' });
    doc.text(zeitraum, width / 2, 2.5, { align: 'center' });

    autoTable(doc, {
        startY: 3.5,
        head: [head],
        body: data.map((d, i) => [
            i + 1,
            d.Spieler,
            d.Gesamt,
            d.AnzTeilnahmen,
            d.Zehn || '',
            d.Neun || '',
            d.Acht || '',
            d.Sieben || '',
            d.Sechs || '',
            d.Fünf || '',
            d.Vier || '',
            d.Drei || '',
            d.Zwei || '',
            d.Eins || ''
        ]),
        theme: 'grid',
        headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        styles: { halign: 'center' },
        columnStyles: {
            1: { halign: 'left' }
        }
    });
}

function renderPokalTable(doc: jsPDF, title: string, zeitraum: string, data: any[]) {
    doc.setFontSize(18);
    doc.text(title, 10.5, 1.5, { align: 'center' });
    doc.text(zeitraum, 10.5, 2.5, { align: 'center' });

    autoTable(doc, {
        startY: 3.5,
        head: [["Pos.", "Spieler", "Plz. 1", "Plz. 2"]],
        body: data.map((d, i) => [
            i + 1,
            d.Spieler,
            d.Eins || '',
            d.Zwei || ''
        ]),
        theme: 'grid',
        headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        styles: { halign: 'center' },
        columnStyles: {
            1: { halign: 'left' }
        }
    });
}

function renderSargTable(doc: jsPDF, title: string, zeitraum: string, data: any[]) {
    doc.addPage('a4', 'landscape');
    doc.deletePage(1);
    
    doc.setFontSize(18);
    doc.text(title, 14.85, 1.5, { align: 'center' });
    doc.text(zeitraum, 14.85, 2.5, { align: 'center' });

    autoTable(doc, {
        startY: 3.5,
        head: [["Pos.", "Spieler", "Anz. TN.", "Plz. 1", "Plz. 2", "Plz. 3", "Plz. 4", "Plz. 5", "Plz. 6", "Plz. 7", "Plz. 8", "Plz. 9", "Plz. 10"]],
        body: data.map((d, i) => [
            i + 1,
            d.Spieler,
            d.AnzTeilnahmen,
            d.Eins || '',
            d.Zwei || '',
            d.Drei || '',
            d.Vier || '',
            d.Fünf || '',
            d.Sechs || '',
            d.Sieben || '',
            d.Acht || '',
            d.Neun || '',
            d.Zehn || ''
        ]),
        theme: 'grid',
        headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        styles: { halign: 'center' },
        columnStyles: {
            1: { halign: 'left' }
        }
    });
}

function renderSpielerSpielerTable(doc: jsPDF, title: string, zeitraum: string, data: any[]) {
    doc.addPage('a4', 'landscape');
    doc.deletePage(1);
    
    doc.setFontSize(20);
    doc.text(title, 14.85, 1.5, { align: 'center' });
    doc.text(zeitraum, 14.85, 2.5, { align: 'center' });

    let currentY = 3.5;

    for (const sp of data.sort((a, b) => a.Spielername.localeCompare(b.Spielername))) {
        const allKeys = Array.from(new Set([
            ...Object.keys(sp.dictMeisterschaft),
            ...Object.keys(sp.dictBlitztunier),
            ...Object.keys(sp.dictKombimeisterschaft)
        ])).sort();

        if (allKeys.length === 0) continue;

        autoTable(doc, {
            startY: currentY,
            head: [
                [{ content: sp.Spielername, colSpan: 1, rowSpan: 2 }, { content: 'Meisterschaft', colSpan: 3 }, { content: 'Blitztunier', colSpan: 3 }, { content: 'Kombimeisterschaft', colSpan: 9 }],
                ['vs.', 'G', 'U', 'V', 'G', 'U', 'V', { content: '3 bis 8', colSpan: 3 }, { content: '5 Kugeln', colSpan: 3 }, { content: 'Gesamt', colSpan: 3 }],
                ['', '', '', '', '', '', '', 'G', 'U', 'V', 'G', 'U', 'V', 'G', 'U', 'V']
            ],
            body: allKeys.map(key => [
                key,
                sp.dictMeisterschaft[key]?.Gewonnen ?? '-',
                sp.dictMeisterschaft[key]?.Unentschieden ?? '-',
                sp.dictMeisterschaft[key]?.Verloren ?? '-',
                sp.dictBlitztunier[key]?.Gewonnen ?? '-',
                sp.dictBlitztunier[key]?.Unentschieden ?? '-',
                sp.dictBlitztunier[key]?.Verloren ?? '-',
                sp.dictKombimeisterschaft[key]?.dict3bis8[key]?.Gewonnen ?? '-',
                sp.dictKombimeisterschaft[key]?.dict3bis8[key]?.Unentschieden ?? '-',
                sp.dictKombimeisterschaft[key]?.dict3bis8[key]?.Verloren ?? '-',
                sp.dictKombimeisterschaft[key]?.dict5Kugeln[key]?.Gewonnen ?? '-',
                sp.dictKombimeisterschaft[key]?.dict5Kugeln[key]?.Unentschieden ?? '-',
                sp.dictKombimeisterschaft[key]?.dict5Kugeln[key]?.Verloren ?? '-',
                sp.dictKombimeisterschaft[key]?.dictGesamt[key]?.Gewonnen ?? '-',
                sp.dictKombimeisterschaft[key]?.dictGesamt[key]?.Unentschieden ?? '-',
                sp.dictKombimeisterschaft[key]?.dictGesamt[key]?.Verloren ?? '-'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center', fontSize: 8 },
            styles: { halign: 'center', fontSize: 8 },
            columnStyles: { 0: { halign: 'left' } },
            margin: { top: 1 },
            pageBreak: 'auto'
        });
        currentY = (doc as any).lastAutoTable.finalY + 1.0;
    }
}

function render6TagePlatzTable(doc: jsPDF, title: string, zeitraum: string, data: any[]) {
    doc.setFontSize(18);
    doc.text(title, 10.5, 1.5, { align: 'center' });
    doc.text(zeitraum, 10.5, 2.5, { align: 'center' });

    autoTable(doc, {
        startY: 3.5,
        head: [["Pos.", "Spieler", "Anz. TN.", "Plz. 1", "Plz. 2", "Plz. 3", "Plz. 4", "Plz. 5", "Plz. 6"]],
        body: data.map((d, i) => [
            i + 1,
            d.Spieler,
            d.AnzTeilnahmen,
            d.Eins || '',
            d.Zwei || '',
            d.Drei || '',
            d.Vier || '',
            d.Fünf || '',
            d.Sechs || ''
        ]),
        theme: 'grid',
        headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        styles: { halign: 'center' },
        columnStyles: { 1: { halign: 'left' } }
    });
}

function render6TageBesteTable(doc: jsPDF, title: string, zeitraum: string, data: any[]) {
    doc.setFontSize(18);
    doc.text(title, 10.5, 1.5, { align: 'center' });
    doc.text(zeitraum, 10.5, 2.5, { align: 'center' });

    autoTable(doc, {
        startY: 3.5,
        head: [["Pos.", "Mannschaft", "Anz.", "Plz. 1", "Plz. 2", "Plz. 3", "Plz. 4", "Plz. 5", "Plz. 6"]],
        body: data.map((d, i) => [
            i + 1,
            d.Mannschaft,
            d.Anzahl,
            d.Eins || '',
            d.Zwei || '',
            d.Drei || '',
            d.Vier || '',
            d.Fünf || '',
            d.Sechs || ''
        ]),
        theme: 'grid',
        headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
        styles: { halign: 'center' },
        columnStyles: { 1: { halign: 'left' } }
    });
}

function render6TageMannschaftMitgliedTable(doc: jsPDF, title: string, zeitraum: string, data: Record<string, any[]>) {
    doc.setFontSize(18);
    doc.text(title, 10.5, 1.5, { align: 'center' });
    doc.text(zeitraum, 10.5, 2.5, { align: 'center' });

    let currentY = 3.5;
    for (const member in data) {
        autoTable(doc, {
            startY: currentY,
            head: [[{ content: member, colSpan: 9, styles: { halign: 'left', fillColor: [240, 240, 240] } }], ["Pos.", "Mannschaft", "Anz.", "Plz. 1", "Plz. 2", "Plz. 3", "Plz. 4", "Plz. 5", "Plz. 6"]],
            body: data[member].map((d, i) => [
                i + 1,
                d.Mannschaft,
                d.Anzahl,
                d.Eins || '',
                d.Zwei || '',
                d.Drei || '',
                d.Vier || '',
                d.Fünf || '',
                d.Sechs || ''
            ]),
            theme: 'grid',
            headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
            styles: { halign: 'center' },
            columnStyles: { 1: { halign: 'left' } },
            margin: { top: 1 },
            pageBreak: 'auto'
        });
        currentY = (doc as any).lastAutoTable.finalY + 1.0;
    }
}

function renderNeunerRattenKoenigTable(doc: jsPDF, title: string, zeitraum: string, data: any) {
    doc.setFontSize(18);
    doc.text(title, 10.5, 1.5, { align: 'center' });
    doc.text(zeitraum, 10.5, 2.5, { align: 'center' });

    autoTable(doc, {
        startY: 3.5,
        head: [["Spieltag", "Neunerkönig", "Rattenorden"]],
        body: data.lstStatistik9erRatten.map((item: any) => [
            new Date(item.Spieltag).toLocaleDateString('de-DE'),
            item.Neunerkönig || '---',
            item.Rattenorden || '---'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 1.5;

    // Zwei kleine Tabellen nebeneinander
    doc.setFontSize(16);
    doc.text("Neunerkönig", 10.5 / 2, currentY, { align: 'center' });
    doc.text("Rattenorden", 10.5 + 10.5 / 2, currentY, { align: 'center' });
    currentY += 0.5;

    const nKoenigData = Object.entries(data.dictNeunerkönig).sort((a: any, b: any) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const rKoenigData = Object.entries(data.dictRattenkönig).sort((a: any, b: any) => b[1] - a[1] || a[0].localeCompare(b[0]));

    autoTable(doc, {
        startY: currentY,
        margin: { right: 11 },
        body: nKoenigData.map((item: any) => [item[1], item[0]]),
        theme: 'plain',
        columnStyles: { 0: { cellWidth: 1 } }
    });

    autoTable(doc, {
        startY: currentY,
        margin: { left: 11 },
        body: rKoenigData.map((item: any) => [item[1], item[0]]),
        theme: 'plain',
        columnStyles: { 0: { cellWidth: 1 } }
    });
}
