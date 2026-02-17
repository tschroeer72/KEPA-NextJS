"use server"

import { prisma } from '@/lib/prisma'
import { StatistikSpieler } from '@/interfaces/statistik-spieler'
import { StatistikSpielerErgebnisse } from '@/interfaces/statistik-spieler-ergebnisse'

/**
 * Hilfsaction für Statistik eines Spielers nach ID
 */
export async function getStatistikSpielerById(spielerId: number): Promise<{ success: boolean, data?: StatistikSpieler, error?: string }> {
  try {
    // Meisterschaftsspiele laden
    const meisterschaftsSpiele = await prisma.tblSpielMeisterschaft.findMany({
      where: {
        OR: [
          { SpielerID1: spielerId },
          { SpielerID2: spielerId }
        ]
      }
    })

    const meisterHolz = meisterschaftsSpiele.map(s => s.SpielerID1 === spielerId ? s.HolzSpieler1 : s.HolzSpieler2)
    
    const holzMeisterMax = meisterHolz.length > 0 ? Math.max(...meisterHolz) : 0
    const holzMeisterMin = meisterHolz.length > 0 ? Math.min(...meisterHolz) : 0
    const holzMeisterSumme = meisterHolz.reduce((a, b) => a + b, 0)
    const holzMeisterAVG = meisterHolz.length > 0 ? holzMeisterSumme / meisterHolz.length : 0

    // Blitztunier (WICHTIG: C#-Code scheint fälschlicherweise SpielerID1/2 als Holz zu verwenden, ich korrigiere das hier auf Punkte)
    // In tblSpielBlitztunier gibt es PunkteSpieler1/2
    const blitzSpiele = await prisma.tblSpielBlitztunier.findMany({
      where: {
        OR: [
          { SpielerID1: spielerId },
          { SpielerID2: spielerId }
        ]
      }
    })

    const blitzHolz = blitzSpiele.map(s => s.SpielerID1 === spielerId ? s.PunkteSpieler1 : s.PunkteSpieler2)
    
    const holzBlitzMax = blitzHolz.length > 0 ? Math.max(...blitzHolz) : 0
    const holzBlitzMin = blitzHolz.length > 0 ? Math.min(...blitzHolz) : 0
    const holzBlitzSumme = blitzHolz.reduce((a, b) => a + b, 0)
    const holzBlitzAVG = blitzHolz.length > 0 ? holzBlitzSumme / blitzHolz.length : 0

    // Neuner und Ratten
    const rattenNeuner = await prisma.tbl9erRatten.findMany({
      where: { SpielerID: spielerId }
    })

    const rattenMax = rattenNeuner.length > 0 ? Math.max(...rattenNeuner.map(r => (r.Ratten ?? 0))) : 0
    const rattenSumme = rattenNeuner.reduce((a, b) => a + (b.Ratten ?? 0), 0)
    const neunerMax = rattenNeuner.length > 0 ? Math.max(...rattenNeuner.map(r => (r.Neuner ?? 0))) : 0
    const neunerSumme = rattenNeuner.reduce((a, b) => a + (b.Neuner ?? 0), 0)
    const kranz8Max = rattenNeuner.length > 0 ? Math.max(...rattenNeuner.map(r => (r.Kranzacht ?? 0))) : 0
    const kranz8Summe = rattenNeuner.reduce((a, b) => a + (b.Kranzacht ?? 0), 0)

    // Gesamt
    const holzMax = Math.max(holzMeisterMax, holzBlitzMax)
    const holzMin = (meisterHolz.length > 0 && blitzHolz.length > 0) 
        ? Math.min(holzMeisterMin, holzBlitzMin) 
        : (meisterHolz.length > 0 ? holzMeisterMin : (blitzHolz.length > 0 ? holzBlitzMin : 0))
    const holzSumme = holzMeisterSumme + holzBlitzSumme
    const gesamtAnzahl = meisterHolz.length + blitzHolz.length
    const holzAVG = gesamtAnzahl > 0 ? holzSumme / gesamtAnzahl : 0

    const data: StatistikSpieler = {
      HolzMeisterMax: holzMeisterMax,
      HolzMeisterMin: holzMeisterMin,
      HolzMeisterSumme: holzMeisterSumme,
      HolzMeisterAVG: holzMeisterAVG,
      HolzBlitzMax: holzBlitzMax,
      HolzBlitzMin: holzBlitzMin,
      HolzBlitzSumme: holzBlitzSumme,
      HolzBlitzAVG: holzBlitzAVG,
      HolzMax: holzMax,
      HolzMin: holzMin,
      HolzSumme: holzSumme,
      HolzAVG: holzAVG,
      RattenMax: rattenMax,
      RattenSumme: rattenSumme,
      NeunerMax: neunerMax,
      NeunerSumme: neunerSumme,
      Kranz8Max: kranz8Max,
      Kranz8Summe: kranz8Summe
    }

    return { success: true, data }
  } catch (error) {
    console.error('getStatistikSpielerById error:', error)
    return { success: false, error: 'Fehler beim Laden der Spielerstatistik' }
  }
}

/**
 * Lädt die detaillierten Ergebnisse eines Spielers (ähnlich C# GetStatistikSpielerErgebnisseAsync)
 */
export async function getStatistikSpielerErgebnisse(spielerId: number): Promise<StatistikSpielerErgebnisse[]> {
  try {
    const spieltage = await prisma.tblSpieltag.findMany({
      include: {
        tblMeisterschaften: true,
        tblSpielMeisterschaft: {
          where: {
            OR: [
              { SpielerID1: spielerId },
              { SpielerID2: spielerId }
            ]
          },
          include: {
            tblMitglieder_SpielerID1: true,
            tblMitglieder_SpielerID2: true
          }
        },
        tblSpiel6TageRennen: {
          where: {
            OR: [
              { SpielerID1: spielerId },
              { SpielerID2: spielerId }
            ]
          }
        },
        tblSpielSargKegeln: {
          where: { SpielerID: spielerId }
        },
        tblSpielPokal: {
          where: { SpielerID: spielerId }
        },
        tbl9erRatten: {
          where: { SpielerID: spielerId }
        }
      },
      orderBy: {
        Spieltag: 'desc'
      }
    })

    const lstStat: StatistikSpielerErgebnisse[] = []

    for (const st of spieltage) {
      const objErg: StatistikSpielerErgebnisse = {
        Spieltag: st.Spieltag,
        Meisterschaft: st.tblMeisterschaften.Bezeichnung
      }

      let bolFound = false

      // Meisterschaft
      const sp = st.tblSpielMeisterschaft[0]
      if (sp) {
        bolFound = true
        if (sp.SpielerID1 === spielerId) {
          objErg.Gegenspieler = `${sp.tblMitglieder_SpielerID2.Nachname}, ${sp.tblMitglieder_SpielerID2.Vorname}`
          objErg.Holz = sp.HolzSpieler1
        } else {
          objErg.Gegenspieler = `${sp.tblMitglieder_SpielerID1.Nachname}, ${sp.tblMitglieder_SpielerID1.Vorname}`
          objErg.Holz = sp.HolzSpieler2
        }

        if (sp.HolzSpieler1 < sp.HolzSpieler2) {
          objErg.Ergebnis = 0
        } else if (sp.HolzSpieler1 === sp.HolzSpieler2) {
          objErg.Ergebnis = 1
        } else {
          objErg.Ergebnis = 2
        }
      }

      // 6 Tage Rennen
      const str = st.tblSpiel6TageRennen[0]
      if (str) {
        bolFound = true
        objErg.SechsTageRennen_Runden = str.Runden
        objErg.SechsTageRennen_Punkte = str.Punkte
        
        // Platzberechnung: Lade alle Teilnehmer dieses Spieltags für dieses Rennen
        const allStr = await prisma.tblSpiel6TageRennen.findMany({
          where: { 
            SpieltagID: st.ID,
            Spielnummer: str.Spielnummer 
          },
          orderBy: [
            { Runden: 'desc' },
            { Punkte: 'desc' }
          ]
        })
        const index = allStr.findIndex(s => (s.SpielerID1 === spielerId || s.SpielerID2 === spielerId))
        objErg.SechsTageRennen_Platz = index !== -1 ? index + 1 : 0
      }

      // Sarg
      const s = st.tblSpielSargKegeln[0]
      if (s) {
        bolFound = true
        objErg.Sarg = s.Platzierung
      }

      // Pokal
      const p = st.tblSpielPokal[0]
      if (p) {
        bolFound = true
        objErg.Pokal = p.Platzierung
      }

      // 9er + Ratten
      const nr = st.tbl9erRatten[0]
      if (nr) {
        bolFound = true
        objErg.Neuner = nr.Neuner
        objErg.Ratten = nr.Ratten
      }

      if (bolFound) {
        lstStat.push(objErg)
      }
    }

    return lstStat
  } catch (error) {
    console.error('getStatistikSpielerErgebnisse error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwStatistikSpieler
 */
export async function getStatistikSpieler() {
  try {
    const data = await prisma.tblMeisterschaften.findMany({
      include: {
        tblMeisterschaftstyp: true,
        // tblSpieltag ist über tblMeisterschaften verknüpft (Prisma-intern)
      },
    })

    // Da vwStatistikSpieler eine komplexe Join-Struktur hat, die in Prisma 
    // oft effizienter über Spieltage aufgelöst wird:
    const spieltage = await prisma.tblSpieltag.findMany({
      include: {
        tblMeisterschaften: {
          include: {
            tblMeisterschaftstyp: true
          }
        },
        tblSpielMeisterschaft: {
          include: {
            tblMitglieder_SpielerID1: true,
            tblMitglieder_SpielerID2: true
          }
        }
      },
      orderBy: {
        Spieltag: 'asc'
      }
    })

    return spieltage.flatMap(st => {
      const base = {
        MeisterschaftsID: st.MeisterschaftsID,
        Bezeichnung: st.tblMeisterschaften.Bezeichnung,
        Meisterschaftstyp: st.tblMeisterschaften.tblMeisterschaftstyp.Meisterschaftstyp,
        Spieltag: st.Spieltag,
      }

      if (st.tblSpielMeisterschaft.length === 0) {
        return [{
          ...base,
          SpielerID1: -1,
          Spieler1: '',
          HolzSpieler1: 0,
          SpielerID2: -1,
          Spieler2: '',
          HolzSpieler2: 0,
        }]
      }

      return st.tblSpielMeisterschaft.map(sm => ({
        ...base,
        SpielerID1: sm.SpielerID1 ?? -1,
        Spieler1: sm.tblMitglieder_SpielerID1 ? `${sm.tblMitglieder_SpielerID1.Nachname}, ${sm.tblMitglieder_SpielerID1.Vorname}` : '',
        HolzSpieler1: sm.HolzSpieler1 ?? 0,
        SpielerID2: sm.SpielerID2 ?? -1,
        Spieler2: sm.tblMitglieder_SpielerID2 ? `${sm.tblMitglieder_SpielerID2.Nachname}, ${sm.tblMitglieder_SpielerID2.Vorname}` : '',
        HolzSpieler2: sm.HolzSpieler2 ?? 0,
      }))
    })
  } catch (error) {
    console.error('getStatistikSpieler error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwStatistikSarg
 */
export async function getStatistikSarg() {
  try {
    const data = await prisma.tblSpielSargKegeln.findMany({
      include: {
        tblSpieltag: true,
        tblMitglieder: true,
      },
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      SpieltagID: d.SpieltagID,
      Spieltag: d.tblSpieltag.Spieltag,
      SpielerID: d.SpielerID,
      Vorname: d.tblMitglieder.Vorname,
      Nachname: d.tblMitglieder.Nachname,
      Spitzname: d.tblMitglieder.Spitzname,
      Platzierung: d.Platzierung,
    }))
  } catch (error) {
    console.error('getStatistikSarg error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwStatistikRatten
 */
export async function getStatistikRatten() {
  try {
    const data = await prisma.tbl9erRatten.findMany({
      where: {
        Ratten: { gt: 0 }
      },
      include: {
        tblSpieltag: {
          include: {
            tblMeisterschaften: true
          }
        },
        tblMitglieder: true
      },
      orderBy: [
        { tblSpieltag: { tblMeisterschaften: { Beginn: 'asc' } } },
        { tblSpieltag: { Spieltag: 'asc' } }
      ]
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      Bezeichnung: d.tblSpieltag.tblMeisterschaften.Bezeichnung,
      Beginn: d.tblSpieltag.tblMeisterschaften.Beginn,
      Ende: d.tblSpieltag.tblMeisterschaften.Ende,
      Spieltag: d.tblSpieltag.Spieltag,
      SpielerID: d.SpielerID,
      Ratten: d.Ratten,
      Vorname: d.tblMitglieder.Vorname,
      Nachname: d.tblMitglieder.Nachname,
      Spitzname: d.tblMitglieder.Spitzname,
    }))
  } catch (error) {
    console.error('getStatistikRatten error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwStatistikPokal
 */
export async function getStatistikPokal() {
  try {
    const data = await prisma.tblSpielPokal.findMany({
      include: {
        tblSpieltag: true,
        tblMitglieder: true
      }
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      ID: d.SpieltagID,
      Spieltag: d.tblSpieltag.Spieltag,
      SpielerID: d.SpielerID,
      Vorname: d.tblMitglieder.Vorname,
      Nachname: d.tblMitglieder.Nachname,
      Spitzname: d.tblMitglieder.Spitzname,
      Platzierung: d.Platzierung,
    }))
  } catch (error) {
    console.error('getStatistikPokal error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwStatistik9erRatten
 * Berücksichtigt jetzt auch Kranz8 (Kranzacht)
 */
export async function getStatistik9erRatten() {
  try {
    const spieltage = await prisma.tblSpieltag.findMany({
      include: {
        tblMeisterschaften: {
          include: {
            tblMeisterschaftstyp: true
          }
        },
        tbl9erRatten: true
      }
    })

    return spieltage.map(st => {
      // Neunerkönig: Max(Neuner) DESC, Max(Kranzacht) DESC, Min(Ratten) DESC
      const sortedForNeun = [...st.tbl9erRatten].sort((a, b) => {
        if (b.Neuner !== a.Neuner) return b.Neuner - a.Neuner
        if (b.Kranzacht !== a.Kranzacht) return b.Kranzacht - a.Kranzacht
        return a.Ratten - b.Ratten
      })

      // Rattenorden: Max(Ratten) DESC, Min(Kranzacht) ASC, Min(Neuner) ASC
      const sortedForRatten = [...st.tbl9erRatten].sort((a, b) => {
        if (b.Ratten !== a.Ratten) return b.Ratten - a.Ratten
        if (a.Kranzacht !== b.Kranzacht) return a.Kranzacht - b.Kranzacht
        return a.Neuner - b.Neuner
      })

      return {
        MeisterschaftsID: st.MeisterschaftsID,
        Bezeichnung: st.tblMeisterschaften.Bezeichnung,
        Beginn: st.tblMeisterschaften.Beginn,
        Ende: st.tblMeisterschaften.Ende,
        Meisterschaftstyp: st.tblMeisterschaften.tblMeisterschaftstyp.Meisterschaftstyp,
        Spieltag: st.Spieltag,
        ID: st.ID,
        SpielerIDNeunerkönig: sortedForNeun[0]?.SpielerID ?? -1,
        SpielerIDRattenorden: sortedForRatten[0]?.SpielerID ?? -1
      }
    })
  } catch (error) {
    console.error('getStatistik9erRatten error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwStatistik9er
 */
export async function getStatistik9er() {
  try {
    const data = await prisma.tbl9erRatten.findMany({
      where: {
        Neuner: { gt: 0 }
      },
      include: {
        tblSpieltag: {
          include: {
            tblMeisterschaften: true
          }
        },
        tblMitglieder: true
      }
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      Bezeichnung: d.tblSpieltag.tblMeisterschaften.Bezeichnung,
      Beginn: d.tblSpieltag.tblMeisterschaften.Beginn,
      Ende: d.tblSpieltag.tblMeisterschaften.Ende,
      Spieltag: d.tblSpieltag.Spieltag,
      SpielerID: d.SpielerID,
      Neuner: d.Neuner,
      Vorname: d.tblMitglieder.Vorname,
      Nachname: d.tblMitglieder.Nachname,
      Spitzname: d.tblMitglieder.Spitzname,
    }))
  } catch (error) {
    console.error('getStatistik9er error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwStatistik6TageRennen
 */
export async function getStatistik6TageRennen() {
  try {
    const data = await prisma.tblSpiel6TageRennen.findMany({
      include: {
        tblSpieltag: true,
        tblMitglieder_SpielerID1: true,
        tblMitglieder_SpielerID2: true
      }
    })

    const results: any[] = []

    data.forEach(d => {
      // Spieler 1
      results.push({
        MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
        SpieltagID: d.SpieltagID,
        Spieltag: d.tblSpieltag.Spieltag,
        SpielerID: d.SpielerID1,
        Vorname: d.tblMitglieder_SpielerID1.Vorname,
        Nachname: d.tblMitglieder_SpielerID1.Nachname,
        Spitzname: d.tblMitglieder_SpielerID1.Spitzname,
        Spielnummer: d.Spielnummer,
        Runden: d.Runden,
        Punkte: d.Punkte
      })
      // Spieler 2
      results.push({
        MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
        SpieltagID: d.SpieltagID,
        Spieltag: d.tblSpieltag.Spieltag,
        SpielerID: d.SpielerID2,
        Vorname: d.tblMitglieder_SpielerID2.Vorname,
        Nachname: d.tblMitglieder_SpielerID2.Nachname,
        Spitzname: d.tblMitglieder_SpielerID2.Spitzname,
        Spielnummer: d.Spielnummer,
        Runden: d.Runden,
        Punkte: d.Punkte
      })
    })

    return results
  } catch (error) {
    console.error('getStatistik6TageRennen error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwSpielSargKegeln
 */
export async function getSpielSargKegeln() {
  return getStatistikSarg() // Identisch in der Logik
}

/**
 * Hilfsaction für vwSpielPokal
 */
export async function getSpielPokal() {
  try {
    const data = await prisma.tblSpielPokal.findMany({
      include: {
        tblSpieltag: true,
        tblMitglieder: true
      }
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      SpielPokalID: d.ID,
      SpieltagID: d.SpieltagID,
      Spieltag: d.tblSpieltag.Spieltag,
      SpielerID: d.SpielerID,
      Vorname: d.tblMitglieder.Vorname,
      Nachname: d.tblMitglieder.Nachname,
      Spitzname: d.tblMitglieder.Spitzname,
      Platzierung: d.Platzierung
    }))
  } catch (error) {
    console.error('getSpielPokal error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwSpielMeisterschaft
 */
export async function getSpielMeisterschaft() {
  try {
    const data = await prisma.tblSpielMeisterschaft.findMany({
      include: {
        tblSpieltag: true,
        tblMitglieder_SpielerID1: true,
        tblMitglieder_SpielerID2: true
      }
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      SpielMeisterschaftID: d.ID,
      SpieltagID: d.SpieltagID,
      Spieltag: d.tblSpieltag.Spieltag,
      SpielerID1: d.SpielerID1,
      Spieler1Vorname: d.tblMitglieder_SpielerID1.Vorname,
      Spieler1Nachname: d.tblMitglieder_SpielerID1.Nachname,
      Spieler1Spitzname: d.tblMitglieder_SpielerID1.Spitzname,
      SpielerID2: d.SpielerID2,
      Spieler2Vorname: d.tblMitglieder_SpielerID2.Vorname,
      Spieler2Nachname: d.tblMitglieder_SpielerID2.Nachname,
      Spieler2Spitzname: d.tblMitglieder_SpielerID2.Spitzname,
      HolzSpieler1: d.HolzSpieler1,
      HolzSpieler2: d.HolzSpieler2,
      HinRückrunde: d.HinRueckrunde
    }))
  } catch (error) {
    console.error('getSpielMeisterschaft error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwSpielKombimeisterschaft
 */
export async function getSpielKombimeisterschaft() {
  try {
    const data = await prisma.tblSpielKombimeisterschaft.findMany({
      include: {
        tblSpieltag: true,
        tblMitglieder_SpielerID1: true,
        tblMitglieder_SpielerID2: true
      }
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      KombimeisterschaftID: d.ID,
      SpieltagID: d.SpieltagID,
      Spieltag: d.tblSpieltag.Spieltag,
      SpielerID1: d.SpielerID1,
      Spieler1Vorname: d.tblMitglieder_SpielerID1.Vorname,
      Spieler1Nachname: d.tblMitglieder_SpielerID1.Nachname,
      Spieler1Spitzname: d.tblMitglieder_SpielerID1.Spitzname,
      SpielerID2: d.SpielerID2,
      Spieler2Vorname: d.tblMitglieder_SpielerID2.Vorname,
      Spieler2Nachname: d.tblMitglieder_SpielerID2.Nachname,
      Spieler2Spitzname: d.tblMitglieder_SpielerID2.Spitzname,
      Spieler1Punkte3bis8: d.Spieler1Punkte3bis8,
      Spieler1Punkte5Kugeln: d.Spieler1Punkte5Kugeln,
      Spieler2Punkte3bis8: d.Spieler2Punkte3bis8,
      Spieler2Punkte5Kugeln: d.Spieler2Punkte5Kugeln,
      HinRückrunde: d.HinRueckrunde
    }))
  } catch (error) {
    console.error('getSpielKombimeisterschaft error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwSpielBlitztunier
 */
export async function getSpielBlitztunier() {
  try {
    const data = await prisma.tblSpielBlitztunier.findMany({
      include: {
        tblSpieltag: true,
        tblMitglieder_SpielerID1: true,
        tblMitglieder_SpielerID2: true
      }
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      BlitztunierID: d.ID,
      SpieltagID: d.SpieltagID,
      Spieltag: d.tblSpieltag.Spieltag,
      SpielerID1: d.SpielerID1,
      Spieler1Vorname: d.tblMitglieder_SpielerID1.Vorname,
      Spieler1Nachname: d.tblMitglieder_SpielerID1.Nachname,
      Spieler1Spitzname: d.tblMitglieder_SpielerID1.Spitzname,
      SpielerID2: d.SpielerID2,
      Spieler2Vorname: d.tblMitglieder_SpielerID2.Vorname,
      Spieler2Nachname: d.tblMitglieder_SpielerID2.Nachname,
      Spieler2Spitzname: d.tblMitglieder_SpielerID2.Spitzname,
      PunkteSpieler1: d.PunkteSpieler1,
      PunkteSpieler2: d.PunkteSpieler2,
      HinRückrunde: d.HinR_ckrunde
    }))
  } catch (error) {
    console.error('getSpielBlitztunier error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwSpiel6TageRennen
 */
export async function getSpiel6TageRennen() {
  try {
    const data = await prisma.tblSpiel6TageRennen.findMany({
      include: {
        tblSpieltag: true,
        tblMitglieder_SpielerID1: true,
        tblMitglieder_SpielerID2: true
      },
      orderBy: [
        { tblSpieltag: { Spieltag: 'asc' } },
        { Spielnummer: 'asc' },
        { Runden: 'desc' },
        { Punkte: 'desc' }
      ]
    })
    return data.map((d, index) => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      '6TageRennenID': d.ID,
      SpieltagID: d.SpieltagID,
      Spieltag: d.tblSpieltag.Spieltag,
      SpielerID1: d.SpielerID1,
      Spieler1Vorname: d.tblMitglieder_SpielerID1.Vorname,
      Spieler1Nachname: d.tblMitglieder_SpielerID1.Nachname,
      Spieler1Spitzname: d.tblMitglieder_SpielerID1.Spitzname,
      SpielerID2: d.SpielerID2,
      Spieler2Vorname: d.tblMitglieder_SpielerID2.Vorname,
      Spieler2Nachname: d.tblMitglieder_SpielerID2.Nachname,
      Spieler2Spitzname: d.tblMitglieder_SpielerID2.Spitzname,
      Runden: d.Runden,
      Punkte: d.Punkte,
      Spielnummer: d.Spielnummer,
      Platz: index + 1 // Vereinfacht, SQL nutzt PARTITION BY
    }))
  } catch (error) {
    console.error('getSpiel6TageRennen error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwErgebnisKurztunier
 */
export async function getErgebnisKurztunier() {
  try {
    const data = await prisma.tblSpielBlitztunier.findMany({
      include: {
        tblSpieltag: {
          include: {
            tblMeisterschaften: true
          }
        },
        tblMitglieder_SpielerID1: true,
        tblMitglieder_SpielerID2: true
      }
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      Jahr: d.tblSpieltag.tblMeisterschaften.Beginn.getFullYear(),
      SpielerID1: d.SpielerID1,
      Spieler1Vorname: d.tblMitglieder_SpielerID1.Vorname,
      Spieler1Nachname: d.tblMitglieder_SpielerID1.Nachname,
      Spieler1Spitzname: d.tblMitglieder_SpielerID1.Spitzname,
      SpielerID2: d.SpielerID2,
      Spieler2Vorname: d.tblMitglieder_SpielerID2.Vorname,
      Spieler2Nachname: d.tblMitglieder_SpielerID2.Nachname,
      Spieler2Spitzname: d.tblMitglieder_SpielerID2.Spitzname,
      PunkteSpieler1: d.PunkteSpieler1,
      PunkteSpieler2: d.PunkteSpieler2,
      HinRückrunde: d.HinR_ckrunde
    }))
  } catch (error) {
    console.error('getErgebnisKurztunier error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwErgebnisMeisterschaft
 */
export async function getErgebnisMeisterschaft() {
  try {
    const data = await prisma.tblSpielMeisterschaft.findMany({
      include: {
        tblSpieltag: {
          include: {
            tblMeisterschaften: true
          }
        },
        tblMitglieder_SpielerID1: true,
        tblMitglieder_SpielerID2: true
      }
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      Jahr: d.tblSpieltag.tblMeisterschaften.Beginn.getFullYear(),
      SpielerID1: d.SpielerID1,
      Spieler1Vorname: d.tblMitglieder_SpielerID1.Vorname,
      Spieler1Nachname: d.tblMitglieder_SpielerID1.Nachname,
      Spieler1Spitzname: d.tblMitglieder_SpielerID1.Spitzname,
      SpielerID2: d.SpielerID2,
      Spieler2Vorname: d.tblMitglieder_SpielerID2.Vorname,
      Spieler2Nachname: d.tblMitglieder_SpielerID2.Nachname,
      Spieler2Spitzname: d.tblMitglieder_SpielerID2.Spitzname,
      HolzSpieler1: d.HolzSpieler1,
      HolzSpieler2: d.HolzSpieler2,
      HinRückrunde: d.HinRueckrunde
    }))
  } catch (error) {
    console.error('getErgebnisMeisterschaft error:', error)
    return []
  }
}

/**
 * Hilfsaction für vw9erRatten
 * Berücksichtigt jetzt auch Kranz8 (Kranzacht)
 */
export async function get9erRatten() {
  try {
    const data = await prisma.tbl9erRatten.findMany({
      include: {
        tblSpieltag: true,
        tblMitglieder: true
      }
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      SpieltagID: d.SpieltagID,
      Spieltag: d.tblSpieltag.Spieltag,
      '9erRattenID': d.ID,
      SpielerID: d.SpielerID,
      Vorname: d.tblMitglieder.Vorname,
      Nachname: d.tblMitglieder.Nachname,
      Spitzname: d.tblMitglieder.Spitzname,
      Neuner: d.Neuner,
      Ratten: d.Ratten,
      Kranzacht: d.Kranzacht
    }))
  } catch (error) {
    console.error('get9erRatten error:', error)
    return []
  }
}

/**
 * Hilfsaction für vwErgebnisKombimeisterschaft
 */
export async function getErgebnisKombimeisterschaft() {
  try {
    const data = await prisma.tblSpielKombimeisterschaft.findMany({
      include: {
        tblSpieltag: {
          include: {
            tblMeisterschaften: true
          }
        },
        tblMitglieder_SpielerID1: true,
        tblMitglieder_SpielerID2: true
      }
    })
    return data.map(d => ({
      MeisterschaftsID: d.tblSpieltag.MeisterschaftsID,
      Jahr: d.tblSpieltag.tblMeisterschaften.Beginn.getFullYear(),
      SpielerID1: d.SpielerID1,
      Spieler1Vorname: d.tblMitglieder_SpielerID1.Vorname,
      Spieler1Nachname: d.tblMitglieder_SpielerID1.Nachname,
      Spieler1Spitzname: d.tblMitglieder_SpielerID1.Spitzname,
      SpielerID2: d.SpielerID2,
      Spieler2Vorname: d.tblMitglieder_SpielerID2.Vorname,
      Spieler2Nachname: d.tblMitglieder_SpielerID2.Nachname,
      Spieler2Spitzname: d.tblMitglieder_SpielerID2.Spitzname,
      Spieler1Punkte3bis8: d.Spieler1Punkte3bis8,
      Spieler1Punkte5Kugeln: d.Spieler1Punkte5Kugeln,
      Spieler2Punkte3bis8: d.Spieler2Punkte3bis8,
      Spieler2Punkte5Kugeln: d.Spieler2Punkte5Kugeln,
      HinRückrunde: d.HinRueckrunde
    }))
  } catch (error) {
    console.error('getErgebnisKombimeisterschaft error:', error)
    return []
  }
}
