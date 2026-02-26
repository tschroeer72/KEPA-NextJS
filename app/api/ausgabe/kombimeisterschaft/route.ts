import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const meisterschaftId = parseInt(searchParams.get("id") || "");

  if (isNaN(meisterschaftId)) {
    return new NextResponse("Meisterschafts-ID fehlt", { status: 400 });
  }

  try {
    const meisterschaft = await prisma.tblMeisterschaften.findUnique({
      where: { ID: meisterschaftId },
      include: { tblMeisterschaftstyp: true },
    });

    if (!meisterschaft) {
      return new NextResponse("Meisterschaft nicht gefunden", { status: 404 });
    }

    const rawResults = await prisma.tblSpielKombimeisterschaft.findMany({
      where: {
        tblSpieltag: {
          MeisterschaftsID: meisterschaftId,
        },
      },
      include: {
        tblMitglieder_SpielerID1: { select: { ID: true, Vorname: true, Nachname: true, Spitzname: true } },
        tblMitglieder_SpielerID2: { select: { ID: true, Vorname: true, Nachname: true, Spitzname: true } },
      },
    });

    if (rawResults.length === 0) {
      return new NextResponse("Keine Ergebnisse für diese Meisterschaft gefunden", { status: 404 });
    }

    // Daten vorbereiten wie im C#-Code
    const teilnehmerMap = new Map<number, { SpielerID: number; SpielerName: string; Punkte3bis8: number; Punkte5Kugeln: number; Gesamtpunkte: number; Platzierung: number }>();

    const getSpielerName = (s: any) => s.Spitzname || s.Vorname;

    rawResults.forEach((item) => {
      // Spieler 1
      if (!teilnehmerMap.has(item.SpielerID1)) {
        teilnehmerMap.set(item.SpielerID1, {
          SpielerID: item.SpielerID1,
          SpielerName: getSpielerName(item.tblMitglieder_SpielerID1),
          Punkte3bis8: item.Spieler1Punkte3bis8,
          Punkte5Kugeln: item.Spieler1Punkte5Kugeln,
          Gesamtpunkte: item.Spieler1Punkte3bis8 + item.Spieler1Punkte5Kugeln,
          Platzierung: 0,
        });
      } else {
        const t = teilnehmerMap.get(item.SpielerID1)!;
        t.Punkte3bis8 += item.Spieler1Punkte3bis8;
        t.Punkte5Kugeln += item.Spieler1Punkte5Kugeln;
        t.Gesamtpunkte += item.Spieler1Punkte3bis8 + item.Spieler1Punkte5Kugeln;
      }

      // Spieler 2
      if (!teilnehmerMap.has(item.SpielerID2)) {
        teilnehmerMap.set(item.SpielerID2, {
          SpielerID: item.SpielerID2,
          SpielerName: getSpielerName(item.tblMitglieder_SpielerID2),
          Punkte3bis8: item.Spieler2Punkte3bis8,
          Punkte5Kugeln: item.Spieler2Punkte5Kugeln,
          Gesamtpunkte: item.Spieler2Punkte3bis8 + item.Spieler2Punkte5Kugeln,
          Platzierung: 0,
        });
      } else {
        const t = teilnehmerMap.get(item.SpielerID2)!;
        t.Punkte3bis8 += item.Spieler2Punkte3bis8;
        t.Punkte5Kugeln += item.Spieler2Punkte5Kugeln;
        t.Gesamtpunkte += item.Spieler2Punkte3bis8 + item.Spieler2Punkte5Kugeln;
      }
    });

    let lstTeilnehmer = Array.from(teilnehmerMap.values());

    // Platzierung ermitteln
    lstTeilnehmer.sort((a, b) => b.Gesamtpunkte - a.Gesamtpunkte);

    let intPlatzierungTemp = 0;
    let intPunkteTemp = -1;
    lstTeilnehmer.forEach((t) => {
      if (intPunkteTemp !== t.Gesamtpunkte) {
        intPlatzierungTemp++;
        intPunkteTemp = t.Gesamtpunkte;
      }
      t.Platzierung = intPlatzierungTemp;
    });

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "cm",
      format: "a4",
    });

    const nLeftMargin = 2;
    const nTopMargin = 2;
    
    doc.setLineWidth(0.01);
    
    // Überschrift
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    const headerWidth = 1.7 + lstTeilnehmer.length * 2.4 + 3 * 0.8;
    doc.text(meisterschaft.Bezeichnung, nLeftMargin + headerWidth / 2, nTopMargin, { align: "center" });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(meisterschaft.tblMeisterschaftstyp.Meisterschaftstyp, nLeftMargin + headerWidth / 2, nTopMargin + 0.8, { align: "center" });

    // Kopfzeile und Namensspalte
    doc.setFontSize(18);
    let x = nLeftMargin;
    let y = nTopMargin + 1.5;
    const jahr = meisterschaft.Beginn.getFullYear().toString();
    
    const drawBox = (x: number, y: number, w: number, h: number, text: string, fontSize?: number, bold = false, align: "left" | "center" | "right" = "center") => {
      doc.rect(x, y, Math.abs(w), Math.abs(h));
      if (fontSize) doc.setFontSize(fontSize);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      
      let textX = x;
      if (align === "center") textX = x + Math.abs(w) / 2;
      if (align === "right") textX = x + Math.abs(w) - 0.1;
      if (align === "left") textX = x + 0.1;
      
      const textY = y + Math.abs(h) / 2 + (fontSize ? fontSize / 40 : 0.2);
      doc.text(text, textX, textY, { align });
    };

    drawBox(x, y, 1.7, 1, jahr, 18);
    
    let xCursor = x + 1.7;
    for (let i = 0; i < lstTeilnehmer.length; i++) {
      drawBox(xCursor, y, 2.4, 0.5, lstTeilnehmer[i].SpielerName, 9);
      drawBox(xCursor, y + 0.5, 0.8, 0.5, "3-8", 10);
      drawBox(xCursor + 0.8, y + 0.5, 0.8, 0.5, "5 K", 10);
      drawBox(xCursor + 1.6, y + 0.5, 0.8, 0.5, "Zus.", 8);
      xCursor += 2.4;
    }

    drawBox(xCursor, y, 0.8, 1, "Tot. Hi. Rü.", 7);
    drawBox(xCursor + 0.8, y, 0.8, 1, "Total", 7);
    drawBox(xCursor + 1.6, y, 0.8, 1, "Platz", 7);

    let yCursor = y + 1;
    for (let i = 0; i < lstTeilnehmer.length; i++) {
      drawBox(x, yCursor, 1.7, 1, lstTeilnehmer[i].SpielerName, 9);
      
      let xInnerCursor = x + 1.7;
      let intSummeHinrunde = 0;
      let intSummeRückrunde = 0;

      for (let j = 0; j < lstTeilnehmer.length; j++) {
        if (lstTeilnehmer[i].SpielerID === lstTeilnehmer[j].SpielerID) {
          // Hinrunde X
          drawBox(xInnerCursor, yCursor, 0.8, 0.5, "X", 10, true);
          drawBox(xInnerCursor + 0.8, yCursor, 0.8, 0.5, "X", 10, true);
          drawBox(xInnerCursor + 1.6, yCursor, 0.8, 0.5, "X", 10, true);
          // Rückrunde X
          drawBox(xInnerCursor, yCursor + 0.5, 0.8, 0.5, "X", 10, true);
          drawBox(xInnerCursor + 0.8, yCursor + 0.5, 0.8, 0.5, "X", 10, true);
          drawBox(xInnerCursor + 1.6, yCursor + 0.5, 0.8, 0.5, "X", 10, true);
        } else {
          const hin = rawResults.find(r => 
            ((r.SpielerID1 === lstTeilnehmer[i].SpielerID && r.SpielerID2 === lstTeilnehmer[j].SpielerID) ||
             (r.SpielerID2 === lstTeilnehmer[i].SpielerID && r.SpielerID1 === lstTeilnehmer[j].SpielerID)) &&
            r.HinRueckrunde === 0
          );
          const rueck = rawResults.find(r => 
            ((r.SpielerID1 === lstTeilnehmer[i].SpielerID && r.SpielerID2 === lstTeilnehmer[j].SpielerID) ||
             (r.SpielerID2 === lstTeilnehmer[i].SpielerID && r.SpielerID1 === lstTeilnehmer[j].SpielerID)) &&
            r.HinRueckrunde === 1
          );

          const getVal = (res: any, sId: number, type: '3bis8' | '5k' | 'sum') => {
            if (!res) return " ";
            const isS1 = res.SpielerID1 === sId;
            if (type === '3bis8') return isS1 ? res.Spieler1Punkte3bis8.toString() : res.Spieler2Punkte3bis8.toString();
            if (type === '5k') return isS1 ? res.Spieler1Punkte5Kugeln.toString() : res.Spieler2Punkte5Kugeln.toString();
            const sum = isS1 ? (res.Spieler1Punkte3bis8 + res.Spieler1Punkte5Kugeln) : (res.Spieler2Punkte3bis8 + res.Spieler2Punkte5Kugeln);
            return sum.toString();
          };

          // Hinrunde
          drawBox(xInnerCursor, yCursor, 0.8, 0.5, getVal(hin, lstTeilnehmer[i].SpielerID, '3bis8'), 10);
          drawBox(xInnerCursor + 0.8, yCursor, 0.8, 0.5, getVal(hin, lstTeilnehmer[i].SpielerID, '5k'), 10);
          const hSum = getVal(hin, lstTeilnehmer[i].SpielerID, 'sum');
          drawBox(xInnerCursor + 1.6, yCursor, 0.8, 0.5, hSum, 10, true);
          if (hSum !== " ") intSummeHinrunde += parseInt(hSum);

          // Rückrunde
          drawBox(xInnerCursor, yCursor + 0.5, 0.8, 0.5, getVal(rueck, lstTeilnehmer[i].SpielerID, '3bis8'), 10);
          drawBox(xInnerCursor + 0.8, yCursor + 0.5, 0.8, 0.5, getVal(rueck, lstTeilnehmer[i].SpielerID, '5k'), 10);
          const rSum = getVal(rueck, lstTeilnehmer[i].SpielerID, 'sum');
          drawBox(xInnerCursor + 1.6, yCursor + 0.5, 0.8, 0.5, rSum, 10, true);
          if (rSum !== " ") intSummeRückrunde += parseInt(rSum);
        }
        xInnerCursor += 2.4;
      }

      drawBox(xInnerCursor, yCursor, 0.8, 0.5, intSummeHinrunde.toString(), 8, true);
      drawBox(xInnerCursor, yCursor + 0.5, 0.8, 0.5, intSummeRückrunde.toString(), 8, true);
      
      drawBox(xInnerCursor + 0.8, yCursor, 0.8, 1, (intSummeHinrunde + intSummeRückrunde).toString(), 8, true);
      
      let platzFontSize = 8;
      if (lstTeilnehmer[i].Platzierung === 1) platzFontSize = 18;
      else if (lstTeilnehmer[i].Platzierung === 2) platzFontSize = 15;
      else if (lstTeilnehmer[i].Platzierung === 3) platzFontSize = 12;
      
      drawBox(xInnerCursor + 1.6, yCursor, 0.8, 1, lstTeilnehmer[i].Platzierung.toString(), platzFontSize, true);

      yCursor += 1;
    }

    drawBox(x, yCursor, 1.7, 0.5, "Tot. Hi. Rü.", 7, true);
    let xBottomCursor = x + 1.7;
    for (let i = 0; i < lstTeilnehmer.length; i++) {
      drawBox(xBottomCursor, yCursor, 0.8, 0.5, lstTeilnehmer[i].Punkte3bis8.toString(), 10, true);
      drawBox(xBottomCursor + 0.8, yCursor, 0.8, 0.5, lstTeilnehmer[i].Punkte5Kugeln.toString(), 10, true);
      drawBox(xBottomCursor + 1.6, yCursor, 0.8, 0.5, "", 8);
      xBottomCursor += 2.4;
    }

    const pdfBuffer = doc.output("arraybuffer");
    const sanitizedBezeichnung = meisterschaft.Bezeichnung.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Ergebnis_${sanitizedBezeichnung}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Fehler bei der PDF-Erstellung", { status: 500 });
  }
}
