import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const meisterschaftId = parseInt(searchParams.get("id") || "");
  const showSpielergebnisse = searchParams.get("spielergebnisse") === "true";
  const showTabelle = searchParams.get("tabelle") === "true";
  const showKreuztabelle = searchParams.get("kreuztabelle") === "true";

  if (isNaN(meisterschaftId)) {
    return new NextResponse("Meisterschafts-ID fehlt", { status: 400 });
  }

  try {
    const meisterschaft = await prisma.tblMeisterschaften.findUnique({
      where: { ID: meisterschaftId },
      include: { 
        tblMeisterschaftstyp: true,
        tblTeilnehmer: {
          select: {
            SpielerID: true,
            NurHinrunde: true,
            tblMitglieder: {
              select: {
                Vorname: true,
                Nachname: true,
                Spitzname: true
              }
            }
          }
        },
        tblSpieltag: {
          orderBy: { Spieltag: "asc" },
          include: {
            tblSpielKombimeisterschaft: {
              include: {
                tblMitglieder_SpielerID1: true,
                tblMitglieder_SpielerID2: true,
              }
            },
            tblSpiel6TageRennen: true,
            tblSpielSargKegeln: true,
            tblSpielPokal: true,
            tbl9erRatten: true,
          }
        }
      },
    });

    if (!meisterschaft) {
      return new NextResponse("Meisterschaft nicht gefunden", { status: 404 });
    }

    const allResults = await prisma.tblSpielKombimeisterschaft.findMany({
      where: {
        tblSpieltag: {
          MeisterschaftsID: meisterschaftId,
        },
      },
      include: {
        tblMitglieder_SpielerID1: { select: { ID: true, Vorname: true, Nachname: true, Spitzname: true } },
        tblMitglieder_SpielerID2: { select: { ID: true, Vorname: true, Nachname: true, Spitzname: true } },
        tblSpieltag: { select: { Spieltag: true } },
      },
    });

    if (allResults.length === 0) {
      return new NextResponse("Keine Ergebnisse für diese Meisterschaft gefunden", { status: 404 });
    }

    // Dubletten nach ID entfernen
    const rawResults = Array.from(new Map(allResults.map(r => [r.ID, r])).values());

    // Letztes Spieldatum ermitteln
    const lastDate = rawResults.reduce((max, curr) => {
      const currDate = curr.tblSpieltag.Spieltag;
      return currDate > max ? currDate : max;
    }, rawResults[0].tblSpieltag.Spieltag);

    const formattedDate = lastDate.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Daten vorbereiten
    const teilnehmerMap = new Map<number, { 
      SpielerID: number; 
      SpielerName: string; 
      Vorname: string;
      Nachname: string;
      Punkte3bis8: number; 
      Punkte5Kugeln: number; 
      Gesamtpunkte: number; 
      Platzierung: number; 
      NurHinrunde: boolean;
    }>();

    const getSpielerName = (s: any) => s.Spitzname || s.Vorname;

    const getNurHinrunde = (spielerId: number) => {
      const teilnehmer = meisterschaft.tblTeilnehmer.find(t => t.SpielerID === spielerId);
      return teilnehmer?.NurHinrunde || false;
    };

    rawResults.forEach((item) => {
      const s1NurHinrunde = getNurHinrunde(item.SpielerID1);
      const s2NurHinrunde = getNurHinrunde(item.SpielerID2);
      
      // Wertung: Falls einer NurHinrunde ist, zählen die Punkte nur für die Kreuztabelle/Statistik? 
      // In meisterschaft/route.ts war isWertungsSpiel = !s1NurHinrunde && !s2NurHinrunde.
      // Aber hier sind es Punkte aus einem Kombispiel. Wir übernehmen die Logik:
      const isWertungsSpiel = !s1NurHinrunde && !s2NurHinrunde;

      // Spieler 1
      if (!teilnehmerMap.has(item.SpielerID1)) {
        const p38 = item.Spieler1Punkte3bis8;
        const p5k = item.Spieler1Punkte5Kugeln;
        teilnehmerMap.set(item.SpielerID1, {
          SpielerID: item.SpielerID1,
          SpielerName: getSpielerName(item.tblMitglieder_SpielerID1),
          Vorname: item.tblMitglieder_SpielerID1.Vorname,
          Nachname: item.tblMitglieder_SpielerID1.Nachname,
          Punkte3bis8: isWertungsSpiel ? p38 : 0,
          Punkte5Kugeln: isWertungsSpiel ? p5k : 0,
          Gesamtpunkte: isWertungsSpiel ? (p38 + p5k) : 0,
          Platzierung: 0,
          NurHinrunde: s1NurHinrunde,
        });
      } else {
        const t = teilnehmerMap.get(item.SpielerID1)!;
        if (isWertungsSpiel) {
          t.Punkte3bis8 += item.Spieler1Punkte3bis8;
          t.Punkte5Kugeln += item.Spieler1Punkte5Kugeln;
          t.Gesamtpunkte += (item.Spieler1Punkte3bis8 + item.Spieler1Punkte5Kugeln);
        }
      }

      // Spieler 2
      if (!teilnehmerMap.has(item.SpielerID2)) {
        const p38 = item.Spieler2Punkte3bis8;
        const p5k = item.Spieler2Punkte5Kugeln;
        teilnehmerMap.set(item.SpielerID2, {
          SpielerID: item.SpielerID2,
          SpielerName: getSpielerName(item.tblMitglieder_SpielerID2),
          Vorname: item.tblMitglieder_SpielerID2.Vorname,
          Nachname: item.tblMitglieder_SpielerID2.Nachname,
          Punkte3bis8: isWertungsSpiel ? p38 : 0,
          Punkte5Kugeln: isWertungsSpiel ? p5k : 0,
          Gesamtpunkte: isWertungsSpiel ? (p38 + p5k) : 0,
          Platzierung: 0,
          NurHinrunde: s2NurHinrunde,
        });
      } else {
        const t = teilnehmerMap.get(item.SpielerID2)!;
        if (isWertungsSpiel) {
          t.Punkte3bis8 += item.Spieler2Punkte3bis8;
          t.Punkte5Kugeln += item.Spieler2Punkte5Kugeln;
          t.Gesamtpunkte += (item.Spieler2Punkte3bis8 + item.Spieler2Punkte5Kugeln);
        }
      }
    });

    let lstTeilnehmer = Array.from(teilnehmerMap.values());

    // Platzierung ermitteln
    lstTeilnehmer.sort((a, b) => b.Gesamtpunkte - a.Gesamtpunkte);

    let intPlatzierungTemp = 0;
    let intPunkteTemp = -1;
    lstTeilnehmer.forEach((t) => {
      if (!t.NurHinrunde) {
        if (intPunkteTemp !== t.Gesamtpunkte) {
          intPlatzierungTemp++;
          intPunkteTemp = t.Gesamtpunkte;
        }
        t.Platzierung = intPlatzierungTemp;
      }
    });

    // Platzierung für NurHinrunde Spieler ermitteln
    lstTeilnehmer.forEach((t) => {
      if (t.NurHinrunde) {
        let platzierung = 1;
        for (const tAndere of lstTeilnehmer) {
          if (tAndere.Gesamtpunkte > t.Gesamtpunkte) {
            platzierung++;
          }
        }
        t.Platzierung = platzierung;
      }
    });

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "cm",
      format: "a4",
    });

    doc.setLineWidth(0.01);

    let firstPage = true;

    const nLeftMargin = 2;
    const nTopMargin = 2;

    const drawBox = (x: number, y: number, w: number, h: number, text: string, fontSize?: number, bold = false, align: "left" | "center" | "right" = "center", italic = false) => {
      doc.rect(x, y, Math.abs(w), Math.abs(h));
      if (fontSize) doc.setFontSize(fontSize);
      
      let fontStyle = "normal";
      if (bold && italic) fontStyle = "bolditalic";
      else if (bold) fontStyle = "bold";
      else if (italic) fontStyle = "italic";
      
      doc.setFont("helvetica", fontStyle);

      const lines = text.split("\n");
      const lineHeight = (fontSize ? fontSize / 28 : 0.4);
      const totalHeight = lines.length * lineHeight;
      
      lines.forEach((line, index) => {
        let textX = x;
        if (align === "center") textX = x + Math.abs(w) / 2;
        if (align === "right") textX = x + Math.abs(w) - 0.1;
        if (align === "left") textX = x + 0.1;

        const textY = y + (Math.abs(h) - totalHeight) / 2 + (index + 1) * lineHeight - (fontSize ? fontSize / 80 : 0.1);
        doc.text(line, textX, textY, { align });
      });
    };

    // --- Spielergebnisse ---
    if (showSpielergebnisse) {
      if (!firstPage) doc.addPage();
      firstPage = false;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      
      const xStart = 1;
      let yPos = 1.5;

      meisterschaft.tblSpieltag.forEach((st) => {
        const spieltagDatum = st.Spieltag.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });

        const spielerDaten = new Map<number, any>();
        
        meisterschaft.tblTeilnehmer.forEach(t => {
          spielerDaten.set(t.SpielerID, {
            id: t.SpielerID,
            name: `${t.tblMitglieder.Vorname} ${t.tblMitglieder.Nachname}`,
            gegensId: "-",
            p38: "-",
            p5k: "-",
            zus: "-",
            rennenRunden: 0,
            rennenPunkte: 0,
            rennenPlatz: 0,
            sarg: 0,
            pokal: 0,
            neuner: 0,
            kranz8: 0,
            ratten: 0,
            hatGespielt: false
          });
        });

        // Kombimeisterschaftsspiele
        st.tblSpielKombimeisterschaft.forEach(sm => {
          const s1 = spielerDaten.get(sm.SpielerID1);
          if (s1) {
            s1.gegensId = sm.SpielerID2.toString();
            s1.p38 = sm.Spieler1Punkte3bis8;
            s1.p5k = sm.Spieler1Punkte5Kugeln;
            s1.zus = sm.Spieler1Punkte3bis8 + sm.Spieler1Punkte5Kugeln;
            s1.hatGespielt = true;
          }
          const s2 = spielerDaten.get(sm.SpielerID2);
          if (s2) {
            s2.gegensId = sm.SpielerID1.toString();
            s2.p38 = sm.Spieler2Punkte3bis8;
            s2.p5k = sm.Spieler2Punkte5Kugeln;
            s2.zus = sm.Spieler2Punkte3bis8 + sm.Spieler2Punkte5Kugeln;
            s2.hatGespielt = true;
          }
        });

        // Begleit-Spiele (Gleich wie in Meisterschaft)
        st.tblSpiel6TageRennen.forEach(r => {
          const s1 = spielerDaten.get(r.SpielerID1);
          if (s1) { s1.rennenRunden = r.Runden; s1.rennenPunkte = r.Punkte; s1.rennenPlatz = r.Platz; s1.hatGespielt = true; }
          const s2 = spielerDaten.get(r.SpielerID2);
          if (s2) { s2.rennenRunden = r.Runden; s2.rennenPunkte = r.Punkte; s2.rennenPlatz = r.Platz; s2.hatGespielt = true; }
        });

        st.tblSpielSargKegeln.forEach(s => {
          const spieler = spielerDaten.get(s.SpielerID);
          if (spieler) { spieler.sarg = s.Platzierung; spieler.hatGespielt = true; }
        });

        st.tblSpielPokal.forEach(p => {
          const spieler = spielerDaten.get(p.SpielerID);
          if (spieler) { spieler.pokal = (p.Platzierung === 1 || p.Platzierung === 2) ? p.Platzierung : 0; spieler.hatGespielt = true; }
        });

        st.tbl9erRatten.forEach(n => {
          const spieler = spielerDaten.get(n.SpielerID);
          if (spieler) {
            spieler.neuner = n.Neuner;
            spieler.kranz8 = n.Kranzacht;
            spieler.ratten = n.Ratten;
            spieler.hatGespielt = true;
          }
        });

        const aktiveSpieler = Array.from(spielerDaten.values()).filter(s => s.hatGespielt);
        if (aktiveSpieler.length === 0) return;

        const rowHeight = 0.6;
        const headerHeight = 1.2;
        const titleHeight = 1.0;
        const tableHeight = titleHeight + headerHeight + aktiveSpieler.length * rowHeight + 1;

        if (yPos + tableHeight > 19) {
          doc.addPage();
          yPos = 1.5;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${spieltagDatum} ${meisterschaft.Bezeichnung}`, xStart, yPos);
        yPos += 0.5;

        const cols = [
          { name: "ID", w: 1.0 },
          { name: "Spieler", w: 4.0 },
          { name: "Gegens.", w: 1.5 },
          { name: "Kombi", w: 3.0, sub: ["3-8", "5K", "Zus"] },
          { name: "6-Tage-Rennen", w: 4.5, sub: ["Runden", "Punkte", "Platz"] },
          { name: "Sarg", w: 1.2 },
          { name: "Pokal", w: 1.2 },
          { name: "9er", w: 1.2 },
          { name: "Kranz8", w: 1.5 },
          { name: "Ratten", w: 1.5 },
        ];

        let xCursor = xStart;
        cols.forEach(col => {
          if (col.sub) {
            drawBox(xCursor, yPos, col.w, 0.6, col.name, 10, true);
            const subW = col.w / col.sub.length;
            col.sub.forEach((subName, i) => {
              drawBox(xCursor + i * subW, yPos + 0.6, subW, 0.6, subName, 9, true);
            });
          } else {
            drawBox(xCursor, yPos, col.w, 1.2, col.name === "ID" ? "" : col.name, 10, true);
          }
          xCursor += col.w;
        });

        yPos += 1.2;

        aktiveSpieler.forEach(s => {
          let xRow = xStart;
          drawBox(xRow, yPos, 1.0, 0.6, s.id.toString(), 10);
          xRow += 1.0;
          drawBox(xRow, yPos, 4.0, 0.6, s.name, 10, false, "left");
          xRow += 4.0;
          drawBox(xRow, yPos, 1.5, 0.6, s.gegensId, 10);
          xRow += 1.5;
          
          // Kombi
          drawBox(xRow, yPos, 1.0, 0.6, s.p38.toString(), 10);
          xRow += 1.0;
          drawBox(xRow, yPos, 1.0, 0.6, s.p5k.toString(), 10);
          xRow += 1.0;
          drawBox(xRow, yPos, 1.0, 0.6, s.zus.toString(), 10, true);
          xRow += 1.0;

          // 6-Tage-Rennen
          drawBox(xRow, yPos, 1.5, 0.6, s.rennenRunden.toString(), 10);
          xRow += 1.5;
          drawBox(xRow, yPos, 1.5, 0.6, s.rennenPunkte.toString(), 10);
          xRow += 1.5;
          drawBox(xRow, yPos, 1.5, 0.6, s.rennenPlatz.toString(), 10);
          xRow += 1.5;

          drawBox(xRow, yPos, 1.2, 0.6, s.sarg.toString(), 10);
          xRow += 1.2;
          drawBox(xRow, yPos, 1.2, 0.6, s.pokal.toString(), 10);
          xRow += 1.2;
          drawBox(xRow, yPos, 1.2, 0.6, s.neuner.toString(), 10);
          xRow += 1.2;
          drawBox(xRow, yPos, 1.5, 0.6, s.kranz8.toString(), 10);
          xRow += 1.5;
          drawBox(xRow, yPos, 1.5, 0.6, s.ratten.toString(), 10);
          
          yPos += 0.6;
        });

        yPos += 1.0;
      });
    }

    // --- Tabelle ---
    if (showTabelle) {
      if (!firstPage) doc.addPage();
      firstPage = false;
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      const tableWidth = 1.5 + 5 + 3 * 2 + 2; // Platz, Name, Punkte3-8, Punkte5K, Gesamt, Durchschnitt
      doc.text(meisterschaft.Bezeichnung, nLeftMargin + tableWidth / 2, nTopMargin, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${meisterschaft.tblMeisterschaftstyp.Meisterschaftstyp} (Stand ${formattedDate})`, nLeftMargin + tableWidth / 2, nTopMargin + 0.8, { align: "center" });

      let x = nLeftMargin;
      let y = nTopMargin + 2;

      drawBox(x, y, 1.5, 0.6, "Platz", 10, true);
      drawBox(x + 1.5, y, 5, 0.6, "Name", 10, true);
      drawBox(x + 6.5, y, 2, 0.6, "3 bis 8", 10, true);
      drawBox(x + 8.5, y, 2, 0.6, "5 Kugeln", 10, true);
      drawBox(x + 10.5, y, 2, 0.6, "Gesamt", 10, true);

      y += 0.6;

      const sortedTabelle = [...lstTeilnehmer].sort((a, b) => a.Platzierung - b.Platzierung);

      sortedTabelle.forEach((t) => {
        const nameFormatted = `${t.Nachname}, ${t.Vorname}`;
        drawBox(x, y, 1.5, 0.6, t.Platzierung.toString(), 10, false, "center", t.NurHinrunde);
        drawBox(x + 1.5, y, 5, 0.6, nameFormatted, 10, false, "left", t.NurHinrunde);
        drawBox(x + 6.5, y, 2, 0.6, t.Punkte3bis8.toString(), 10, false, "center", t.NurHinrunde);
        drawBox(x + 8.5, y, 2, 0.6, t.Punkte5Kugeln.toString(), 10, false, "center", t.NurHinrunde);
        drawBox(x + 10.5, y, 2, 0.6, t.Gesamtpunkte.toString(), 10, true, "center", t.NurHinrunde);

        y += 0.6;
        if (y > 18) { doc.addPage(); y = nTopMargin; }
      });
    }

    // --- Kreuztabelle ---
    if (showKreuztabelle) {
      if (!firstPage) doc.addPage();
      firstPage = false;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      const headerWidth = 1.7 + lstTeilnehmer.length * 2.4 + 3 * 0.8;
      doc.text(meisterschaft.Bezeichnung, nLeftMargin + headerWidth / 2, nTopMargin, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${meisterschaft.tblMeisterschaftstyp.Meisterschaftstyp} (Stand ${formattedDate})`, nLeftMargin + headerWidth / 2, nTopMargin + 0.8, { align: "center" });

      doc.setFontSize(18);
      let x = nLeftMargin;
      let y = nTopMargin + 1.5;
      const jahr = meisterschaft.Beginn.getFullYear().toString();

      drawBox(x, y, 1.7, 1, jahr, 18);

      let xCursor = x + 1.7;
      for (let i = 0; i < lstTeilnehmer.length; i++) {
        drawBox(xCursor, y, 2.4, 0.5, lstTeilnehmer[i].SpielerName, 9, false, "center", lstTeilnehmer[i].NurHinrunde);
        drawBox(xCursor, y + 0.5, 0.8, 0.5, "3-8", 10);
        drawBox(xCursor + 0.8, y + 0.5, 0.8, 0.5, "5 K", 10);
        drawBox(xCursor + 1.6, y + 0.5, 0.8, 0.5, "Zus.", 8);
        xCursor += 2.4;
      }

      drawBox(xCursor, y, 0.8, 1, "Tot.\nHi.\nRü.", 7);
      drawBox(xCursor + 0.8, y, 0.8, 1, "Total", 7);
      drawBox(xCursor + 1.6, y, 0.8, 1, "Platz", 7);

      let yCursor = y + 1;
      for (let i = 0; i < lstTeilnehmer.length; i++) {
        drawBox(x, yCursor, 1.7, 1, lstTeilnehmer[i].SpielerName, 9, false, "center", lstTeilnehmer[i].NurHinrunde);

        let xInnerCursor = x + 1.7;
        for (let j = 0; j < lstTeilnehmer.length; j++) {
          const isItalic = lstTeilnehmer[i].NurHinrunde || lstTeilnehmer[j].NurHinrunde;
          if (lstTeilnehmer[i].SpielerID === lstTeilnehmer[j].SpielerID) {
            drawBox(xInnerCursor, yCursor, 0.8, 0.5, "X", 10, true, "center", isItalic);
            drawBox(xInnerCursor + 0.8, yCursor, 0.8, 0.5, "X", 10, true, "center", isItalic);
            drawBox(xInnerCursor + 1.6, yCursor, 0.8, 0.5, "X", 10, true, "center", isItalic);
            drawBox(xInnerCursor, yCursor + 0.5, 0.8, 0.5, "X", 10, true, "center", isItalic);
            drawBox(xInnerCursor + 0.8, yCursor + 0.5, 0.8, 0.5, "X", 10, true, "center", isItalic);
            drawBox(xInnerCursor + 1.6, yCursor + 0.5, 0.8, 0.5, "X", 10, true, "center", isItalic);
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
              return (isS1 ? (res.Spieler1Punkte3bis8 + res.Spieler1Punkte5Kugeln) : (res.Spieler2Punkte3bis8 + res.Spieler2Punkte5Kugeln)).toString();
            };

            drawBox(xInnerCursor, yCursor, 0.8, 0.5, getVal(hin, lstTeilnehmer[i].SpielerID, '3bis8'), 10, false, "center", isItalic);
            drawBox(xInnerCursor + 0.8, yCursor, 0.8, 0.5, getVal(hin, lstTeilnehmer[i].SpielerID, '5k'), 10, false, "center", isItalic);
            drawBox(xInnerCursor + 1.6, yCursor, 0.8, 0.5, getVal(hin, lstTeilnehmer[i].SpielerID, 'sum'), 10, true, "center", isItalic);
            
            drawBox(xInnerCursor, yCursor + 0.5, 0.8, 0.5, getVal(rueck, lstTeilnehmer[i].SpielerID, '3bis8'), 10, false, "center", isItalic);
            drawBox(xInnerCursor + 0.8, yCursor + 0.5, 0.8, 0.5, getVal(rueck, lstTeilnehmer[i].SpielerID, '5k'), 10, false, "center", isItalic);
            drawBox(xInnerCursor + 1.6, yCursor + 0.5, 0.8, 0.5, getVal(rueck, lstTeilnehmer[i].SpielerID, 'sum'), 10, true, "center", isItalic);
          }
          xInnerCursor += 2.4;
        }

        let sumHin = 0;
        let sumRueck = 0;
        rawResults.forEach(r => {
          if (r.SpielerID1 === lstTeilnehmer[i].SpielerID) {
            if (getNurHinrunde(r.SpielerID2) && r.HinRueckrunde === 0) return;
            if (r.HinRueckrunde === 0) sumHin += (r.Spieler1Punkte3bis8 + r.Spieler1Punkte5Kugeln);
            else sumRueck += (r.Spieler1Punkte3bis8 + r.Spieler1Punkte5Kugeln);
          } else if (r.SpielerID2 === lstTeilnehmer[i].SpielerID) {
            if (getNurHinrunde(r.SpielerID1) && r.HinRueckrunde === 0) return;
            if (r.HinRueckrunde === 0) sumHin += (r.Spieler2Punkte3bis8 + r.Spieler2Punkte5Kugeln);
            else sumRueck += (r.Spieler2Punkte3bis8 + r.Spieler2Punkte5Kugeln);
          }
        });

        const formatSum = (val: number) => lstTeilnehmer[i].NurHinrunde ? `(${val})` : val.toString();

        drawBox(xInnerCursor, yCursor, 0.8, 0.5, formatSum(sumHin), 8, true, "center", lstTeilnehmer[i].NurHinrunde);
        drawBox(xInnerCursor, yCursor + 0.5, 0.8, 0.5, formatSum(sumRueck), 8, true, "center", lstTeilnehmer[i].NurHinrunde);
        drawBox(xInnerCursor + 0.8, yCursor, 0.8, 1, formatSum(sumHin + sumRueck), 8, true, "center", lstTeilnehmer[i].NurHinrunde);

        let platzFontSize = 8;
        if (lstTeilnehmer[i].Platzierung === 1) platzFontSize = 18;
        else if (lstTeilnehmer[i].Platzierung === 2) platzFontSize = 15;
        else if (lstTeilnehmer[i].Platzierung === 3) platzFontSize = 12;

        let platzText = lstTeilnehmer[i].Platzierung.toString();
        if (lstTeilnehmer[i].NurHinrunde) { platzText = `(${platzText})`; }

        drawBox(xInnerCursor + 1.6, yCursor, 0.8, 1, platzText, platzFontSize, true, "center", lstTeilnehmer[i].NurHinrunde);

        yCursor += 1;
      }
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const text = `${i} / ${pageCount}`;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.text(text, pageWidth / 2, pageHeight - 1, { align: "center" });
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
