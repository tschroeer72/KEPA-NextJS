import { NextRequest, NextResponse } from "next/server";
import { VpeToJsPdf, TextAlignment, PenStyle } from "@/utils/vpe-to-jspdf";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const vpe = new VpeToJsPdf("p");
  const cm = vpe.cm;

  try {
    const variant = req.nextUrl.searchParams.get("variant") || "1";
    
    // Bild einladen
    const imageName = variant === "2" ? "Weihnachtsbaumkegeln2.jpg" : "Weihnachtsbaumkegeln.jpg";
    const imagePath = path.join(process.cwd(), "public", "vorlagen", imageName);
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`;

    // Bild einfügen
    vpe.image(0.2, 0.2, 18.2, 25.2, imageBase64, "JPEG");

    if (variant === "2") {
      const pdfOutput = vpe.getOutput();
      return new NextResponse(pdfOutput as any, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": "attachment; filename=Weihnachtsbaum.pdf",
        },
      });
    }

    vpe.selectFont("helvetica", 20);
    vpe.write(9, 2, 4, 1.5, "Name:");

    vpe.penStyle = PenStyle.Solid;
    vpe.penSize = 0.2;

    // Tabellenkopf
    let rectLinksX = 17, rectLinksY = 4, rectWidth = 1.3, rectHeight = 1.1;
    vpe.box(rectLinksX, rectLinksY, -rectWidth, -rectHeight);
    vpe.selectFont("helvetica", 10);
    vpe.write(rectLinksX, rectLinksY, -rectWidth, -rectHeight, "Wert je Wurf");

    vpe.box(rectLinksX + rectWidth, rectLinksY, -rectWidth, -rectHeight);
    vpe.write(rectLinksX + rectWidth, rectLinksY, -rectWidth, -rectHeight, "Wert je Reihe");

    const werte = ["10", "7", "4", "3", "2", "5", "8"];
    rectLinksY += rectHeight;
    rectHeight = 2.5;

    werte.forEach(wert => {
      vpe.box(rectLinksX, rectLinksY, -rectWidth, -rectHeight);
      vpe.selectFont("helvetica", 20);
      vpe.write(rectLinksX, rectLinksY, -rectWidth, -rectHeight, wert);

      vpe.box(rectLinksX + rectWidth, rectLinksY, -rectWidth, -rectHeight);
      rectLinksY += rectHeight;
    });

    vpe.penStyle = PenStyle.Dash;
    vpe.line(9.5, 4.5, 16.8, 6);
    vpe.line(10.8, 7.3, 16.8, 8.5);
    vpe.line(12.5, 9.6, 16.8, 10.8);
    vpe.line(13.2, 11.8, 16.8, 13.3);
    vpe.line(13.8, 13.4, 16.8, 15.4);
    vpe.line(13.6, 17, 16.8, 18.5);
    vpe.line(12.5, 18.8, 16.8, 20.8);

    vpe.selectFont("helvetica", 20);
    vpe.write(16, 24, -4, -1.5, "Gesamt:");

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
