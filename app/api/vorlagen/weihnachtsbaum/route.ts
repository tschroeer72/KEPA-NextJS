import { NextRequest, NextResponse } from "next/server";
import { VpeToJsPdf, TextAlignment, PenStyle } from "@/utils/vpe-to-jspdf";

export async function GET(req: NextRequest) {
  const vpe = new VpeToJsPdf("p");
  const cm = vpe.cm;

  try {
    // Da wir kein lokales Bild haben, simulieren wir das Layout
    // In einer echten Umgebung müssten wir das Bild laden und als Base64 einbetten
    
    // Platzhalter für Bild
    vpe.doc.rect(0.2 * cm, 0.2 * cm, 18 * cm, 25 * cm); 
    vpe.doc.text("Weihnachtsbaumkegeln Bild", 10 * cm, 10 * cm, { align: "center" });

    vpe.selectFont("helvetica", 20);
    vpe.write(9, 2, 4, 1.5, "Name:");

    vpe.penStyle = PenStyle.Solid;
    vpe.penSize = 0.2;

    // Tabellenkopf
    let rectLinksX = 17, rectLinksY = 4, rectWidth = 1.3, rectHeight = 1.1;
    vpe.box(rectLinksX, rectLinksY, rectWidth, rectHeight);
    vpe.selectFont("helvetica", 10);
    vpe.write(rectLinksX, rectLinksY, rectWidth, rectHeight, "Wert je Wurf");

    vpe.box(rectLinksX + rectWidth, rectLinksY, rectWidth, rectHeight);
    vpe.write(rectLinksX + rectWidth, rectLinksY, rectWidth, rectHeight, "Wert je Reihe");

    const werte = ["10", "7", "4", "3", "2", "5", "8"];
    rectLinksY += rectHeight;
    rectHeight = 2.5;

    werte.forEach(wert => {
        vpe.box(rectLinksX, rectLinksY, rectWidth, rectHeight);
        vpe.selectFont("helvetica", 20);
        vpe.write(rectLinksX, rectLinksY, rectWidth, rectHeight, wert);

        vpe.box(rectLinksX + rectWidth, rectLinksY, rectWidth, rectHeight);
        rectLinksY += rectHeight;
    });

    vpe.penStyle = PenStyle.Dash;
    vpe.line(9.5, 5, 16.8, 5.5);
    vpe.line(10.8, 8.5, 16.8, 8);
    vpe.line(12.5, 10.6, 16.8, 10.5);
    vpe.line(12.2, 13.4, 16.8, 12.9);
    vpe.line(15.8, 15.4, 16.8, 15.4);
    vpe.line(15.6, 19, 16.8, 18);
    vpe.line(12.5, 21.4, 16.8, 20.5);

    vpe.selectFont("helvetica", 20);
    vpe.write(16, 24, 4, 1.5, "Gesamt:");

    vpe.penStyle = PenStyle.Solid;
    vpe.doc.ellipse(18 * cm, 27 * cm, 1.5 * cm, 1.5 * cm); // x, y sind Zentrum bei ellipse() in jsPDF

    const pdfOutput = vpe.getOutput();
    return new NextResponse(pdfOutput as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=Weihnachtsbaum.pdf",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Fehler bei PDF Erstellung" }, { status: 500 });
  }
}
