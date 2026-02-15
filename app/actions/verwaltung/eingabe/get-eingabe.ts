"use server"

import { prisma } from "@/lib/prisma"

export async function getKontrollausgabeAction(date: Date) {
  try {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

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
    })
    
    // Wir brauchen die Mitgliedernamen. Da Prisma Relationen im Schema nicht voll definiert hat für alle Tabellen, 
    // laden wir die Mitglieder separat oder nutzen findMany mit include wenn möglich.
    // Laut schema.prisma haben viele tblSpielX keine expliziten Relationen zu tblMitglieder in der Prisma-Definition (nur @@index).
    
    const mitglieder = await prisma.tblMitglieder.findMany({
        select: {
            ID: true,
            Vorname: true,
            Spitzname: true
        }
    })

    const getSpielerName = (id: number) => {
        const m = mitglieder.find(m => m.ID === id)
        if (!m) return "Unbekannt"
        return m.Spitzname && m.Spitzname.trim() !== "" ? m.Spitzname : m.Vorname
    }

    const ausgabeNeunerRatten = neunerRatten.map(item => ({
        SpieltagID: item.SpieltagID,
        SpielerID: item.SpielerID,
        Spielername: getSpielerName(item.SpielerID),
        Neuner: item.Neuner,
        Ratten: item.Ratten,
        Kranz8: item.Kranzacht
    }))

    // 6-Tage-Rennen
    const sechsTageRennen = await prisma.tblSpiel6TageRennen.findMany({
        where: { SpieltagID: spieltagId }
    })
    const ausgabeSechsTageRennen = sechsTageRennen.map(item => ({
        SpieltagID: item.SpieltagID,
        Spieler1ID: item.SpielerID1,
        Spieler1Name: getSpielerName(item.SpielerID1),
        Spieler2ID: item.SpielerID2,
        Spieler2Name: getSpielerName(item.SpielerID2),
        Runden: item.Runden,
        Punkte: item.Punkte,
        Spielnr: item.Spielnummer
    }))

    // Pokal
    const pokal = await prisma.tblSpielPokal.findMany({
        where: { SpieltagID: spieltagId }
    })
    const ausgabePokal = pokal.map(item => ({
        SpieltagID: item.SpieltagID,
        SpielerID: item.SpielerID,
        Spielername: getSpielerName(item.SpielerID),
        Platzierung: item.Platzierung
    }))

    // Sargkegeln
    const sargkegeln = await prisma.tblSpielSargKegeln.findMany({
        where: { SpieltagID: spieltagId }
    })
    const ausgabeSargkegeln = sargkegeln.map(item => ({
        SpieltagID: item.SpieltagID,
        SpielerID: item.SpielerID,
        Spielername: getSpielerName(item.SpielerID),
        Platzierung: item.Platzierung
    }))

    // Meisterschaft
    const meisterschaft = await prisma.tblSpielMeisterschaft.findMany({
        where: { SpieltagID: spieltagId }
    })
    const ausgabeMeisterschaft = meisterschaft.map(item => ({
        SpieltagID: item.SpieltagID,
        Spieler1ID: item.SpielerID1,
        Spieler1Name: getSpielerName(item.SpielerID1),
        Spieler2ID: item.SpielerID2,
        Spieler2Name: getSpielerName(item.SpielerID2),
        HolzSpieler1: item.HolzSpieler1,
        HolzSpieler2: item.HolzSpieler2,
        HinRueckrunde: item.HinRueckrunde === 0 ? "Hinrunde" : "Rückrunde"
    }))

    // Blitztunier
    const blitztunier = await prisma.tblSpielBlitztunier.findMany({
        where: { SpieltagID: spieltagId }
    })
    const ausgabeBlitztunier = blitztunier.map(item => ({
        SpieltagID: item.SpieltagID,
        Spieler1ID: item.SpielerID1,
        Spieler1Name: getSpielerName(item.SpielerID1),
        Spieler2ID: item.SpielerID2,
        Spieler2Name: getSpielerName(item.SpielerID2),
        PunkteSpieler1: item.PunkteSpieler1,
        PunkteSpieler2: item.PunkteSpieler2,
        HinRueckrunde: item.HinR_ckrunde === 0 ? "Hinrunde" : "Rückrunde"
    }))

    // Kombimeisterschaft
    const kombimeisterschaft = await prisma.tblSpielKombimeisterschaft.findMany({
        where: { SpieltagID: spieltagId }
    })
    const ausgabeKombimeisterschaft = kombimeisterschaft.map(item => ({
        SpieltagID: item.SpieltagID,
        Spieler1ID: item.SpielerID1,
        Spieler1Name: getSpielerName(item.SpielerID1),
        Spieler2ID: item.SpielerID2,
        Spieler2Name: getSpielerName(item.SpielerID2),
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
    return { success: false, error: "Fehler beim Laden der Kontrolldaten" }
  }
}
