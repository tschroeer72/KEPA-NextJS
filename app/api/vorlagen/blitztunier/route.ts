import { NextRequest, NextResponse } from "next/server";
import { VpeToJsPdf, TextAlignment } from "@/utils/vpe-to-jspdf";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const anzahl = parseInt(searchParams.get("anzahl") || "3");
  const isBlitztunier = req.nextUrl.pathname.includes("blitztunier");

  const vpe = new VpeToJsPdf("l");
  vpe.setMargins(2, 2, 2, 2);
  vpe.penSize = 0.01;

  const strTitel = isBlitztunier ? "Blitztunier" : "Meisterschaft";
  const strUnterTitel = isBlitztunier ? "Kurztunier" : "Meisterschaft";

  // Überschrift
  vpe.selectFont("helvetica", 18);
  vpe.setFontAttr(TextAlignment.Center, true, false, false, false);
  vpe.write(vpe.nLeftMargin, vpe.nTopMargin, vpe.nLeftMargin + 1.7 + anzahl * 2.4 + 3 * 0.8, -1, strTitel);
  vpe.selectFont("helvetica", 12);
  vpe.write(vpe.nLeftMargin, vpe.nBottom, vpe.nLeftMargin + 1.7 + anzahl * 2.4 + 3 * 0.8, -1, strUnterTitel);

  // Kopfzeile und Namensspalte
  vpe.selectFont("helvetica", 18);
  let x = vpe.nLeftMargin;
  let y = vpe.nBottom;
  const strYear = new Date().getFullYear().toString();
  vpe.writeBox(x, y, -1.7, -1, strYear);
  
  x = vpe.nRight;
  y = vpe.nTop;
  const xZeile = vpe.nLeft;
  const yZeile = vpe.nBottom;
  const xErg = vpe.nRight;
  const yErg = vpe.nBottom;

  for (let i = 0; i < anzahl; i++) {
    vpe.selectFont("helvetica", 9);
    vpe.writeBox(x, y, -2.4, -0.5, " ");
    const xBak = vpe.nRight;
    const yBak = vpe.nTop;
    vpe.selectFont("helvetica", 10);
    vpe.writeBox(vpe.nLeft, vpe.nTop + 0.5, -2.4, -0.5, "Punkte");
    x = xBak;
    y = yBak;
  }

  vpe.selectFont("helvetica", 7);
  vpe.writeBox(x, y, -0.8, -1, "Tot. Hi. Rü.");
  vpe.writeBox(vpe.nRight, vpe.nTop, -0.8, -1, "Total");
  vpe.writeBox(vpe.nRight, vpe.nTop, -0.8, -1, "Platz");

  x = xZeile;
  y = yZeile;
  vpe.selectFont("helvetica", 9);
  for (let i = 0; i < anzahl; i++) {
    vpe.writeBox(x, y, -1.7, -1, " ");
    x = vpe.nLeft;
    y = vpe.nBottom;
  }

  // Ergebnisse
  x = xErg;
  y = yErg;
  vpe.selectFont("helvetica", 10);
  for (let i = 0; i < anzahl; i++) {
    for (let j = 0; j < anzahl; j++) {
      let xBak = 0;
      let yBak = 0;
      if (i === j) {
        vpe.setFontAttr(TextAlignment.Center, true, false, false, false);
        vpe.selectFont("helvetica", 10);
        vpe.writeBox(x, y, -2.4, -0.5, "XXX");
        xBak = vpe.nRight;
        yBak = vpe.nTop;
        vpe.writeBox(x, y + 0.5, -2.4, -0.5, "XXX");
        vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
      } else {
        vpe.writeBox(x, y, -2.4, -0.5, " ");
        xBak = vpe.nRight;
        yBak = vpe.nTop;
        vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
        vpe.writeBox(x, y + 0.5, -2.4, -0.5, " ");
      }
      x = xBak;
      y = yBak;
    }
    const yBakRow = vpe.nBottom;
    vpe.setFontAttr(TextAlignment.Center, true, false, false, false);
    vpe.selectFont("helvetica", 8);
    vpe.writeBox(vpe.nRight, vpe.nTop - 0.5, -0.8, -0.5, " ");
    vpe.writeBox(vpe.nLeft, vpe.nBottom, -0.8, -0.5, " ");
    vpe.writeBox(vpe.nRight, vpe.nTop - 0.5, -0.8, -1, " ");
    vpe.writeBox(vpe.nRight, vpe.nTop, -0.8, -1, " ");
    vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
    x = xErg;
    y = yBakRow;
  }

  vpe.selectFont("helvetica", 7);
  vpe.setFontAttr(TextAlignment.Center, true, false, false, false);
  vpe.writeBox(vpe.nLeftMargin, vpe.nBottom, -1.7, -0.5, "Tot. Hi. Rü.");
  for (let i = 0; i < anzahl; i++) {
    vpe.selectFont("helvetica", 10);
    vpe.writeBox(vpe.nRight, vpe.nTop, -2.4, -0.5, " ");
  }

  const pdfOutput = vpe.getOutput();

  return new NextResponse(pdfOutput as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${strTitel}.pdf`,
    },
  });
}
