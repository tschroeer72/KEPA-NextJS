"use server"

import { prisma } from "@/lib/prisma"
import { toUTCDate, formatLocalDate } from "@/lib/date-utils"
import { InitialData } from "@/app/verwaltung/eingabe/_components/ergebniseingabe-card"

export async function getKontrollausgabeAction(date: Date): Promise<{ success: boolean; data: InitialData | null; error?: string }> {
  try {
    const startOfDay = toUTCDate(date)

    const spieltag = await prisma.tblSpieltag.findFirst({
      where: {
        Spieltag: startOfDay,
      },
    })

    if (!spieltag) {
      return { success: true, data: null }
    }

    const spieltagId = spieltag.ID

    // 9er Ratten
    const neunerRatten = await prisma.tbl9erRatten.findMany({
      where: { SpieltagID: spieltagId },
      include: {
        tblMitglieder: {
          select: {
            Vorname: true,
            Spitzname: true
          }
        }
      }
    })
    
    const getSpielerNameFromItem = (item: any) => {
        const m = item.tblMitglieder
        if (!m) return "Unbekannt"
        return m.Spitzname && m.Spitzname.trim() !== "" ? m.Spitzname : m.Vorname
    }

    const formattedSpieltag = formatLocalDate(spieltag.Spieltag)

    const ausgabeNeunerRatten = neunerRatten.map(item => ({
        ID: item.ID,
        Spieltag: formattedSpieltag,
        SpieltagID: item.SpieltagID,
        SpielerID: item.SpielerID,
        Spielername: getSpielerNameFromItem(item),
        Neuner: item.Neuner,
        Ratten: item.Ratten,
        Kranz8: item.Kranzacht
    }))

    // 6-Tage-Rennen
    const sechsTageRennen = await prisma.tblSpiel6TageRennen.findMany({
        where: { SpieltagID: spieltagId },
        include: {
          tblMitglieder_SpielerID1: { select: { Vorname: true, Spitzname: true } },
          tblMitglieder_SpielerID2: { select: { Vorname: true, Spitzname: true } }
        }
    })
    const ausgabeSechsTageRennen = sechsTageRennen.map(item => ({
        ID: item.ID,
        Spieltag: formattedSpieltag,
        SpieltagID: item.SpieltagID,
        Spieler1ID: item.SpielerID1,
        Spieler1Name: item.tblMitglieder_SpielerID1.Spitzname && item.tblMitglieder_SpielerID1.Spitzname.trim() !== "" ? item.tblMitglieder_SpielerID1.Spitzname : item.tblMitglieder_SpielerID1.Vorname,
        Spieler2ID: item.SpielerID2,
        Spieler2Name: item.tblMitglieder_SpielerID2.Spitzname && item.tblMitglieder_SpielerID2.Spitzname.trim() !== "" ? item.tblMitglieder_SpielerID2.Spitzname : item.tblMitglieder_SpielerID2.Vorname,
        Runden: item.Runden,
        Punkte: item.Punkte,
        Spielnr: item.Spielnummer
    }))

    // Pokal
    const pokal = await prisma.tblSpielPokal.findMany({
        where: { SpieltagID: spieltagId },
        include: { tblMitglieder: { select: { Vorname: true, Spitzname: true } } }
    })
    const ausgabePokal = pokal.map(item => ({
        ID: item.ID,
        Spieltag: formattedSpieltag,
        SpieltagID: item.SpieltagID,
        SpielerID: item.SpielerID,
        Spielername: getSpielerNameFromItem(item),
        Platzierung: item.Platzierung
    }))

    // Sargkegeln
    const sargkegeln = await prisma.tblSpielSargKegeln.findMany({
        where: { SpieltagID: spieltagId },
        include: { tblMitglieder: { select: { Vorname: true, Spitzname: true } } }
    })
    const ausgabeSargkegeln = sargkegeln.map(item => ({
        ID: item.ID,
        Spieltag: formattedSpieltag,
        SpieltagID: item.SpieltagID,
        SpielerID: item.SpielerID,
        Spielername: getSpielerNameFromItem(item),
        Platzierung: item.Platzierung
    }))

    // Meisterschaft
    const meisterschaft = await prisma.tblSpielMeisterschaft.findMany({
        where: { SpieltagID: spieltagId },
        include: {
          tblMitglieder_SpielerID1: { select: { Vorname: true, Spitzname: true } },
          tblMitglieder_SpielerID2: { select: { Vorname: true, Spitzname: true } }
        }
    })
    const ausgabeMeisterschaft = meisterschaft.map(item => ({
        ID: item.ID,
        Spieltag: formattedSpieltag,
        SpieltagID: item.SpieltagID,
        Spieler1ID: item.SpielerID1,
        Spieler1Name: item.tblMitglieder_SpielerID1.Spitzname && item.tblMitglieder_SpielerID1.Spitzname.trim() !== "" ? item.tblMitglieder_SpielerID1.Spitzname : item.tblMitglieder_SpielerID1.Vorname,
        Spieler2ID: item.SpielerID2,
        Spieler2Name: item.tblMitglieder_SpielerID2.Spitzname && item.tblMitglieder_SpielerID2.Spitzname.trim() !== "" ? item.tblMitglieder_SpielerID2.Spitzname : item.tblMitglieder_SpielerID2.Vorname,
        HolzSpieler1: item.HolzSpieler1,
        HolzSpieler2: item.HolzSpieler2,
        HinRueckrunde: item.HinRueckrunde === 0 ? "Hinrunde" : "Rückrunde"
    }))

    // Blitztunier
    const blitztunier = await prisma.tblSpielBlitztunier.findMany({
        where: { SpieltagID: spieltagId },
        include: {
          tblMitglieder_SpielerID1: { select: { Vorname: true, Spitzname: true } },
          tblMitglieder_SpielerID2: { select: { Vorname: true, Spitzname: true } }
        }
    })
    const ausgabeBlitztunier = blitztunier.map(item => ({
        ID: item.ID,
        Spieltag: formattedSpieltag,
        SpieltagID: item.SpieltagID,
        Spieler1ID: item.SpielerID1,
        Spieler1Name: item.tblMitglieder_SpielerID1.Spitzname && item.tblMitglieder_SpielerID1.Spitzname.trim() !== "" ? item.tblMitglieder_SpielerID1.Spitzname : item.tblMitglieder_SpielerID1.Vorname,
        Spieler2ID: item.SpielerID2,
        Spieler2Name: item.tblMitglieder_SpielerID2.Spitzname && item.tblMitglieder_SpielerID2.Spitzname.trim() !== "" ? item.tblMitglieder_SpielerID2.Spitzname : item.tblMitglieder_SpielerID2.Vorname,
        PunkteSpieler1: item.PunkteSpieler1,
        PunkteSpieler2: item.PunkteSpieler2,
        HinRueckrunde: item.HinR_ckrunde === 0 ? "Hinrunde" : "Rückrunde"
    }))

    // Kombimeisterschaft
    const kombimeisterschaft = await prisma.tblSpielKombimeisterschaft.findMany({
        where: { SpieltagID: spieltagId },
        include: {
          tblMitglieder_SpielerID1: { select: { Vorname: true, Spitzname: true } },
          tblMitglieder_SpielerID2: { select: { Vorname: true, Spitzname: true } }
        }
    })
    const ausgabeKombimeisterschaft = kombimeisterschaft.map(item => ({
        ID: item.ID,
        Spieltag: formattedSpieltag,
        SpieltagID: item.SpieltagID,
        Spieler1ID: item.SpielerID1,
        Spieler1Name: item.tblMitglieder_SpielerID1.Spitzname && item.tblMitglieder_SpielerID1.Spitzname.trim() !== "" ? item.tblMitglieder_SpielerID1.Spitzname : item.tblMitglieder_SpielerID1.Vorname,
        Spieler2ID: item.SpielerID2,
        Spieler2Name: item.tblMitglieder_SpielerID2.Spitzname && item.tblMitglieder_SpielerID2.Spitzname.trim() !== "" ? item.tblMitglieder_SpielerID2.Spitzname : item.tblMitglieder_SpielerID2.Vorname,
        Spieler1Punkte3bis8: item.Spieler1Punkte3bis8,
        Spieler1Punkte5Kugeln: item.Spieler1Punkte5Kugeln,
        Spieler2Punkte3bis8: item.Spieler2Punkte3bis8,
        Spieler2Punkte5Kugeln: item.Spieler2Punkte5Kugeln,
        HinRueckrunde: item.HinRueckrunde === 0 ? "Hinrunde" : "Rückrunde"
    }))

    return {
      success: true,
      data: {
        neunerRatten: ausgabeNeunerRatten,
        sechsTageRennen: ausgabeSechsTageRennen,
        pokal: ausgabePokal,
        sargkegeln: ausgabeSargkegeln,
        meisterschaft: ausgabeMeisterschaft,
        blitztunier: ausgabeBlitztunier,
        kombimeisterschaft: ausgabeKombimeisterschaft,
      },
    }
  } catch (error) {
    console.error("Error in getKontrollausgabeAction:", error)
    return {
      success: false,
      data: null,
      error: "Fehler beim Laden der Kontrolldaten"
    }
  }
}
