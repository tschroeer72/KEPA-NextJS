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

    const rawResults = await prisma.tblSpielBlitztunier.findMany({
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
    const teilnehmerMap = new Map<number, { SpielerID: number; SpielerName: string; Punkte: number; Gesamtpunkte: number; Platzierung: number }>();

    const getSpielerName = (s: any) => s.Spitzname || s.Vorname;

    rawResults.forEach((item) => {
      // Spieler 1
      if (!teilnehmerMap.has(item.SpielerID1)) {
        teilnehmerMap.set(item.SpielerID1, {
          SpielerID: item.SpielerID1,
          SpielerName: getSpielerName(item.tblMitglieder_SpielerID1),
          Punkte: item.PunkteSpieler1,
          Gesamtpunkte: item.PunkteSpieler1,
          Platzierung: 0,
        });
      } else {
        const t = teilnehmerMap.get(item.SpielerID1)!;
        t.Punkte += item.PunkteSpieler1;
        t.Gesamtpunkte += item.PunkteSpieler1;
      }

      // Spieler 2
      if (!teilnehmerMap.has(item.SpielerID2)) {
        teilnehmerMap.set(item.SpielerID2, {
          SpielerID: item.SpielerID2,
          SpielerName: getSpielerName(item.tblMitglieder_SpielerID2),
          Punkte: item.PunkteSpieler2,
          Gesamtpunkte: item.PunkteSpieler2,
          Platzierung: 0,
        });
      } else {
        const t = teilnehmerMap.get(item.SpielerID2)!;
        t.Punkte += item.PunkteSpieler2;
        t.Gesamtpunkte += item.PunkteSpieler2;
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

    // Zurück-Sortieren für die Kreuztabelle (meistens alphabetisch oder nach ID im C# Code scheint es die Reihenfolge der Teilnehmer zu sein)
    // Im C# Code wird lstTeilnehmer direkt verwendet nachdem die Platzierung berechnet wurde.
    // Die Kreuztabelle wird in der Reihenfolge von lstTeilnehmer aufgebaut.

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
    
    // drawBox helper
    const drawBox = (x: number, y: number, w: number, h: number, text: string, fontSize?: number, bold = false, align: "left" | "center" | "right" = "center") => {
      doc.rect(x, y, Math.abs(w), Math.abs(h));
      if (fontSize) doc.setFontSize(fontSize);
      doc.setFont("helvetica", bold ? "bold" : "normal");
      
      let textX = x;
      if (align === "center") textX = x + Math.abs(w) / 2;
      if (align === "right") textX = x + Math.abs(w) - 0.1;
      if (align === "left") textX = x + 0.1;
      
      const textY = y + Math.abs(h) / 2 + (fontSize ? fontSize / 40 : 0.2); // Rough vertical centering
      doc.text(text, textX, textY, { align });
    };

    drawBox(x, y, 1.7, 1, jahr, 18);
    
    let xCursor = x + 1.7;
    for (let i = 0; i < lstTeilnehmer.length; i++) {
      drawBox(xCursor, y, 2.4, 0.5, lstTeilnehmer[i].SpielerName, 9);
      drawBox(xCursor, y + 0.5, 2.4, 0.5, "Punkte", 10);
      xCursor += 2.4;
    }

    drawBox(xCursor, y, 0.8, 1, "Tot. Hi. Rü.", 7);
    drawBox(xCursor + 0.8, y, 0.8, 1, "Total", 7);
    drawBox(xCursor + 1.6, y, 0.8, 1, "Platz", 7);

    let yCursor = y + 1;
    for (let i = 0; i < lstTeilnehmer.length; i++) {
      drawBox(x, yCursor, 1.7, 1, lstTeilnehmer[i].SpielerName, 9);
      
      let xInnerCursor = x + 1.7;
      for (let j = 0; j < lstTeilnehmer.length; j++) {
        if (lstTeilnehmer[i].SpielerID === lstTeilnehmer[j].SpielerID) {
          drawBox(xInnerCursor, yCursor, 2.4, 0.5, "XXX", 10, true);
          drawBox(xInnerCursor, yCursor + 0.5, 2.4, 0.5, "XXX", 10, true);
        } else {
          const hin = rawResults.find(r => 
            ((r.SpielerID1 === lstTeilnehmer[i].SpielerID && r.SpielerID2 === lstTeilnehmer[j].SpielerID) ||
             (r.SpielerID2 === lstTeilnehmer[i].SpielerID && r.SpielerID1 === lstTeilnehmer[j].SpielerID)) &&
            r.HinR_ckrunde === 0
          );
          const rueck = rawResults.find(r => 
            ((r.SpielerID1 === lstTeilnehmer[i].SpielerID && r.SpielerID2 === lstTeilnehmer[j].SpielerID) ||
             (r.SpielerID2 === lstTeilnehmer[i].SpielerID && r.SpielerID1 === lstTeilnehmer[j].SpielerID)) &&
            r.HinR_ckrunde === 1
          );

          const getPunkte = (res: any, sId: number) => {
            if (!res) return " ";
            return res.SpielerID1 === sId ? res.PunkteSpieler1.toString() : res.PunkteSpieler2.toString();
          };

          drawBox(xInnerCursor, yCursor, 2.4, 0.5, getPunkte(hin, lstTeilnehmer[i].SpielerID), 10);
          drawBox(xInnerCursor, yCursor + 0.5, 2.4, 0.5, getPunkte(rueck, lstTeilnehmer[i].SpielerID), 10);
        }
        xInnerCursor += 2.4;
      }

      // Summen-Spalten (im C#-Code scheint hier noch Logik für intSummeHinrunde etc. zu sein, aber sie werden dort auf 0 initialisiert und nicht wirklich hochgezählt im loop?)
      // Ah, doch, im Kombimeisterschafts-Code werden sie hochgezählt. Im Kurztunier/Meisterschafts-Code scheinen sie leer zu bleiben oder die Platzierung wird dort ausgegeben.
      // C# Logik Kurztunier:
      // strText = intSummeHinrunde.ToString(); vpe.WriteBox(vpe.nRight, vpe.nTop - 0.5, -0.8, -0.5, strText);
      // Aber intSummeHinrunde wird am Anfang der Zeile auf 0 gesetzt und im Spalten-Loop NICHT verändert.
      // Ich berechne sie hier trotzdem mal korrekt falls gewünscht, aber bleibe nah am C# Code.
      
      let sumHin = 0;
      let sumRueck = 0;
      rawResults.forEach(r => {
        if (r.SpielerID1 === lstTeilnehmer[i].SpielerID) {
          if (r.HinR_ckrunde === 0) sumHin += r.PunkteSpieler1;
          else sumRueck += r.PunkteSpieler1;
        } else if (r.SpielerID2 === lstTeilnehmer[i].SpielerID) {
          if (r.HinR_ckrunde === 0) sumHin += r.PunkteSpieler2;
          else sumRueck += r.PunkteSpieler2;
        }
      });

      drawBox(xInnerCursor, yCursor, 0.8, 0.5, sumHin.toString(), 8, true);
      drawBox(xInnerCursor, yCursor + 0.5, 0.8, 0.5, sumRueck.toString(), 8, true);
      
      drawBox(xInnerCursor + 0.8, yCursor, 0.8, 1, (sumHin + sumRueck).toString(), 8, true);
      
      let platzFontSize = 8;
      if (lstTeilnehmer[i].Platzierung === 1) platzFontSize = 18;
      else if (lstTeilnehmer[i].Platzierung === 2) platzFontSize = 15;
      else if (lstTeilnehmer[i].Platzierung === 3) platzFontSize = 12;
      
      drawBox(xInnerCursor + 1.6, yCursor, 0.8, 1, lstTeilnehmer[i].Platzierung.toString(), platzFontSize, true);

      yCursor += 1;
    }

    // Unterste Zeile: Gesamtpunkte pro Spieler
    drawBox(x, yCursor, 1.7, 0.5, "Tot. Hi. Rü.", 7, true);
    let xBottomCursor = x + 1.7;
    for (let i = 0; i < lstTeilnehmer.length; i++) {
      drawBox(xBottomCursor, yCursor, 2.4, 0.5, lstTeilnehmer[i].Punkte.toString(), 10, true);
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
