import { NextRequest, NextResponse } from "next/server";
import { VpeToJsPdf, TextAlignment, PenStyle } from "@/utils/vpe-to-jspdf";

export async function GET(req: NextRequest) {
  const vpe = new VpeToJsPdf("l");
  vpe.setMargins(1, 1, 2, 2);

  // Überschrift
  const pageWidth = vpe.doc.internal.pageSize.getWidth() / vpe.cm;
  const centerX = pageWidth / 2;

  vpe.selectFont("helvetica", 18);
  vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
  vpe.write(centerX - 5, vpe.nTopMargin, -10, -0.8, "Kegeln am ");
  vpe.penStyle = PenStyle.DashDot;
  vpe.line(vpe.nRight, vpe.nBottom, vpe.nRight + 4, vpe.nBottom);
  
  vpe.selectFont("helvetica", 12);
  vpe.write(centerX - 5, vpe.nBottom + 0.2, -10, -0.8, "Spielverluste vom ");
  vpe.line(vpe.nRight, vpe.nBottom, vpe.nRight + 4, vpe.nBottom);

  // Zahlbeträge Überschrift
  vpe.setFontAttr(TextAlignment.Left, false, false, false, false);
  const tableTop = vpe.nTopMargin + 2.5; // Genug Platz für die Überschrift lassen
  vpe.write(vpe.nLeftMargin, tableTop, -3, -1.2, "Name");
  vpe.penStyle = PenStyle.Solid;
  
  // Wir definieren die Spaltenbreiten
  const colWidths = [1.8, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6, 1.6];
  const headers = ["Restbetrag", "Beitrag", "Bahnmiete", "6 Tg. Ren.", "Neun", "Ratten", "Sarg", "", "zu Zahlen", "gezahlt", "noch offen"];
  
  let currentX = vpe.nLeftMargin + 3;
  vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
  vpe.selectFont("helvetica", 9);

  headers.forEach((h, i) => {
    const width = colWidths[i];
    vpe.write(currentX, tableTop, -width, -0.6, h);
    vpe.write(currentX, tableTop + 0.6, -width, -0.6, i === 7 ? "" : "EUR");
    vpe.line(currentX, tableTop, currentX, vpe.nBottomMargin);
    currentX += width;
  });
  // Abschlusslinie rechts
  vpe.line(currentX, tableTop, currentX, vpe.nBottomMargin);
  // Vertikale Linie nach Name
  vpe.line(vpe.nLeftMargin + 3, tableTop, vpe.nLeftMargin + 3, vpe.nBottomMargin);
  // Vertikale Linie ganz links
  vpe.line(vpe.nLeftMargin, tableTop, vpe.nLeftMargin, vpe.nBottomMargin);

  const tableHeaderBottom = tableTop + 1.2;
  vpe.line(vpe.nLeftMargin, tableHeaderBottom, currentX, tableHeaderBottom);

  // Zeilen
  vpe.selectFont("helvetica", 12);
  const startY = tableHeaderBottom;
  const availableHeight = vpe.nBottomMargin - startY;
  const lineHeight = availableHeight / 17;

  for (let i = 0; i < 17; i++) {
    const currentY = startY + i * lineHeight;
    
    // Spalte "Beitrag" ist die zweite Spalte nach "Name" -> Name (3) + Restbetrag (1.8)
    const beitragX = vpe.nLeftMargin + 3 + 1.8;
    vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
    vpe.write(beitragX, currentY, -1.6, -lineHeight, "10,-");
    
    // Horizontale Linie unter der Zeile
    vpe.line(vpe.nLeftMargin, currentY + lineHeight, currentX, currentY + lineHeight);
  }

  // Abrechnung
  const abrechnungX = currentX + 0.5;
  const pageHeight = vpe.doc.internal.pageSize.getHeight() / vpe.cm;
  const maxAbrechnungHeight = (pageHeight * 2) / 3;
  
  // Wir definieren die Zeilen und ihre Abstände
  // Ein Eintrag ist { label: string, gap: number (leere Zeilen danach) }
  const abrechnungRows = [
    { label: "Anfangsbestand", gaps: 3 },
    { label: "plus Einnahmen", gaps: 0 },
    { label: "Zwischensumme", gaps: 0 },
    { label: "minus Ausgaben", gaps: 5 },
    { label: "Bestand am", gaps: 0 }
  ];

  const totalLines = abrechnungRows.length + abrechnungRows.reduce((sum, row) => sum + row.gaps, 0);
  const rowHeight = 1.0; // Höhe pro Zeile in cm
  const totalAbrechnungHeight = totalLines * rowHeight;
  
  // Am unteren Blattrand abschließen
  let currentY = vpe.nBottomMargin - totalAbrechnungHeight;
  
  // Sicherstellen, dass es nicht höher als 2/3 der Blatthöhe ist (theoretisch durch nBottomMargin und totalAbrechnungHeight gegeben)
  // Aber wir prüfen auch gegen den oberen Teil, falls nötig. Hier einfach am unteren Rand positionieren.

  vpe.selectFont("helvetica", 18);
  vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
  vpe.write(abrechnungX, currentY - 1.5, -6, -1.2, "Abrechnung");

  vpe.selectFont("helvetica", 10);
  
  // Euro-Spalte für Abrechnung
  const euroColX = abrechnungX + 4.5;
  vpe.line(euroColX, currentY, euroColX, vpe.nBottomMargin);
  vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
  vpe.write(euroColX, currentY - 0.6, -1.5, -0.6, "EURO");
  vpe.line(euroColX, currentY, euroColX + 1.5, currentY); // Obere Linie der Euro-Spalte
  //vpe.line(euroColX + 1.5, currentY, euroColX + 1.5, vpe.nBottomMargin);
  
  vpe.setFontAttr(TextAlignment.Left, false, false, false, false);
  
  abrechnungRows.forEach((row, index) => {
    vpe.write(abrechnungX, currentY, -4.5, -rowHeight, row.label);
    vpe.line(abrechnungX, currentY + rowHeight, euroColX + 1.5, currentY + rowHeight);
    
    // Springe zur nächsten Zeile (+ gaps)
    currentY += rowHeight * (1 + row.gaps);
    
    // Wenn es leere Zeilen gibt, zeichne auch dort Linien für die Euro-Spalte? 
    // Im Original wurden Linien nach jedem Label gezeichnet.
    // Bei leeren Zeilen zeichnen wir hier Linien weiter.
    if (row.gaps > 0) {
      for (let g = 1; g <= row.gaps; g++) {
        const gapY = currentY - (row.gaps - g + 1) * rowHeight;
        vpe.line(abrechnungX, gapY, euroColX + 1.5, gapY);
      }
    }
  });

  const pdfOutput = vpe.getOutput();
  return new NextResponse(pdfOutput as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=Abrechnung.pdf",
    },
  });
}
