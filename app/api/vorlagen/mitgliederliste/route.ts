import { NextRequest, NextResponse } from "next/server";
import { VpeToJsPdf, TextAlignment } from "@/utils/vpe-to-jspdf";
import { getAktiveMitglieder, getAlleMitglieder } from "@/app/actions/db/mitglieder/actions";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const aktiv = searchParams.get("aktiv") !== "false";
  
  const result = aktiv ? await getAktiveMitglieder() : await getAlleMitglieder();
  
  if (!result.success || !result.data) {
    return NextResponse.json({ error: "Fehler beim Laden der Mitglieder" }, { status: 500 });
  }

  const lstListe = result.data;
  const vpe = new VpeToJsPdf("p");
  vpe.setMargins(2, 2, 2, 2);

  const drawHeader = () => {
    vpe.selectFont("helvetica", 12);
    vpe.setFontAttr(TextAlignment.Center, true, false, false, false);
    vpe.writeBox(vpe.nLeftMargin, vpe.nTopMargin, -17, 0.8, "KEPA 1958");
    
    const strHeader2 = aktiv ? "Mitgliederliste (aktive Kegler)" : "Mitgliederliste";
    vpe.writeBox(vpe.nLeftMargin, vpe.nBottom, -13, 0.8, strHeader2);

    vpe.selectFont("helvetica", 10);
    vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
    vpe.writeBox(vpe.nRight, vpe.nTop, -2, 0.8, "Stand:");
    vpe.writeBox(vpe.nRight, vpe.nTop, -2, 0.8, new Date().toLocaleDateString("de-DE"));

    vpe.selectFont("helvetica", 8);
    vpe.setFontAttr(TextAlignment.Center, true, false, false, false);
    const colWidths = [-2.5, -2.5, -2, -3, -3, -2, -2];
    const colTitles = ["Name", "Vorname", "Geb.", "Anschrift", "E-Mail", "Tel-/Handy", "Ein-/Austritt"];
    
    let currentX = vpe.nLeftMargin;
    colTitles.forEach((title, i) => {
        vpe.writeBox(currentX, vpe.nBottom, colWidths[i], -0.6, title);
        currentX = vpe.nRight;
    });
  };

  drawHeader();

  vpe.selectFont("helvetica", 6);
  vpe.setFontAttr(TextAlignment.Center, false, false, false, false);

  lstListe.forEach((item: any) => {
    // Einfache Seitenumbruch-Logik
    if (vpe.nBottom > 25) {
        vpe.pageBreak();
        drawHeader();
        vpe.selectFont("helvetica", 6);
        vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
    }

    const startY = vpe.nBottom;
    vpe.writeBox(vpe.nLeftMargin, startY, -2.5, -0.6, item.Nachname);
    vpe.writeBox(vpe.nRight, startY, -2.5, -0.6, item.Vorname);
    vpe.writeBox(vpe.nRight, startY, -2, -0.6, item.Geburtsdatum ? new Date(item.Geburtsdatum).toLocaleDateString("de-DE") : "");
    
    // Anschrift
    vpe.writeBox(vpe.nRight, startY, -3, -0.3, item.Strasse);
    vpe.writeBox(vpe.nLeft, vpe.nBottom, -3, -0.3, `${item.PLZ} ${item.Ort}`);
    
    // E-Mail
    vpe.writeBox(vpe.nRight, startY, -3, -0.6, item.EMail || "");
    
    // Telefon
    vpe.writeBox(vpe.nRight, startY, -2, -0.3, item.TelefonPrivat || "");
    vpe.writeBox(vpe.nLeft, vpe.nBottom, -2, -0.3, item.TelefonMobil || "");

    // Eintritt
    vpe.writeBox(vpe.nRight, startY, -2, -0.3, item.MitgliedSeit ? new Date(item.MitgliedSeit).toLocaleDateString("de-DE") : "");
    vpe.writeBox(vpe.nLeft, vpe.nBottom, -2, -0.3, item.AusgeschiedenAm ? new Date(item.AusgeschiedenAm).toLocaleDateString("de-DE") : "");
    
    vpe.nBottom = startY + 0.6; // Setze nBottom für die nächste Zeile
  });

  const pdfOutput = vpe.getOutput();
  return new NextResponse(pdfOutput as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Mitgliederliste.pdf`,
    },
  });
}
