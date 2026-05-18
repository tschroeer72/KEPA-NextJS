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
            NurHinrunde: true
          }
        },
        tblSpieltag: {
          orderBy: { Spieltag: "asc" },
          include: {
            tblSpielMeisterschaft: {
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

    const allResults = await prisma.tblSpielMeisterschaft.findMany({
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

    // Daten vorbereiten wie im C#-Code
    const teilnehmerMap = new Map<number, { 
      SpielerID: number; 
      SpielerName: string; 
      Vorname: string;
      Nachname: string;
      Punkte: number; 
      GegnerPunkte: number;
      Gesamtpunkte: number; 
      GesamtGegnerPunkte: number;
      GesamtHolz: number; 
      Platzierung: number; 
      NurHinrunde: boolean;
      Anzahl: number;
      Gew: number;
      Unent: number;
      Verl: number;
      MaxHolz: number;
    }>();

    const getSpielerName = (s: any) => s.Spitzname || s.Vorname;

    const getNurHinrunde = (spielerId: number) => {
      const teilnehmer = meisterschaft.tblTeilnehmer.find(t => t.SpielerID === spielerId);
      return teilnehmer?.NurHinrunde || false;
    };

    rawResults.forEach((item) => {
      const s1NurHinrunde = getNurHinrunde(item.SpielerID1);
      const s2NurHinrunde = getNurHinrunde(item.SpielerID2);
      
      // Für die Wertung (Punkte/Platzierung) zählen nur Spiele, wenn BEIDE Spieler nicht "NurHinrunde" sind
      const isWertungsSpiel = !s1NurHinrunde && !s2NurHinrunde;

      // Spieler 1
      if (!teilnehmerMap.has(item.SpielerID1)) {
        const p = item.HolzSpieler1 > item.HolzSpieler2 ? 2 : (item.HolzSpieler1 < item.HolzSpieler2 ? 0 : 1);
        const gp = item.HolzSpieler2 > item.HolzSpieler1 ? 2 : (item.HolzSpieler2 < item.HolzSpieler1 ? 0 : 1);
        teilnehmerMap.set(item.SpielerID1, {
          SpielerID: item.SpielerID1,
          SpielerName: getSpielerName(item.tblMitglieder_SpielerID1),
          Vorname: item.tblMitglieder_SpielerID1.Vorname,
          Nachname: item.tblMitglieder_SpielerID1.Nachname,
          Punkte: isWertungsSpiel ? p : 0,
          GegnerPunkte: isWertungsSpiel ? gp : 0,
          Gesamtpunkte: isWertungsSpiel ? p : 0,
          GesamtGegnerPunkte: isWertungsSpiel ? gp : 0,
          GesamtHolz: item.HolzSpieler1,
          Platzierung: 0,
          NurHinrunde: s1NurHinrunde,
          Anzahl: 1,
          Gew: item.HolzSpieler1 > item.HolzSpieler2 ? 1 : 0,
          Unent: item.HolzSpieler1 === item.HolzSpieler2 ? 1 : 0,
          Verl: item.HolzSpieler1 < item.HolzSpieler2 ? 1 : 0,
          MaxHolz: item.HolzSpieler1,
        });
      } else {
        const t = teilnehmerMap.get(item.SpielerID1)!;
        const p = item.HolzSpieler1 > item.HolzSpieler2 ? 2 : (item.HolzSpieler1 < item.HolzSpieler2 ? 0 : 1);
        const gp = item.HolzSpieler2 > item.HolzSpieler1 ? 2 : (item.HolzSpieler2 < item.HolzSpieler1 ? 0 : 1);
        
        if (isWertungsSpiel) {
          t.Punkte += p;
          t.GegnerPunkte += gp;
          t.Gesamtpunkte += p;
          t.GesamtGegnerPunkte += gp;
        }
        
        t.GesamtHolz += item.HolzSpieler1;
        t.Anzahl += 1;
        if (item.HolzSpieler1 > item.HolzSpieler2) t.Gew += 1;
        else if (item.HolzSpieler1 === item.HolzSpieler2) t.Unent += 1;
        else t.Verl += 1;
        if (item.HolzSpieler1 > t.MaxHolz) t.MaxHolz = item.HolzSpieler1;
      }

      // Spieler 2
      if (!teilnehmerMap.has(item.SpielerID2)) {
        const p = item.HolzSpieler2 > item.HolzSpieler1 ? 2 : (item.HolzSpieler2 < item.HolzSpieler1 ? 0 : 1);
        const gp = item.HolzSpieler1 > item.HolzSpieler2 ? 2 : (item.HolzSpieler1 < item.HolzSpieler2 ? 0 : 1);
        teilnehmerMap.set(item.SpielerID2, {
          SpielerID: item.SpielerID2,
          SpielerName: getSpielerName(item.tblMitglieder_SpielerID2),
          Vorname: item.tblMitglieder_SpielerID2.Vorname,
          Nachname: item.tblMitglieder_SpielerID2.Nachname,
          Punkte: isWertungsSpiel ? p : 0,
          GegnerPunkte: isWertungsSpiel ? gp : 0,
          Gesamtpunkte: isWertungsSpiel ? p : 0,
          GesamtGegnerPunkte: isWertungsSpiel ? gp : 0,
          GesamtHolz: item.HolzSpieler2,
          Platzierung: 0,
          NurHinrunde: s2NurHinrunde,
          Anzahl: 1,
          Gew: item.HolzSpieler2 > item.HolzSpieler1 ? 1 : 0,
          Unent: item.HolzSpieler2 === item.HolzSpieler1 ? 1 : 0,
          Verl: item.HolzSpieler2 < item.HolzSpieler1 ? 1 : 0,
          MaxHolz: item.HolzSpieler2,
        });
      } else {
        const t = teilnehmerMap.get(item.SpielerID2)!;
        const p = item.HolzSpieler2 > item.HolzSpieler1 ? 2 : (item.HolzSpieler2 < item.HolzSpieler1 ? 0 : 1);
        const gp = item.HolzSpieler1 > item.HolzSpieler2 ? 2 : (item.HolzSpieler1 < item.HolzSpieler2 ? 0 : 1);

        if (isWertungsSpiel) {
          t.Punkte += p;
          t.GegnerPunkte += gp;
          t.Gesamtpunkte += p;
          t.GesamtGegnerPunkte += gp;
        }

        t.GesamtHolz += item.HolzSpieler2;
        t.Anzahl += 1;
        if (item.HolzSpieler2 > item.HolzSpieler1) t.Gew += 1;
        else if (item.HolzSpieler2 === item.HolzSpieler1) t.Unent += 1;
        else t.Verl += 1;
        if (item.HolzSpieler2 > t.MaxHolz) t.MaxHolz = item.HolzSpieler2;
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

    // Platzierung für NurHinrunde Spieler ermitteln (nachdem die anderen feststehen)
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

        // Teilnehmer für diesen Spieltag sammeln
        const spielerDaten = new Map<number, any>();
        
        // Initialisiere alle Meisterschaftsteilnehmer für diesen Spieltag (viele haben vielleicht nicht alles gespielt)
        meisterschaft.tblTeilnehmer.forEach(t => {
          const mitglied = meisterschaft.tblSpieltag.flatMap(s => s.tblSpielMeisterschaft)
            .find(sm => sm.SpielerID1 === t.SpielerID || sm.SpielerID2 === t.SpielerID);
          
          let name = "";
          if (mitglied) {
            const m = mitglied.SpielerID1 === t.SpielerID ? mitglied.tblMitglieder_SpielerID1 : mitglied.tblMitglieder_SpielerID2;
            name = `${m.Vorname} ${m.Nachname}`;
          } else {
             // Fallback falls Spieler in dieser Meisterschaft noch gar nicht gespielt hat
             // Hier müssten wir eigentlich die Mitglieder noch separat laden oder aus tblTeilnehmer inkludieren
          }

          spielerDaten.set(t.SpielerID, {
            id: t.SpielerID,
            name: name,
            gegensId: "-",
            holz: "-",
            erg: "-",
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

        // Meisterschaftsspiele
        st.tblSpielMeisterschaft.forEach(sm => {
          // Spieler 1
          const s1 = spielerDaten.get(sm.SpielerID1);
          if (s1) {
            s1.name = `${sm.tblMitglieder_SpielerID1.Vorname} ${sm.tblMitglieder_SpielerID1.Nachname}`;
            s1.gegensId = sm.SpielerID2.toString();
            s1.holz = sm.HolzSpieler1;
            s1.erg = sm.HolzSpieler1 > sm.HolzSpieler2 ? 2 : (sm.HolzSpieler1 < sm.HolzSpieler2 ? 0 : 1);
            s1.hatGespielt = true;
          }
          // Spieler 2
          const s2 = spielerDaten.get(sm.SpielerID2);
          if (s2) {
            s2.name = `${sm.tblMitglieder_SpielerID2.Vorname} ${sm.tblMitglieder_SpielerID2.Nachname}`;
            s2.gegensId = sm.SpielerID1.toString();
            s2.holz = sm.HolzSpieler2;
            s2.erg = sm.HolzSpieler2 > sm.HolzSpieler1 ? 2 : (sm.HolzSpieler2 < sm.HolzSpieler1 ? 0 : 1);
            s2.hatGespielt = true;
          }
        });

        // 6-Tage-Rennen
        st.tblSpiel6TageRennen.forEach(r => {
          const s1 = spielerDaten.get(r.SpielerID1);
          if (s1) {
            s1.rennenRunden = r.Runden;
            s1.rennenPunkte = r.Punkte;
            s1.rennenPlatz = r.Platz;
            s1.hatGespielt = true;
          }
          const s2 = spielerDaten.get(r.SpielerID2);
          if (s2) {
            s2.rennenRunden = r.Runden;
            s2.rennenPunkte = r.Punkte;
            s2.rennenPlatz = r.Platz;
            s2.hatGespielt = true;
          }
        });

        // Sarg
        st.tblSpielSargKegeln.forEach(s => {
          const spieler = spielerDaten.get(s.SpielerID);
          if (spieler) {
            spieler.sarg = s.Platzierung;
            spieler.hatGespielt = true;
          }
        });

        // Pokal
        st.tblSpielPokal.forEach(p => {
          const spieler = spielerDaten.get(p.SpielerID);
          if (spieler) {
            spieler.pokal = (p.Platzierung === 1 || p.Platzierung === 2) ? p.Platzierung : 0;
            spieler.hatGespielt = true;
          }
        });

        // 9er Ratten
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

        // Platzbedarf berechnen
        const rowHeight = 0.6;
        const headerHeight = 1.2;
        const titleHeight = 1.0;
        const tableHeight = titleHeight + headerHeight + aktiveSpieler.length * rowHeight + 1; // +1 Puffer

        if (yPos + tableHeight > 19) {
          doc.addPage();
          yPos = 1.5;
        }

        // Überschrift
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`${spieltagDatum} ${meisterschaft.Bezeichnung}`, xStart, yPos);
        yPos += 0.5;

        // Tabellen-Header
        const cols = [
          { name: "ID", w: 1.0 },
          { name: "Spieler", w: 4.5 },
          { name: "Gegens.", w: 1.5 },
          { name: "Holz", w: 1.5 },
          { name: "Erg.", w: 1.2 },
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

        // Datenzeilen
        aktiveSpieler.forEach(s => {
          let xRow = xStart;
          drawBox(xRow, yPos, 1.0, 0.6, s.id.toString(), 10);
          xRow += 1.0;
          drawBox(xRow, yPos, 4.5, 0.6, s.name, 10, false, "left");
          xRow += 4.5;
          drawBox(xRow, yPos, 1.5, 0.6, s.gegensId, 10);
          xRow += 1.5;
          drawBox(xRow, yPos, 1.5, 0.6, s.holz.toString(), 10);
          xRow += 1.5;
          drawBox(xRow, yPos, 1.2, 0.6, s.erg.toString(), 10);
          xRow += 1.2;
          
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

        yPos += 1.0; // Abstand zwischen den Spieltagen
      });
    }

    // --- Tabelle ---
    if (showTabelle) {
      if (!firstPage) doc.addPage();
      firstPage = false;
      
      // Überschrift
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      // Wir nehmen eine feste Breite für die Tabelle an
      const tableWidth = 1.5 + 5 + 4 * 1.5 + 2 + 2 + 2 + 2.5; // Platz, Name, Spiele(4), Punkte, Holz, MaxHolz, Durchschnitt
      doc.text(meisterschaft.Bezeichnung, nLeftMargin + tableWidth / 2, nTopMargin, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${meisterschaft.tblMeisterschaftstyp.Meisterschaftstyp} (Stand ${formattedDate})`, nLeftMargin + tableWidth / 2, nTopMargin + 0.8, { align: "center" });

      let x = nLeftMargin;
      let y = nTopMargin + 2;

      // Header Zeile 1
      drawBox(x, y, 1.5, 1.2, "Platz", 10, true);
      drawBox(x + 1.5, y, 5, 1.2, "Name", 10, true);
      drawBox(x + 6.5, y, 6, 0.6, "Spiele", 10, true);
      drawBox(x + 12.5, y, 2, 1.2, "Punkte", 10, true);
      drawBox(x + 14.5, y, 2, 1.2, "Holz", 10, true);
      drawBox(x + 16.5, y, 2, 1.2, "MaxHolz", 10, true);
      drawBox(x + 18.5, y, 2.5, 1.2, "Durchschnitt", 10, true);

      // Header Zeile 2 (unter Spiele)
      drawBox(x + 6.5, y + 0.6, 1.5, 0.6, "Anzahl", 9, true);
      drawBox(x + 8, y + 0.6, 1.5, 0.6, "Gew.", 9, true);
      drawBox(x + 9.5, y + 0.6, 1.5, 0.6, "Unent.", 9, true);
      drawBox(x + 11, y + 0.6, 1.5, 0.6, "Verl.", 9, true);

      y += 1.2;

      // Sortierung nach Platz
      const sortedTabelle = [...lstTeilnehmer].sort((a, b) => a.Platzierung - b.Platzierung);

      sortedTabelle.forEach((t) => {
        const nameFormatted = `${t.Nachname}, ${t.Vorname}`;
        const durchschnitt = t.Anzahl > 0 ? (t.GesamtHolz / t.Anzahl).toFixed(1) : "0,0";

        const punkteFormatted = `${t.Gesamtpunkte}:${t.GesamtGegnerPunkte}`;

        drawBox(x, y, 1.5, 0.6, t.Platzierung.toString(), 10, false, "center", t.NurHinrunde);
        drawBox(x + 1.5, y, 5, 0.6, nameFormatted, 10, false, "left", t.NurHinrunde);
        drawBox(x + 6.5, y, 1.5, 0.6, t.Anzahl.toString(), 10, false, "center", t.NurHinrunde);
        drawBox(x + 8, y, 1.5, 0.6, t.Gew.toString(), 10, false, "center", t.NurHinrunde);
        drawBox(x + 9.5, y, 1.5, 0.6, t.Unent.toString(), 10, false, "center", t.NurHinrunde);
        drawBox(x + 11, y, 1.5, 0.6, t.Verl.toString(), 10, false, "center", t.NurHinrunde);
        drawBox(x + 12.5, y, 2, 0.6, punkteFormatted, 10, true, "center", t.NurHinrunde);
        drawBox(x + 14.5, y, 2, 0.6, t.GesamtHolz.toString(), 10, false, "center", t.NurHinrunde);
        drawBox(x + 16.5, y, 2, 0.6, t.MaxHolz.toString(), 10, false, "center", t.NurHinrunde);
        drawBox(x + 18.5, y, 2.5, 0.6, durchschnitt.replace(".", ","), 10, false, "center", t.NurHinrunde);

        y += 0.6;

        // Seitenumbruch falls nötig
        if (y > 18) {
          doc.addPage();
          y = nTopMargin;
        }
      });
    }

    // --- Kreuztabelle ---
    if (showKreuztabelle) {
      if (!firstPage) doc.addPage();
      firstPage = false;

      // Überschrift
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      const headerWidth = 1.7 + lstTeilnehmer.length * 2.4 + 4 * 0.8;
      doc.text(meisterschaft.Bezeichnung, nLeftMargin + headerWidth / 2, nTopMargin, { align: "center" });

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${meisterschaft.tblMeisterschaftstyp.Meisterschaftstyp} (Stand ${formattedDate})`, nLeftMargin + headerWidth / 2, nTopMargin + 0.8, { align: "center" });

      // Kopfzeile und Namensspalte
      doc.setFontSize(18);
      let x = nLeftMargin;
      let y = nTopMargin + 1.5;
      const jahr = meisterschaft.Beginn.getFullYear().toString();

      drawBox(x, y, 1.7, 1, jahr, 18);

      let xCursor = x + 1.7;
      for (let i = 0; i < lstTeilnehmer.length; i++) {
        drawBox(xCursor, y, 2.4, 1, lstTeilnehmer[i].SpielerName, 9, false, "center", lstTeilnehmer[i].NurHinrunde);
        xCursor += 2.4;
      }

      drawBox(xCursor, y, 0.8, 1, "Tot.\nHi.\nRü.", 7);
      drawBox(xCursor + 0.8, y, 0.8, 1, "Total", 7);
      drawBox(xCursor + 1.6, y, 0.8, 1, "Holz", 7);
      drawBox(xCursor + 2.4, y, 0.8, 1, "Platz", 7);

      let yCursor = y + 1;
      for (let i = 0; i < lstTeilnehmer.length; i++) {
        drawBox(x, yCursor, 1.7, 1, lstTeilnehmer[i].SpielerName, 9, false, "center", lstTeilnehmer[i].NurHinrunde);

        let xInnerCursor = x + 1.7;
        for (let j = 0; j < lstTeilnehmer.length; j++) {
          const isItalic = lstTeilnehmer[i].NurHinrunde || lstTeilnehmer[j].NurHinrunde;
          if (lstTeilnehmer[i].SpielerID === lstTeilnehmer[j].SpielerID) {
            drawBox(xInnerCursor, yCursor, 2.4, 0.5, "XXX", 10, true, "center", isItalic);
            drawBox(xInnerCursor, yCursor + 0.5, 2.4, 0.5, "XXX", 10, true, "center", isItalic);
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

            const getPunkte = (res: any, sId: number) => {
              if (!res) return " ";
              const isSpieler1 = res.SpielerID1 === sId;
              const eigeneHolz = isSpieler1 ? res.HolzSpieler1 : res.HolzSpieler2;
              const gegnerHolz = isSpieler1 ? res.HolzSpieler2 : res.HolzSpieler1;

              if (eigeneHolz > gegnerHolz) return "2";
              if (eigeneHolz < gegnerHolz) return "0";
              return "1";
            };

            drawBox(xInnerCursor, yCursor, 2.4, 0.5, getPunkte(hin, lstTeilnehmer[i].SpielerID), 10, false, "center", isItalic);
            drawBox(xInnerCursor, yCursor + 0.5, 2.4, 0.5, getPunkte(rueck, lstTeilnehmer[i].SpielerID), 10, false, "center", isItalic);
          }
          xInnerCursor += 2.4;
        }

        let sumHin = 0;
        let sumRueck = 0;
        rawResults.forEach(r => {
          if (r.SpielerID1 === lstTeilnehmer[i].SpielerID) {
            const p = r.HolzSpieler1 > r.HolzSpieler2 ? 2 : (r.HolzSpieler1 < r.HolzSpieler2 ? 0 : 1);
            if (r.HinRueckrunde === 0) {
              if (getNurHinrunde(r.SpielerID2)) return;
              sumHin += p;
            } else {
              sumRueck += p;
            }
          } else if (r.SpielerID2 === lstTeilnehmer[i].SpielerID) {
            const p = r.HolzSpieler2 > r.HolzSpieler1 ? 2 : (r.HolzSpieler2 < r.HolzSpieler1 ? 0 : 1);
            if (r.HinRueckrunde === 0) {
              if (getNurHinrunde(r.SpielerID1)) return;
              sumHin += p;
            } else {
              sumRueck += p;
            }
          }
        });

        const formatSum = (val: number) => {
          return lstTeilnehmer[i].NurHinrunde ? `(${val})` : val.toString();
        };

        drawBox(xInnerCursor, yCursor, 0.8, 0.5, formatSum(sumHin), 8, true, "center", lstTeilnehmer[i].NurHinrunde);
        drawBox(xInnerCursor, yCursor + 0.5, 0.8, 0.5, formatSum(sumRueck), 8, true, "center", lstTeilnehmer[i].NurHinrunde);

        drawBox(xInnerCursor + 0.8, yCursor, 0.8, 1, formatSum(sumHin + sumRueck), 8, true, "center", lstTeilnehmer[i].NurHinrunde);
        drawBox(xInnerCursor + 1.6, yCursor, 0.8, 1, formatSum(lstTeilnehmer[i].GesamtHolz), 8, true, "center", lstTeilnehmer[i].NurHinrunde);

        let platzFontSize = 8;
        if (lstTeilnehmer[i].Platzierung === 1) platzFontSize = 18;
        else if (lstTeilnehmer[i].Platzierung === 2) platzFontSize = 15;
        else if (lstTeilnehmer[i].Platzierung === 3) platzFontSize = 12;

        let platzText = lstTeilnehmer[i].Platzierung.toString();
        if (lstTeilnehmer[i].NurHinrunde) {
          platzText = `(${platzText})`;
        }

        drawBox(xInnerCursor + 2.4, yCursor, 0.8, 1, platzText, platzFontSize, true, "center", lstTeilnehmer[i].NurHinrunde);

        yCursor += 1;
      }
    }

    // drawBox(x, yCursor, 1.7, 0.5, "Tot. Hi. Rü.", 7, true);
    // let xBottomCursor = x + 1.7;
    // for (let i = 0; i < lstTeilnehmer.length; i++) {
    //   drawBox(xBottomCursor, yCursor, 2.4, 0.5, lstTeilnehmer[i].Punkte.toString(), 10, true);
    //   xBottomCursor += 2.4;
    // }

    // --- Seitennummerierung ---
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
