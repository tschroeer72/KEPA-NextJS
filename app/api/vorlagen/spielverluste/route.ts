import { NextRequest, NextResponse } from "next/server";
import { VpeToJsPdf, TextAlignment, PenStyle } from "@/utils/vpe-to-jspdf";

export async function GET(req: NextRequest) {
  const vpe = new VpeToJsPdf("l");
  vpe.setMargins(2, 2, 2, 2);

  // Trennlinie
  vpe.penStyle = PenStyle.DashDotDot;
  vpe.line((vpe.nLeftMargin + vpe.nRightMargin) / 2, vpe.nTopMargin, (vpe.nLeftMargin + vpe.nRightMargin) / 2, vpe.nBottomMargin);
  vpe.penStyle = PenStyle.Solid;

  const drawHalf = (leftOffset: number) => {
    vpe.selectFont("helvetica", 12);
    vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
    vpe.write(vpe.nLeftMargin + leftOffset, vpe.nTopMargin, -11.5, -0.5, "Spielverluste");

    vpe.selectFont("helvetica", 10);
    vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
    vpe.write(vpe.nLeftMargin + leftOffset, vpe.nBottom, -11.5, -0.5, "vom");
    vpe.penStyle = PenStyle.Dash;
    vpe.box(vpe.nLeftMargin + leftOffset + (11.5) / 2 - 2, vpe.nBottom, -4, -1);
    vpe.penStyle = PenStyle.Solid;

    vpe.setFontAttr(TextAlignment.Left, false, false, false, false);
    vpe.write(vpe.nLeftMargin + leftOffset, vpe.nBottom + 1, -2.5, -0.8, "Name");
    vpe.storePos();
    vpe.line(vpe.nLeftMargin + leftOffset, vpe.nBottom + 0.1, vpe.nLeftMargin + leftOffset + 11.5, vpe.nBottom + 0.1);
    vpe.restorePos();
    vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottomMargin);

    const cols = ["6 Tg. R.", "Neun", "Kranz 8", "Ratten", "Sarg"];
    cols.forEach(col => {
        vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
        vpe.write(vpe.nRight, vpe.nTop, -1.5, -1, col);
        vpe.line(vpe.nRight, vpe.nTop, vpe.nRight, vpe.nBottomMargin);
    });

    for(let i=1; i<=14; i++) {
        vpe.line(vpe.nLeftMargin + leftOffset, vpe.nTop + 1, vpe.nLeftMargin + leftOffset + 11.5, vpe.nTop + 1);
    }
  };

  drawHalf(0);
  drawHalf((vpe.nLeftMargin + vpe.nRightMargin) / 2);

  const pdfOutput = vpe.getOutput();
  return new NextResponse(pdfOutput as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=Spielverluste.pdf",
    },
  });
}
