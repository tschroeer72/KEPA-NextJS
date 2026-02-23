import { NextRequest, NextResponse } from 'next/server';
import { getMitgliedById } from '@/app/actions/verwaltung/mitglieder/actions';
import { getStatistikSpielerById, getStatistikSpielerErgebnisse } from '@/app/actions/verwaltung/statistik/actions';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function POST(req: NextRequest) {
  try {
    const { mitgliedId, showErgebnisse, showStatistik } = await req.json();

    if (!mitgliedId) {
      return NextResponse.json({ error: 'MitgliedID fehlt' }, { status: 400 });
    }

    // Daten laden
    const [mitgliedRes, statistikRes, ergebnisse] = await Promise.all([
      getMitgliedById(Number(mitgliedId)),
      getStatistikSpielerById(Number(mitgliedId)),
      getStatistikSpielerErgebnisse(Number(mitgliedId))
    ]);

    if (!mitgliedRes.success || !mitgliedRes.data) {
      return NextResponse.json({ error: 'Mitglied nicht gefunden' }, { status: 404 });
    }

    const mitglied = mitgliedRes.data;
    const statistik = statistikRes.data;

    // PDF erstellen
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'cm',
      format: 'a4'
    });

    // Margins (ähnlich C#: Left 0.5, Top 1.0, Right 2.5 - jsPDF nutzt andere Logik für Right, wir setzen einfach x-Positionen)
    const marginLeft = 0.5;
    const marginTop = 1.0;
    let currentY = marginTop;

    if (showErgebnisse) {
      // Titel für Ergebnisse
      doc.setFontSize(18);
      doc.text('Spielergebnisse von', 10.5, currentY, { align: 'center' });
      currentY += 1.0;
      doc.text(`${mitglied.Nachname}, ${mitglied.Vorname}`, 10.5, currentY, { align: 'center' });
      currentY += 1.5;

      autoTable(doc, {
        startY: currentY,
        margin: { left: marginLeft },
        head: [[
          'Spieltag', 'Meisterschaft', 'Gegenspieler', 'Erg.', 'Holz', 
          '6T Runden', '6T Punkte', '6T Platz', 'Sarg', 'Pokal', '9er', 'Ratten'
        ]],
        body: ergebnisse.map(e => [
          e.Spieltag ? new Date(e.Spieltag).toLocaleDateString('de-DE') : '',
          e.Meisterschaft || '',
          e.Gegenspieler || '',
          e.Ergebnis !== undefined ? e.Ergebnis.toString() : '',
          e.Holz !== undefined ? e.Holz.toString() : '',
          e.SechsTageRennen_Runden !== undefined ? e.SechsTageRennen_Runden.toString() : '',
          e.SechsTageRennen_Punkte !== undefined ? e.SechsTageRennen_Punkte.toString() : '',
          e.SechsTageRennen_Platz !== undefined ? e.SechsTageRennen_Platz.toString() : '',
          e.Sarg !== undefined ? e.Sarg.toString() : '',
          e.Pokal !== undefined ? e.Pokal.toString() : '',
          e.Neuner !== undefined ? e.Neuner.toString() : '',
          e.Ratten !== undefined ? e.Ratten.toString() : ''
        ]),
        styles: { fontSize: 7, cellPadding: 0.1 },
        headStyles: { fillColor: [211, 211, 211], textColor: [0, 0, 0], fontStyle: 'bold' },
        theme: 'grid',
        columnStyles: {
          0: { cellWidth: 1.8 }, // Spieltag
          1: { cellWidth: 2.5 }, // Meisterschaft
          2: { cellWidth: 3.0 }, // Gegenspieler
          3: { cellWidth: 0.8 }, // Erg.
          4: { cellWidth: 0.8 }, // Holz
          5: { cellWidth: 1.2 }, // 6T Runden
          6: { cellWidth: 1.2 }, // 6T Punkte
          7: { cellWidth: 1.2 }, // 6T Platz
          8: { cellWidth: 0.8 }, // Sarg
          9: { cellWidth: 0.8 }, // Pokal
          10: { cellWidth: 0.8 }, // 9er
          11: { cellWidth: 1.2 }  // Ratten
        }
      });
      currentY = (doc as any).lastAutoTable.finalY + 1.5;
    }

    if (showStatistik) {
      if (showErgebnisse) {
        doc.addPage();
        currentY = marginTop;
      }
      
      doc.setFontSize(18);
      doc.text('Statistik von', 10.5, currentY, { align: 'center' });
      currentY += 1.0;
      doc.text(`${mitglied.Nachname}, ${mitglied.Vorname}`, 10.5, currentY, { align: 'center' });
      currentY += 1.0;

      if (statistik) {
        const statData = [
          ['Holz Sum.', statistik.HolzSumme?.toString() || '0'],
          ['Holz Max.', statistik.HolzMax?.toString() || '0'],
          ['Holz Min.', statistik.HolzMin?.toString() || '0'],
          ['Holz AVG.', statistik.HolzAVG?.toFixed(2) || '0.00'],
          ['Ratten Sum.', statistik.RattenSumme?.toString() || '0'],
          ['Ratten Max.', statistik.RattenMax?.toString() || '0'],
          ['9er Sum.', statistik.NeunerSumme?.toString() || '0'],
          ['9er Max.', statistik.NeunerMax?.toString() || '0'],
          ['Kranz 8 Sum.', statistik.Kranz8Summe?.toString() || '0'],
          ['Kranz 8 Max.', statistik.Kranz8Max?.toString() || '0']
        ];

        autoTable(doc, {
          startY: currentY,
          margin: { left: marginLeft },
          body: statData,
          theme: 'grid',
          styles: { fontSize: 10 },
          columnStyles: {
            0: { cellWidth: 4, fontStyle: 'bold' },
            1: { cellWidth: 3 }
          }
        });
      }
    }

    const pdfBuffer = doc.output('arraybuffer');

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Statistik_${mitglied.Nachname}_${mitglied.Vorname}.pdf"`
      }
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Interner Serverfehler' }, { status: 500 });
  }
}
