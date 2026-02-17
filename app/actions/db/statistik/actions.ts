"use server"

import { prisma } from '@/lib/prisma'
import { StatistikSpieler } from '@/interfaces/statistik-spieler'
import { StatistikSpielerErgebnisse } from '@/interfaces/statistik-spieler-ergebnisse'
import { getCurrentMeisterschaft } from '@/app/actions/settings/get-current-meisterschaft'

export async function getStatistik9er(zeitbereich: number, von?: Date, bis?: Date) {
  try {
    const whereClause: any = {}

    if (zeitbereich === 1) {
      // Laufende Meisterschaft
      const activeId = await getCurrentMeisterschaft()
      if (activeId) {
        whereClause.tblSpieltag = { MeisterschaftsID: parseInt(activeId) }
      }
    } else if (zeitbereich === 2) {
      // Letzte Meisterschaft
      const activeId = await getCurrentMeisterschaft()
      const lastMeisterschaft = await prisma.tblMeisterschaften.findFirst({
        where: activeId ? { ID: { lt: parseInt(activeId) } } : {},
        orderBy: { ID: 'desc' }
      })
      if (lastMeisterschaft) {
        whereClause.tblSpieltag = { MeisterschaftsID: lastMeisterschaft.ID }
      }
    } else if (zeitbereich === 3 && von && bis) {
      // Zeitbereich
      whereClause.tblSpieltag = {
        Spieltag: {
          gte: von,
          lte: bis
        }
      }
    }

    const data = await prisma.tbl9erRatten.findMany({
      where: whereClause,
      include: {
        tblMitglieder: true,
        tblSpieltag: true
      }
    })

    // Gruppieren nach Spieler
    const statsMap = new Map<number, any>()

    for (const d of data) {
      if (!statsMap.has(d.SpielerID)) {
        statsMap.set(d.SpielerID, {
          Spieler: `${d.tblMitglieder.Nachname}, ${d.tblMitglieder.Vorname}`,
          Gesamt: 0,
          AnzTeilnahmen: 0,
          Eins: 0, Zwei: 0, Drei: 0, Vier: 0, Fünf: 0, Sechs: 0, Sieben: 0, Acht: 0, Neun: 0, Zehn: 0
        })
      }
      const s = statsMap.get(d.SpielerID)
      s.Gesamt += d.Neuner
      if (d.Neuner > 0) {
        s.AnzTeilnahmen++
        switch (d.Neuner) {
          case 1: s.Eins++; break;
          case 2: s.Zwei++; break;
          case 3: s.Drei++; break;
          case 4: s.Vier++; break;
          case 5: s.Fünf++; break;
          case 6: s.Sechs++; break;
          case 7: s.Sieben++; break;
          case 8: s.Acht++; break;
          case 9: s.Neun++; break;
          default: if (d.Neuner >= 10) s.Zehn++; break;
        }
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => b.Gesamt - a.Gesamt)
  } catch (error) {
    console.error('getStatistik9er error:', error)
    return []
  }
}

export async function getStatistikRatten(zeitbereich: number, von?: Date, bis?: Date) {
  try {
    const whereClause: any = {}

    if (zeitbereich === 1) {
      const activeId = await getCurrentMeisterschaft()
      if (activeId) whereClause.tblSpieltag = { MeisterschaftsID: parseInt(activeId) }
    } else if (zeitbereich === 2) {
      const activeId = await getCurrentMeisterschaft()
      const lastMeisterschaft = await prisma.tblMeisterschaften.findFirst({
        where: activeId ? { ID: { lt: parseInt(activeId) } } : {},
        orderBy: { ID: 'desc' }
      })
      if (lastMeisterschaft) whereClause.tblSpieltag = { MeisterschaftsID: lastMeisterschaft.ID }
    } else if (zeitbereich === 3 && von && bis) {
      whereClause.tblSpieltag = { Spieltag: { gte: von, lte: bis } }
    }

    const data = await prisma.tbl9erRatten.findMany({
      where: whereClause,
      include: {
        tblMitglieder: true,
        tblSpieltag: true
      }
    })

    const statsMap = new Map<number, any>()

    for (const d of data) {
      if (!statsMap.has(d.SpielerID)) {
        statsMap.set(d.SpielerID, {
          Spieler: `${d.tblMitglieder.Nachname}, ${d.tblMitglieder.Vorname}`,
          Gesamt: 0,
          AnzTeilnahmen: 0,
          Eins: 0, Zwei: 0, Drei: 0, Vier: 0, Fünf: 0, Sechs: 0, Sieben: 0, Acht: 0, Neun: 0, Zehn: 0
        })
      }
      const s = statsMap.get(d.SpielerID)
      s.Gesamt += d.Ratten
      if (d.Ratten > 0) {
        s.AnzTeilnahmen++
        switch (d.Ratten) {
          case 1: s.Eins++; break;
          case 2: s.Zwei++; break;
          case 3: s.Drei++; break;
          case 4: s.Vier++; break;
          case 5: s.Fünf++; break;
          case 6: s.Sechs++; break;
          case 7: s.Sieben++; break;
          case 8: s.Acht++; break;
          case 9: s.Neun++; break;
          default: if (d.Ratten >= 10) s.Zehn++; break;
        }
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => b.Gesamt - a.Gesamt)
  } catch (error) {
    console.error('getStatistikRatten error:', error)
    return []
  }
}

export async function getStatistikPokal(zeitbereich: number, von?: Date, bis?: Date) {
  try {
    const whereClause: any = {}
    if (zeitbereich === 1) {
      const activeId = await getCurrentMeisterschaft()
      if (activeId) whereClause.tblSpieltag = { MeisterschaftsID: parseInt(activeId) }
    } else if (zeitbereich === 2) {
      const activeId = await getCurrentMeisterschaft()
      const lastMeisterschaft = await prisma.tblMeisterschaften.findFirst({
        where: activeId ? { ID: { lt: parseInt(activeId) } } : {},
        orderBy: { ID: 'desc' }
      })
      if (lastMeisterschaft) whereClause.tblSpieltag = { MeisterschaftsID: lastMeisterschaft.ID }
    } else if (zeitbereich === 3 && von && bis) {
      whereClause.tblSpieltag = { Spieltag: { gte: von, lte: bis } }
    }

    const data = await prisma.tblSpielPokal.findMany({
      where: whereClause,
      include: {
        tblMitglieder: true
      }
    })

    const statsMap = new Map<number, any>()
    for (const d of data) {
      if (!statsMap.has(d.SpielerID)) {
        statsMap.set(d.SpielerID, {
          Spieler: `${d.tblMitglieder.Nachname}, ${d.tblMitglieder.Vorname}`,
          Eins: 0, Zwei: 0
        })
      }
      const s = statsMap.get(d.SpielerID)
      if (d.Platzierung === 1) s.Eins++
      if (d.Platzierung === 2) s.Zwei++
    }

    return Array.from(statsMap.values()).sort((a, b) => b.Eins - a.Eins || b.Zwei - a.Zwei)
  } catch (error) {
    console.error('getStatistikPokal error:', error)
    return []
  }
}

export async function getStatistikSarg(zeitbereich: number, von?: Date, bis?: Date) {
  try {
    const whereClause: any = {}
    if (zeitbereich === 1) {
      const activeId = await getCurrentMeisterschaft()
      if (activeId) whereClause.tblSpieltag = { MeisterschaftsID: parseInt(activeId) }
    } else if (zeitbereich === 2) {
      const activeId = await getCurrentMeisterschaft()
      const lastMeisterschaft = await prisma.tblMeisterschaften.findFirst({
        where: activeId ? { ID: { lt: parseInt(activeId) } } : {},
        orderBy: { ID: 'desc' }
      })
      if (lastMeisterschaft) whereClause.tblSpieltag = { MeisterschaftsID: lastMeisterschaft.ID }
    } else if (zeitbereich === 3 && von && bis) {
      whereClause.tblSpieltag = { Spieltag: { gte: von, lte: bis } }
    }

    const data = await prisma.tblSpielSargKegeln.findMany({
      where: whereClause,
      include: {
        tblMitglieder: true
      }
    })

    const statsMap = new Map<number, any>()
    for (const d of data) {
      if (!statsMap.has(d.SpielerID)) {
        statsMap.set(d.SpielerID, {
          Spieler: `${d.tblMitglieder.Nachname}, ${d.tblMitglieder.Vorname}`,
          AnzTeilnahmen: 0,
          Eins: 0, Zwei: 0, Drei: 0, Vier: 0, Fünf: 0, Sechs: 0, Sieben: 0, Acht: 0, Neun: 0, Zehn: 0
        })
      }
      const s = statsMap.get(d.SpielerID)
      s.AnzTeilnahmen++
      switch (d.Platzierung) {
        case 1: s.Eins++; break;
        case 2: s.Zwei++; break;
        case 3: s.Drei++; break;
        case 4: s.Vier++; break;
        case 5: s.Fünf++; break;
        case 6: s.Sechs++; break;
        case 7: s.Sieben++; break;
        case 8: s.Acht++; break;
        case 9: s.Neun++; break;
        case 10: s.Zehn++; break;
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => b.Eins - a.Eins || b.Zwei - a.Zwei)
  } catch (error) {
    console.error('getStatistikSarg error:', error)
    return []
  }
}

export async function getStatistikSpielerSpieler(zeitbereich: number, von?: Date, bis?: Date) {
  try {
    const whereClause: any = {}
    if (zeitbereich === 1) {
      const activeId = await getCurrentMeisterschaft()
      if (activeId) whereClause.tblSpieltag = { MeisterschaftsID: parseInt(activeId) }
    } else if (zeitbereich === 2) {
      const activeId = await getCurrentMeisterschaft()
      const lastMeisterschaft = await prisma.tblMeisterschaften.findFirst({
        where: activeId ? { ID: { lt: parseInt(activeId) } } : {},
        orderBy: { ID: 'desc' }
      })
      if (lastMeisterschaft) whereClause.tblSpieltag = { MeisterschaftsID: lastMeisterschaft.ID }
    } else if (zeitbereich === 3 && von && bis) {
      whereClause.tblSpieltag = { Spieltag: { gte: von, lte: bis } }
    }

    const spieler = await prisma.tblMitglieder.findMany({
        where: { Ehemaliger: false },
        orderBy: [{ Nachname: 'asc' }, { Vorname: 'asc' }]
    })

    const results = []

    for (const s of spieler) {
        const stats: any = {
            Spielername: `${s.Nachname}, ${s.Vorname}`,
            dictMeisterschaft: {},
            dictBlitztunier: {},
            dictKombimeisterschaft: {}
        }

        // Meisterschaftsspiele
        const mSpiele = await prisma.tblSpielMeisterschaft.findMany({
            where: {
                ...whereClause,
                OR: [{ SpielerID1: s.ID }, { SpielerID2: s.ID }]
            },
            include: { tblMitglieder_SpielerID1: true, tblMitglieder_SpielerID2: true }
        })

        for (const sp of mSpiele) {
            const isP1 = sp.SpielerID1 === s.ID
            const opponent = isP1 ? `${sp.tblMitglieder_SpielerID2.Nachname}, ${sp.tblMitglieder_SpielerID2.Vorname}` : `${sp.tblMitglieder_SpielerID1.Nachname}, ${sp.tblMitglieder_SpielerID1.Vorname}`
            if (!stats.dictMeisterschaft[opponent]) stats.dictMeisterschaft[opponent] = { Gewonnen: 0, Unentschieden: 0, Verloren: 0 }
            
            const p1Holz = sp.HolzSpieler1 || 0
            const p2Holz = sp.HolzSpieler2 || 0
            
            if (p1Holz === p2Holz) stats.dictMeisterschaft[opponent].Unentschieden++
            else if ((isP1 && p1Holz > p2Holz) || (!isP1 && p2Holz > p1Holz)) stats.dictMeisterschaft[opponent].Gewonnen++
            else stats.dictMeisterschaft[opponent].Verloren++
        }

        // Blitztunier
        const bSpiele = await prisma.tblSpielBlitztunier.findMany({
            where: {
                ...whereClause,
                OR: [{ SpielerID1: s.ID }, { SpielerID2: s.ID }]
            },
            include: { tblMitglieder_SpielerID1: true, tblMitglieder_SpielerID2: true }
        })

        for (const sp of bSpiele) {
            const isP1 = sp.SpielerID1 === s.ID
            const opponent = isP1 ? `${sp.tblMitglieder_SpielerID2.Nachname}, ${sp.tblMitglieder_SpielerID2.Vorname}` : `${sp.tblMitglieder_SpielerID1.Nachname}, ${sp.tblMitglieder_SpielerID1.Vorname}`
            if (!stats.dictBlitztunier[opponent]) stats.dictBlitztunier[opponent] = { Gewonnen: 0, Unentschieden: 0, Verloren: 0 }
            
            const p1Pkt = sp.PunkteSpieler1 || 0
            const p2Pkt = sp.PunkteSpieler2 || 0
            
            if (p1Pkt === p2Pkt) stats.dictBlitztunier[opponent].Unentschieden++
            else if ((isP1 && p1Pkt > p2Pkt) || (!isP1 && p2Pkt > p1Pkt)) stats.dictBlitztunier[opponent].Gewonnen++
            else stats.dictBlitztunier[opponent].Verloren++
        }

        // Kombimeisterschaft
        const kSpiele = await prisma.tblSpielKombimeisterschaft.findMany({
            where: {
                ...whereClause,
                OR: [{ SpielerID1: s.ID }, { SpielerID2: s.ID }]
            },
            include: { tblMitglieder_SpielerID1: true, tblMitglieder_SpielerID2: true }
        })

        for (const sp of kSpiele) {
            const isP1 = sp.SpielerID1 === s.ID
            const opponent = isP1 ? `${sp.tblMitglieder_SpielerID2.Nachname}, ${sp.tblMitglieder_SpielerID2.Vorname}` : `${sp.tblMitglieder_SpielerID1.Nachname}, ${sp.tblMitglieder_SpielerID1.Vorname}`
            if (!stats.dictKombimeisterschaft[opponent]) {
                stats.dictKombimeisterschaft[opponent] = {
                    dict3bis8: { [opponent]: { Gewonnen: 0, Unentschieden: 0, Verloren: 0 } },
                    dict5Kugeln: { [opponent]: { Gewonnen: 0, Unentschieden: 0, Verloren: 0 } },
                    dictGesamt: { [opponent]: { Gewonnen: 0, Unentschieden: 0, Verloren: 0 } }
                }
            }
            
            // 3 bis 8
            const p1_38 = sp.Spieler1Punkte3bis8 || 0
            const p2_38 = sp.Spieler2Punkte3bis8 || 0
            if (p1_38 === p2_38) stats.dictKombimeisterschaft[opponent].dict3bis8[opponent].Unentschieden++
            else if ((isP1 && p1_38 > p2_38) || (!isP1 && p2_38 > p1_38)) stats.dictKombimeisterschaft[opponent].dict3bis8[opponent].Gewonnen++
            else stats.dictKombimeisterschaft[opponent].dict3bis8[opponent].Verloren++

            // 5 Kugeln
            const p1_5 = sp.Spieler1Punkte5Kugeln || 0
            const p2_5 = sp.Spieler2Punkte5Kugeln || 0
            if (p1_5 === p2_5) stats.dictKombimeisterschaft[opponent].dict5Kugeln[opponent].Unentschieden++
            else if ((isP1 && p1_5 > p2_5) || (!isP1 && p2_5 > p1_5)) stats.dictKombimeisterschaft[opponent].dict5Kugeln[opponent].Gewonnen++
            else stats.dictKombimeisterschaft[opponent].dict5Kugeln[opponent].Verloren++

            // Gesamt
            const p1_ges = p1_38 + p1_5
            const p2_ges = p2_38 + p2_5
            if (p1_ges === p2_ges) stats.dictKombimeisterschaft[opponent].dictGesamt[opponent].Unentschieden++
            else if ((isP1 && p1_ges > p2_ges) || (!isP1 && p2_ges > p1_ges)) stats.dictKombimeisterschaft[opponent].dictGesamt[opponent].Gewonnen++
            else stats.dictKombimeisterschaft[opponent].dictGesamt[opponent].Verloren++
        }

        results.push(stats)
    }

    return results
  } catch (error) {
    console.error('getStatistikSpielerSpieler error:', error)
    return []
  }
}

export async function getStatistik6TageRennenPlatz(zeitbereich: number, von?: Date, bis?: Date) {
  try {
    const whereClause: any = {}
    if (zeitbereich === 1) {
      const activeId = await getCurrentMeisterschaft()
      if (activeId) whereClause.tblSpieltag = { MeisterschaftsID: parseInt(activeId) }
    } else if (zeitbereich === 2) {
      const activeId = await getCurrentMeisterschaft()
      const lastMeisterschaft = await prisma.tblMeisterschaften.findFirst({
        where: activeId ? { ID: { lt: parseInt(activeId) } } : {},
        orderBy: { ID: 'desc' }
      })
      if (lastMeisterschaft) whereClause.tblSpieltag = { MeisterschaftsID: lastMeisterschaft.ID }
    } else if (zeitbereich === 3 && von && bis) {
      whereClause.tblSpieltag = { Spieltag: { gte: von, lte: bis } }
    }

    const data = await prisma.tblSpiel6TageRennen.findMany({
      where: whereClause,
      include: {
        tblMitglieder_SpielerID1: true,
        tblMitglieder_SpielerID2: true,
        tblSpieltag: true
      }
    })

    // 6-Tage-Rennen ist speziell: Pro Spieltag gibt es Platzierungen
    // Wir müssen die Ergebnisse pro Spieltag auswerten
    const spieltage = [...new Set(data.map(d => d.SpieltagID))]
    const playerStats = new Map<number, any>()

    for (const stId of spieltage) {
        const tagSpiele = data.filter(d => d.SpieltagID === stId)
        // Sortiere nach Runden desc, dann Punkte desc
        const sorted = tagSpiele.sort((a, b) => b.Runden - a.Runden || b.Punkte - a.Punkte)
        
        sorted.forEach((s, index) => {
            const platz = index + 1
            const players = [
                { id: s.SpielerID1, name: `${s.tblMitglieder_SpielerID1.Nachname}, ${s.tblMitglieder_SpielerID1.Vorname}` },
                { id: s.SpielerID2, name: `${s.tblMitglieder_SpielerID2.Nachname}, ${s.tblMitglieder_SpielerID2.Vorname}` }
            ]

            players.forEach(p => {
                if (!playerStats.has(p.id)) {
                    playerStats.set(p.id, { Spieler: p.name, AnzTeilnahmen: 0, Eins: 0, Zwei: 0, Drei: 0, Vier: 0, Fünf: 0, Sechs: 0 })
                }
                const ps = playerStats.get(p.id)
                ps.AnzTeilnahmen++
                if (platz === 1) ps.Eins++
                else if (platz === 2) ps.Zwei++
                else if (platz === 3) ps.Drei++
                else if (platz === 4) ps.Vier++
                else if (platz === 5) ps.Fünf++
                else if (platz === 6) ps.Sechs++
            })
        })
    }

    return Array.from(playerStats.values()).sort((a, b) => b.Eins - a.Eins || b.Zwei - a.Zwei || b.Drei - a.Drei)
  } catch (error) {
    console.error('getStatistik6TageRennenPlatz error:', error)
    return []
  }
}

export async function getStatistik6TageRennenBesteMannschaft(zeitbereich: number, von?: Date, bis?: Date) {
  try {
    const whereClause: any = {}
    if (zeitbereich === 1) {
        const activeId = await getCurrentMeisterschaft()
        if (activeId) whereClause.tblSpieltag = { MeisterschaftsID: parseInt(activeId) }
    } else if (zeitbereich === 2) {
        const activeId = await getCurrentMeisterschaft()
        const lastMeisterschaft = await prisma.tblMeisterschaften.findFirst({
            where: activeId ? { ID: { lt: parseInt(activeId) } } : {},
            orderBy: { ID: 'desc' }
        })
        if (lastMeisterschaft) whereClause.tblSpieltag = { MeisterschaftsID: lastMeisterschaft.ID }
    } else if (zeitbereich === 3 && von && bis) {
        whereClause.tblSpieltag = { Spieltag: { gte: von, lte: bis } }
    }

    const data = await prisma.tblSpiel6TageRennen.findMany({
      where: whereClause,
      include: {
        tblMitglieder_SpielerID1: true,
        tblMitglieder_SpielerID2: true
      }
    })

    const teams = new Map<string, any>()
    const spieltage = [...new Set(data.map(d => d.SpieltagID))]

    for (const stId of spieltage) {
        const tagSpiele = data.filter(d => d.SpieltagID === stId)
        const sorted = tagSpiele.sort((a, b) => b.Runden - a.Runden || b.Punkte - a.Punkte)
        
        sorted.forEach((s, index) => {
            const names = [
                `${s.tblMitglieder_SpielerID1.Nachname}, ${s.tblMitglieder_SpielerID1.Vorname}`,
                `${s.tblMitglieder_SpielerID2.Nachname}, ${s.tblMitglieder_SpielerID2.Vorname}`
            ].sort()
            const teamName = names.join(' / ')
            const platz = index + 1

            if (!teams.has(teamName)) {
                teams.set(teamName, { Mannschaft: teamName, Anzahl: 0, Eins: 0, Zwei: 0, Drei: 0, Vier: 0, Fünf: 0, Sechs: 0 })
            }
            const t = teams.get(teamName)
            t.Anzahl++
            if (platz === 1) t.Eins++
            else if (platz === 2) t.Zwei++
            else if (platz === 3) t.Drei++
            else if (platz === 4) t.Vier++
            else if (platz === 5) t.Fünf++
            else if (platz === 6) t.Sechs++
        })
    }

    return Array.from(teams.values()).sort((a, b) => b.Eins - a.Eins || b.Zwei - a.Zwei || b.Drei - a.Drei)
  } catch (error) {
    console.error('getStatistik6TageRennenBesteMannschaft error:', error)
    return []
  }
}

export async function getStatistik6TageRennenMannschaftMitglied(zeitbereich: number, von?: Date, bis?: Date) {
    try {
        const bestTeams = await getStatistik6TageRennenBesteMannschaft(zeitbereich, von, bis)
        const dict: Record<string, any[]> = {}

        // Wir gruppieren hier nach den einzelnen Spielern der Mannschaften
        for (const team of bestTeams) {
            const members = team.Mannschaft.split(' / ')
            for (const member of members) {
                if (!dict[member]) dict[member] = []
                dict[member].push(team)
            }
        }
        return dict
    } catch (error) {
        console.error('getStatistik6TageRennenMannschaftMitglied error:', error)
        return {}
    }
}

export async function getStatistikNeunerRattenKoenig(zeitbereich: number, von?: Date, bis?: Date) {
    try {
        const whereClause: any = {}
        if (zeitbereich === 1) {
            const activeId = await getCurrentMeisterschaft()
            if (activeId) whereClause.tblSpieltag = { MeisterschaftsID: parseInt(activeId) }
        } else if (zeitbereich === 2) {
            const activeId = await getCurrentMeisterschaft()
            const lastMeisterschaft = await prisma.tblMeisterschaften.findFirst({
                where: activeId ? { ID: { lt: parseInt(activeId) } } : {},
                orderBy: { ID: 'desc' }
            })
            if (lastMeisterschaft) whereClause.tblSpieltag = { MeisterschaftsID: lastMeisterschaft.ID }
        } else if (zeitbereich === 3 && von && bis) {
            whereClause.tblSpieltag = { Spieltag: { gte: von, lte: bis } }
        }

        const data = await prisma.tbl9erRatten.findMany({
            where: whereClause,
            include: {
                tblMitglieder: true,
                tblSpieltag: true
            },
            orderBy: { tblSpieltag: { Spieltag: 'asc' } }
        })

        const spieltage = await prisma.tblSpieltag.findMany({
            where: whereClause,
            orderBy: { Spieltag: 'asc' }
        })

        const result: any = {
            lstStatistik9erRatten: [],
            dictNeunerkönig: {},
            dictRattenkönig: {}
        }

        for (const st of spieltage) {
            const tagData = data.filter(d => d.SpieltagID === st.ID)
            
            // Neunerkönig des Tages (wer hat am meisten Neuner an diesem Tag)
            const sorted9 = [...tagData].sort((a, b) => b.Neuner - a.Neuner)
            const nKönig = sorted9[0] && sorted9[0].Neuner > 0 ? `${sorted9[0].tblMitglieder.Nachname}, ${sorted9[0].tblMitglieder.Vorname}` : ''
            
            // Rattenkönig des Tages
            const sortedR = [...tagData].sort((a, b) => b.Ratten - a.Ratten)
            const rKönig = sortedR[0] && sortedR[0].Ratten > 0 ? `${sortedR[0].tblMitglieder.Nachname}, ${sortedR[0].tblMitglieder.Vorname}` : ''

            result.lstStatistik9erRatten.push({
                Spieltag: st.Spieltag,
                Neunerkönig: nKönig,
                Rattenorden: rKönig
            })

            if (nKönig) result.dictNeunerkönig[nKönig] = (result.dictNeunerkönig[nKönig] || 0) + 1
            if (rKönig) result.dictRattenkönig[rKönig] = (result.dictRattenkönig[rKönig] || 0) + 1
        }

        return result
    } catch (error) {
        console.error('getStatistikNeunerRattenKoenig error:', error)
        return { lstStatistik9erRatten: [], dictNeunerkönig: {}, dictRattenkönig: {} }
    }
}

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

