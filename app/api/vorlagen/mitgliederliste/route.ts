import { NextRequest, NextResponse } from "next/server";
import { VpeToJsPdf, TextAlignment } from "@/utils/vpe-to-jspdf";
import { getAktiveMitglieder, getAlleMitglieder } from "@/app/actions/verwaltung/mitglieder/actions";

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
    const strHeader2 = aktiv ? "Mitgliederliste (aktive Kegler)" : "Mitgliederliste";

    //Zeile 1
    vpe.selectFont("helvetica", 12);
    vpe.setFontAttr(TextAlignment.Center, true, false, false, false);
    vpe.writeBox(vpe.nLeftMargin, vpe.nTopMargin, -17, -0.8, "KEPA 1958");

    //Zeile 2
    vpe.selectFont("helvetica", 12);
    vpe.setFontAttr(TextAlignment.Center, true, false, false, false);
    vpe.writeBox(vpe.nLeftMargin, vpe.nBottom, -13, -0.8, strHeader2);

    vpe.selectFont("helvetica", 10);
    vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
    vpe.writeBox(vpe.nRight, vpe.nTop, -2, -0.8, "Stand:");
    vpe.writeBox(vpe.nRight, vpe.nTop, -2, -0.8, new Date().toLocaleDateString("de-DE"));

    //Zeile 3
    vpe.selectFont("helvetica", 8);
    vpe.setFontAttr(TextAlignment.Center, true, false, false, false);
    vpe.writeBox(vpe.nLeftMargin, vpe.nBottom, -2.5, -0.6, "Name");
    vpe.writeBox(vpe.nRight, vpe.nTop, -2.5, -0.6, "Vorname");
    vpe.writeBox(vpe.nRight, vpe.nTop, -2, -0.6, "Geb.");
    vpe.writeBox(vpe.nRight, vpe.nTop, -3, -0.6, "Anschrift");
    vpe.writeBox(vpe.nRight, vpe.nTop, -3, -0.6, "E-Mail");
    vpe.writeBox(vpe.nRight, vpe.nTop, -2, -0.6, "Tel-/Handy");
    vpe.writeBox(vpe.nRight, vpe.nTop, -2, -0.6, "Ein-/Austritt");
  };

  drawHeader();

  vpe.selectFont("helvetica", 6);
  vpe.setFontAttr(TextAlignment.Center, false, false, false, false);

  lstListe.forEach((item: any) => {
    if (vpe.nBottomMargin - vpe.nBottom < 2) {
      vpe.pageBreak();
      drawHeader();
      vpe.selectFont("helvetica", 6);
      vpe.setFontAttr(TextAlignment.Center, false, false, false, false);
    }

    const startY = vpe.nBottom;
    vpe.writeBox(vpe.nLeftMargin, startY, -2.5, -0.6, item.Nachname || "");
    vpe.writeBox(vpe.nRight, vpe.nTop, -2.5, -0.6, item.Vorname || "");
    vpe.writeBox(vpe.nRight, vpe.nTop, -2, -0.6, item.Geburtsdatum ? new Date(item.Geburtsdatum).toLocaleDateString("de-DE") : "");
    
    // Anschrift (Straße oben, PLZ Ort unten)
    vpe.box(vpe.nRight, vpe.nTop, -3, -0.6);
    vpe.write(vpe.nLeft, vpe.nTop, -3, -0.3, item.Strasse || "");
    const strPLZOrt = (item.PLZ || "") + " " + (item.Ort || "");
    vpe.write(vpe.nLeft, vpe.nBottom, -3, -0.3, strPLZOrt);
    
    // E-Mail
    const email = item.EMail || "";
    const emailWidth = vpe.doc.getTextWidth(email) / vpe.cm;
    vpe.box(vpe.nRight, vpe.nTop - 0.3, -3, -0.6);
    if (emailWidth > 3 && email.includes("@")) {
      vpe.storePos();
      const [user, domain] = email.split("@");
      vpe.write(vpe.nLeft, vpe.nTop, -3, -0.3, user + "@");
      vpe.write(vpe.nLeft, vpe.nBottom, -3, -0.3, domain);
      vpe.restorePos();
    } else {
      vpe.write(vpe.nLeft, vpe.nTop, -3, -0.6, email);
    }
    
    // Telefon (Privat oben, Mobil unten)
    vpe.box(vpe.nRight, vpe.nTop, -2, -0.6);
    vpe.write(vpe.nLeft, vpe.nTop, -2, -0.3, item.TelefonPrivat || "");
    vpe.write(vpe.nLeft, vpe.nBottom, -2, -0.3, item.TelefonMobil || "");

    // Ein-/Austritt (Eintritt oben, Austritt unten)
    vpe.box(vpe.nRight, vpe.nTop - 0.3, -2, -0.6);
    vpe.write(vpe.nLeft, vpe.nTop, -2, -0.3, item.MitgliedSeit ? new Date(item.MitgliedSeit).toLocaleDateString("de-DE") : "");
    const strAustritt = item.AusgeschiedenAm ? new Date(item.AusgeschiedenAm).toLocaleDateString("de-DE") : "";
    vpe.write(vpe.nLeft, vpe.nBottom, -2, -0.3, strAustritt);
  });

  const pdfOutput = vpe.getOutput();
  return new NextResponse(pdfOutput as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Mitgliederliste.pdf`,
    },
  });
}
