import { NextRequest, NextResponse } from "next/server";
import { VpeToJsPdf, TextAlignment, PenStyle } from "@/utils/vpe-to-jspdf";

export async function GET(req: NextRequest) {
  const vpe = new VpeToJsPdf("p");
  vpe.penStyle = PenStyle.Solid;
  vpe.setMargins(1, 1, 1, 1);

  // Überschrift
  vpe.selectFont("helvetica", 18);
  vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
  vpe.write(vpe.nLeftMargin, vpe.nTopMargin, vpe.nRightMargin, -2, "Kombimeisterschaft");

  // Spielplan
  for (let j = 0; j < 4; j++) {
    for (let i = 0; i < 2; i++) {
      vpe.selectFont("helvetica", 12);
      vpe.setFontAttr(TextAlignment.Left, false, false, false, false);
      const x = 2 + (10 * i);
      const y = 4 + (6 * j);
      vpe.write(x, y + 0.3, -3, -1, "Name");
      vpe.penStyle = PenStyle.Solid;
      vpe.box(x + 3, y, -4, -1);
      vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
      vpe.write(x + 3, vpe.nBottom + 0.2, -2, -0.6, "3 bis 8");
      vpe.write(vpe.nRight, vpe.nTop, -2, -0.6, "5 Kugeln");
      vpe.setFontAttr(TextAlignment.Left, false, false, false, false);
      vpe.write(x, vpe.nBottom, -3, -0.5, "Gesamtpunkte");
      vpe.box(x + 3, vpe.nTop, -2, -0.5);
      vpe.box(vpe.nRight, vpe.nTop, -2, -0.5);
      vpe.write(x, vpe.nBottom + 0.2, -3, -1, "Abhaken");
      vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
      vpe.write(vpe.nRight, vpe.nTop, -2, -0.5, "3");
      for (let k = 4; k <= 8; k++) {
        vpe.write(vpe.nLeft, vpe.nBottom, -2, -0.5, k.toString());
      }
    }

    if (j < 3) {
      vpe.penStyle = PenStyle.DashDot;
      vpe.line(vpe.nLeftMargin, vpe.nBottom + 0.2, vpe.nRightMargin, vpe.nBottom + 0.2);
    }
  }

  const pdfOutput = vpe.getOutput();

  return new NextResponse(pdfOutput as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=Kombimeisterschaft.pdf",
    },
  });
}
