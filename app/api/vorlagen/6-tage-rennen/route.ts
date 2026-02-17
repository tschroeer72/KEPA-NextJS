import { NextRequest, NextResponse } from "next/server";
import { VpeToJsPdf, TextAlignment, PenStyle } from "@/utils/vpe-to-jspdf";

export async function GET(req: NextRequest) {
  const vpe = new VpeToJsPdf("l");
  vpe.setMargins(2, 2, 2, 2);

  // Überschrift
  vpe.selectFont("helvetica", 12);
  vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
  vpe.write((vpe.nLeftMargin + vpe.nRightMargin) / 2 - 2, vpe.nTopMargin, -4, -1, "6 Tage Rennen");

  // Kopfzeile 1
  vpe.selectFont("helvetica", 12);
  vpe.setFontAttr(TextAlignment.Left, false, false, false, false);
  vpe.write(vpe.nLeftMargin, vpe.nBottom, -4.5, -0.5, "Mannschaft");
  vpe.penStyle = PenStyle.Solid;
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
  vpe.write(vpe.nRight, vpe.nTop, -3.2, -0.5, "1. Nacht");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.write(vpe.nRight, vpe.nTop, -3.2, -0.5, "2. Nacht");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.write(vpe.nRight, vpe.nTop, -3.2, -0.5, "3. Nacht");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.write(vpe.nRight, vpe.nTop, -3.2, -0.5, "4. Nacht");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.write(vpe.nRight, vpe.nTop, -3.2, -0.5, "5. Nacht");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.write(vpe.nRight, vpe.nTop, -3.2, -0.5, "6. Nacht");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.write(vpe.nRight, vpe.nTop, -3, -0.5, "Platz");
  vpe.line(vpe.nLeftMargin, vpe.nBottom, vpe.nLeftMargin + 23.7, vpe.nBottom);

  // Kopfzeile 2
  vpe.setFontAttr(TextAlignment.Left, false, false, false, false);
  vpe.write(vpe.nLeftMargin, vpe.nBottom, -1, -0.5, "Nr.");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
  vpe.write(vpe.nRight, vpe.nTop, -3.5, -0.5, "Namen");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.selectFont("helvetica", 12);
  vpe.write(vpe.nRight, vpe.nTop, -2, -0.5, "Holz");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.selectFont("helvetica", 7);
  vpe.write(vpe.nRight, vpe.nTop, -0.6, -0.5, "Pkt");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  vpe.write(vpe.nRight, vpe.nTop, -0.6, -0.5, "RD");
  vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  
  // Wiederholung für 2.-6. Nacht
  for(let i=0; i<5; i++) {
      vpe.selectFont("helvetica", 12);
      vpe.write(vpe.nRight, vpe.nTop, -2, -0.5, "Holz");
      vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
      vpe.selectFont("helvetica", 7);
      vpe.write(vpe.nRight, vpe.nTop, -0.6, -0.5, "Pkt");
      vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
      vpe.write(vpe.nRight, vpe.nTop, -0.6, -0.5, "RD");
      vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottom);
  }
  vpe.line(vpe.nLeftMargin, vpe.nBottom, vpe.nRightMargin, vpe.nBottom);

  for (let i = 1; i <= 10; i++) {
    vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
    vpe.selectFont("helvetica", 12);
    vpe.write(vpe.nLeftMargin, vpe.nTop + 0.5, -1, -1, i.toString());
    vpe.line(vpe.nRight, vpe.nTop - 0.5, vpe.nRight, vpe.nBottom);

    vpe.penStyle = PenStyle.Dash;
    vpe.line(vpe.nRight, vpe.nTop + 0.75, vpe.nRight + 3.5, vpe.nTop + 0.75); // Trennlinie Namen
    vpe.penStyle = PenStyle.Solid;
    vpe.line(vpe.nRight, vpe.nTop - 0.75, vpe.nRight, vpe.nTop + 0.75); // Senktrecht
    
    // Nächte
    for(let j=0; j<6; j++) {
        vpe.line(vpe.nRight, vpe.nTop + 0.75, vpe.nRight + 2, vpe.nTop + 0.75); // Trennlinie Holz
        vpe.line(vpe.nLeft + 0.66, vpe.nTop - 0.75, vpe.nLeft + 0.66, vpe.nTop + 0.75); // Senktrecht
        vpe.line(vpe.nRight + 0.66, vpe.nTop, vpe.nRight + 0.66, vpe.nTop + 1.5); // Senktrecht
        vpe.line(vpe.nRight + 0.68, vpe.nTop, vpe.nRight + 0.68, vpe.nTop + 1.5); // Senktrecht
        vpe.line(vpe.nRight + 0.6, vpe.nTop, vpe.nRight + 0.6, vpe.nTop + 1.5); // Senktrecht
        vpe.line(vpe.nRight + 0.6, vpe.nTop, vpe.nRight + 0.6, vpe.nTop + 1.5); // Senktrecht
    }

    vpe.line(vpe.nLeftMargin, vpe.nBottom, vpe.nRightMargin, vpe.nBottom); // Zeilenabschluss
  }

  const pdfOutput = vpe.getOutput();
  return new NextResponse(pdfOutput as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=6-Tage-Rennen.pdf",
    },
  });
}
