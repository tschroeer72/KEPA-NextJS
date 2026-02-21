"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { toUTCDate } from "@/lib/date-utils"

interface BaseEingabeData {
  ID?: number;
  SpielerID: number;
}

interface RattenData extends BaseEingabeData {
  Neuner: number;
  Ratten: number;
  Kranz8: number;
}

interface TageRennenData {
  ID?: number;
  Spieler1ID: number;
  Spieler2ID: number;
  Runden: number;
  Punkte: number;
  Spielnr: number | null;
}

interface PokalSargData extends BaseEingabeData {
  Platzierung: number;
}

interface MeisterschaftBlitzData {
  ID?: number;
  Spieler1ID: number;
  Spieler2ID: number;
  Wert1: number;
  Wert2: number;
  HinRueckrunde: string;
}

interface KombiMeisterschaftData {
  ID?: number;
  Spieler1ID: number;
  Spieler2ID: number;
  S1_3bis8: number;
  S1_5K: number;
  S2_3bis8: number;
  S2_5K: number;
  HinRueckrunde: string;
}

type EingabeData = RattenData | TageRennenData | PokalSargData | MeisterschaftBlitzData | KombiMeisterschaftData;

export async function saveEingabeAction(
  meisterschaftsId: number,
  spieltag: Date,
  spiel: string,
  data: EingabeData[],
  deletedIds: number[] = []
) {
  try {

    // Start einer Transaktion (wie im C#-Code)
    return await prisma.$transaction(async (tx) => {
      // 0. Gelöschte Einträge entfernen
      if (deletedIds.length > 0) {
        switch (spiel) {
          case "9er-ratten-kranz8":
            await tx.tbl9erRatten.deleteMany({ where: { ID: { in: deletedIds } } })
            for (const id of deletedIds) {
              const sql = `delete from tbl9erRatten where ID = ${id}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "delete", Command: sql, Tablename: "tbl9erRatten", Computername: "Server", Zeitstempel: new Date() }
              })
            }
            break
          case "6-tage-rennen":
            await tx.tblSpiel6TageRennen.deleteMany({ where: { ID: { in: deletedIds } } })
            for (const id of deletedIds) {
              const sql = `delete from tblSpiel6TageRennen where ID = ${id}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "delete", Command: sql, Tablename: "tblSpiel6TageRennen", Computername: "Server", Zeitstempel: new Date() }
              })
            }
            break
          case "pokal":
            await tx.tblSpielPokal.deleteMany({ where: { ID: { in: deletedIds } } })
            for (const id of deletedIds) {
              const sql = `delete from tblSpielPokal where ID = ${id}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "delete", Command: sql, Tablename: "tblSpielPokal", Computername: "Server", Zeitstempel: new Date() }
              })
            }
            break
          case "sargkegeln":
            await tx.tblSpielSargKegeln.deleteMany({ where: { ID: { in: deletedIds } } })
            for (const id of deletedIds) {
              const sql = `delete from tblSpielSargKegeln where ID = ${id}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "delete", Command: sql, Tablename: "tblSpielSargKegeln", Computername: "Server", Zeitstempel: new Date() }
              })
            }
            break
          case "meisterschaft":
            await tx.tblSpielMeisterschaft.deleteMany({ where: { ID: { in: deletedIds } } })
            for (const id of deletedIds) {
              const sql = `delete from tblSpielMeisterschaft where ID = ${id}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "delete", Command: sql, Tablename: "tblSpielMeisterschaft", Computername: "Server", Zeitstempel: new Date() }
              })
            }
            break
          case "blitztunier":
            await tx.tblSpielBlitztunier.deleteMany({ where: { ID: { in: deletedIds } } })
            for (const id of deletedIds) {
              const sql = `delete from tblSpielBlitztunier where ID = ${id}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "delete", Command: sql, Tablename: "tblSpielBlitztunier", Computername: "Server", Zeitstempel: new Date() }
              })
            }
            break
          case "kombimeisterschaft":
            await tx.tblSpielKombimeisterschaft.deleteMany({ where: { ID: { in: deletedIds } } })
            for (const id of deletedIds) {
              const sql = `delete from tblSpielKombimeisterschaft where ID = ${id}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "delete", Command: sql, Tablename: "tblSpielKombimeisterschaft", Computername: "Server", Zeitstempel: new Date() }
              })
            }
            break
        }
      }
      // 1. Spieltag suchen oder erstellen
      const spieltagSearch = toUTCDate(spieltag)

      let dbSpieltag = await tx.tblSpieltag.findFirst({
        where: {
          MeisterschaftsID: meisterschaftsId,
          Spieltag: spieltagSearch,
        },
      })

      if (!dbSpieltag) {
        dbSpieltag = await tx.tblSpieltag.create({
          data: {
            MeisterschaftsID: meisterschaftsId,
            Spieltag: spieltagSearch,
            InBearbeitung: true,
          },
        })

        // Log für Spieltag Insert
        const year = spieltagSearch.getUTCFullYear()
        const month = String(spieltagSearch.getUTCMonth() + 1).padStart(2, '0')
        const day = String(spieltagSearch.getUTCDate()).padStart(2, '0')
        const localDateString = `${year}${month}${day}`
        const sqlInsertSpieltag = `insert into tblSpieltag(ID, MeisterschaftsID, Spieltag, InBearbeitung) values(${dbSpieltag.ID}, ${meisterschaftsId}, '${localDateString}', 0)`
        await tx.tblDBChangeLog.create({
          data: {
            Changetype: "insert",
            Command: sqlInsertSpieltag,
            Tablename: "tblSpieltag",
            Computername: "Server",
            Zeitstempel: new Date(),
          },
        })
      }

      const spieltagId = dbSpieltag.ID

      // 2. Daten speichern je nach Spieltyp
      switch (spiel) {
        case "9er-ratten-kranz8":
          for (const item of data as RattenData[]) {
            const existing = item.ID 
              ? await tx.tbl9erRatten.findUnique({ where: { ID: item.ID } })
              : await tx.tbl9erRatten.findFirst({
                  where: { SpieltagID: spieltagId, SpielerID: item.SpielerID }
                })

            if (!existing) {
              const created = await tx.tbl9erRatten.create({
                data: {
                  SpieltagID: spieltagId,
                  SpielerID: item.SpielerID,
                  Neuner: item.Neuner,
                  Ratten: item.Ratten,
                  Kranzacht: item.Kranz8
                }
              })
              const sql = `insert into tbl9erRatten(ID, SpieltagID, SpielerID, Neuner, Ratten) values (${created.ID}, ${spieltagId}, ${item.SpielerID}, ${item.Neuner}, ${item.Ratten})`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "insert", Command: sql, Tablename: "tbl9erRatten", Computername: "Server", Zeitstempel: new Date() }
              })
            } else {
              if (existing.Neuner !== item.Neuner || existing.Ratten !== item.Ratten || existing.Kranzacht !== item.Kranz8) {
                await tx.tbl9erRatten.update({
                  where: { ID: existing.ID },
                  data: { Neuner: item.Neuner, Ratten: item.Ratten, Kranzacht: item.Kranz8 }
                })
                const sql = `update tbl9erRatten set Neuner = ${item.Neuner}, Ratten = ${item.Ratten} where ID = ${existing.ID}`
                await tx.tblDBChangeLog.create({
                  data: { Changetype: "update", Command: sql, Tablename: "tbl9erRatten", Computername: "Server", Zeitstempel: new Date() }
                })
              }
            }
          }
          break

        case "6-tage-rennen":
          for (const item of data as TageRennenData[]) {
            const existing = item.ID
              ? await tx.tblSpiel6TageRennen.findUnique({ where: { ID: item.ID } })
              : await tx.tblSpiel6TageRennen.findFirst({
                  where: { SpieltagID: spieltagId, SpielerID1: item.Spieler1ID, SpielerID2: item.Spieler2ID }
                })

            if (!existing) {
              const created = await tx.tblSpiel6TageRennen.create({
                data: {
                  SpieltagID: spieltagId,
                  SpielerID1: item.Spieler1ID,
                  SpielerID2: item.Spieler2ID,
                  Runden: item.Runden,
                  Punkte: item.Punkte,
                  Spielnummer: item.Spielnr
                }
              })
              const sql = `insert into tblSpiel6TageRennen(ID, SpieltagID, SpielerID1, SpielerID2, Runden, Punkte, Spielnummer) values (${created.ID}, ${spieltagId}, ${item.Spieler1ID}, ${item.Spieler2ID}, ${item.Runden}, ${item.Punkte}, ${item.Spielnr})`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "insert", Command: sql, Tablename: "tblSpiel6TageRennen", Computername: "Server", Zeitstempel: new Date() }
              })
            } else {
              if (existing.Runden !== item.Runden || existing.Punkte !== item.Punkte || existing.Spielnummer !== item.Spielnr) {
                await tx.tblSpiel6TageRennen.update({
                  where: { ID: existing.ID },
                  data: { Runden: item.Runden, Punkte: item.Punkte, Spielnummer: item.Spielnr }
                })
                const sql = `update tblSpiel6TageRennen set Runden = ${item.Runden}, Punkte = ${item.Punkte}, Spielnummer = ${item.Spielnr} where ID = ${existing.ID}`
                await tx.tblDBChangeLog.create({
                  data: { Changetype: "update", Command: sql, Tablename: "tblSpiel6TageRennen", Computername: "Server", Zeitstempel: new Date() }
                })
              }
            }
          }
          break

        case "pokal":
          for (const item of data as PokalSargData[]) {
            const existing = item.ID
              ? await tx.tblSpielPokal.findUnique({ where: { ID: item.ID } })
              : await tx.tblSpielPokal.findFirst({
                  where: { SpieltagID: spieltagId, SpielerID: item.SpielerID }
                })
            if (!existing) {
              const created = await tx.tblSpielPokal.create({
                data: { SpieltagID: spieltagId, SpielerID: item.SpielerID, Platzierung: item.Platzierung }
              })
              const sql = `insert into tblSpielPokal(ID, SpieltagID, SpielerID, Platzierung) values (${created.ID}, ${spieltagId}, ${item.SpielerID}, ${item.Platzierung})`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "insert", Command: sql, Tablename: "tblSpielPokal", Computername: "Server", Zeitstempel: new Date() }
              })
            } else if (existing.Platzierung !== item.Platzierung) {
              await tx.tblSpielPokal.update({
                where: { ID: existing.ID },
                data: { Platzierung: item.Platzierung }
              })
              const sql = `update tblSpielPokal set Platzierung = ${item.Platzierung} where ID = ${existing.ID}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "update", Command: sql, Tablename: "tblSpielPokal", Computername: "Server", Zeitstempel: new Date() }
              })
            }
          }
          break

        case "sargkegeln":
          for (const item of data as PokalSargData[]) {
            const existing = item.ID
              ? await tx.tblSpielSargKegeln.findUnique({ where: { ID: item.ID } })
              : await tx.tblSpielSargKegeln.findFirst({
                  where: { SpieltagID: spieltagId, SpielerID: item.SpielerID }
                })
            if (!existing) {
              const created = await tx.tblSpielSargKegeln.create({
                data: { SpieltagID: spieltagId, SpielerID: item.SpielerID, Platzierung: item.Platzierung }
              })
              const sql = `insert into tblSpielSargKegeln(ID, SpieltagID, SpielerID, Platzierung) values (${created.ID}, ${spieltagId}, ${item.SpielerID}, ${item.Platzierung})`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "insert", Command: sql, Tablename: "tblSpielSargKegeln", Computername: "Server", Zeitstempel: new Date() }
              })
            } else if (existing.Platzierung !== item.Platzierung) {
              await tx.tblSpielSargKegeln.update({
                where: { ID: existing.ID },
                data: { Platzierung: item.Platzierung }
              })
              const sql = `update tblSpielSargKegeln set Platzierung = ${item.Platzierung} where ID = ${existing.ID}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "update", Command: sql, Tablename: "tblSpielSargKegeln", Computername: "Server", Zeitstempel: new Date() }
              })
            }
          }
          break

        case "meisterschaft":
          for (const item of data as MeisterschaftBlitzData[]) {
            const existing = item.ID
              ? await tx.tblSpielMeisterschaft.findUnique({ where: { ID: item.ID } })
              : await tx.tblSpielMeisterschaft.findFirst({
                  where: { SpieltagID: spieltagId, SpielerID1: item.Spieler1ID, SpielerID2: item.Spieler2ID }
                })
            const hinRueckInt = item.HinRueckrunde === "Rückrunde" ? 1 : 0
            if (!existing) {
              const created = await tx.tblSpielMeisterschaft.create({
                data: {
                  SpieltagID: spieltagId,
                  SpielerID1: item.Spieler1ID,
                  SpielerID2: item.Spieler2ID,
                  HolzSpieler1: item.Wert1,
                  HolzSpieler2: item.Wert2,
                  HinRueckrunde: hinRueckInt
                }
              })
              const sql = `insert into tblSpielMeisterschaft(ID, SpieltagID, SpielerID1, SpielerID2, HolzSpieler1, HolzSpieler2, HinRückrunde) values (${created.ID}, ${spieltagId}, ${item.Spieler1ID}, ${item.Spieler2ID}, ${item.Wert1}, ${item.Wert2}, ${hinRueckInt})`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "insert", Command: sql, Tablename: "tblSpielMeisterschaft", Computername: "Server", Zeitstempel: new Date() }
              })
            } else if (existing.HolzSpieler1 !== item.Wert1 || existing.HolzSpieler2 !== item.Wert2 || existing.HinRueckrunde !== hinRueckInt) {
              await tx.tblSpielMeisterschaft.update({
                where: { ID: existing.ID },
                data: { HolzSpieler1: item.Wert1, HolzSpieler2: item.Wert2, HinRueckrunde: hinRueckInt }
              })
              const sql = `update tblSpielMeisterschaft set HolzSpieler1 = ${item.Wert1}, HolzSpieler2 = ${item.Wert2}, HinRückrunde = ${hinRueckInt} where ID = ${existing.ID}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "update", Command: sql, Tablename: "tblSpielMeisterschaft", Computername: "Server", Zeitstempel: new Date() }
              })
            }
          }
          break

        case "blitztunier":
          for (const item of data as MeisterschaftBlitzData[]) {
            const existing = item.ID
              ? await tx.tblSpielBlitztunier.findUnique({ where: { ID: item.ID } })
              : await tx.tblSpielBlitztunier.findFirst({
                  where: { SpieltagID: spieltagId, SpielerID1: item.Spieler1ID, SpielerID2: item.Spieler2ID }
                })
            const hinRueckInt = item.HinRueckrunde === "Rückrunde" ? 1 : 0
            if (!existing) {
              const created = await tx.tblSpielBlitztunier.create({
                data: {
                  SpieltagID: spieltagId,
                  SpielerID1: item.Spieler1ID,
                  SpielerID2: item.Spieler2ID,
                  PunkteSpieler1: item.Wert1,
                  PunkteSpieler2: item.Wert2,
                  HinR_ckrunde: hinRueckInt
                }
              })
              const sql = `insert into tblSpielBlitztunier(ID, SpieltagID, SpielerID1, SpielerID2, PunkteSpieler1, PunkteSpieler2, HinRückrunde) values (${created.ID}, ${spieltagId}, ${item.Spieler1ID}, ${item.Spieler2ID}, ${item.Wert1}, ${item.Wert2}, ${hinRueckInt})`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "insert", Command: sql, Tablename: "tblSpielBlitztunier", Computername: "Server", Zeitstempel: new Date() }
              })
            } else if (existing.PunkteSpieler1 !== item.Wert1 || existing.PunkteSpieler2 !== item.Wert2 || existing.HinR_ckrunde !== hinRueckInt) {
              await tx.tblSpielBlitztunier.update({
                where: { ID: existing.ID },
                data: { PunkteSpieler1: item.Wert1, PunkteSpieler2: item.Wert2, HinR_ckrunde: hinRueckInt }
              })
              const sql = `update tblSpielBlitztunier set PunkteSpieler1 = ${item.Wert1}, PunkteSpieler2 = ${item.Wert2}, HinRückrunde = ${hinRueckInt} where ID = ${existing.ID}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "update", Command: sql, Tablename: "tblSpielBlitztunier", Computername: "Server", Zeitstempel: new Date() }
              })
            }
          }
          break

        case "kombimeisterschaft":
          for (const item of data as KombiMeisterschaftData[]) {
            const existing = item.ID
              ? await tx.tblSpielKombimeisterschaft.findUnique({ where: { ID: item.ID } })
              : await tx.tblSpielKombimeisterschaft.findFirst({
                  where: { SpieltagID: spieltagId, SpielerID1: item.Spieler1ID, SpielerID2: item.Spieler2ID }
                })
            const hinRueckInt = item.HinRueckrunde === "Rückrunde" ? 1 : 0
            if (!existing) {
              const created = await tx.tblSpielKombimeisterschaft.create({
                data: {
                  SpieltagID: spieltagId,
                  SpielerID1: item.Spieler1ID,
                  SpielerID2: item.Spieler2ID,
                  Spieler1Punkte3bis8: item.S1_3bis8,
                  Spieler1Punkte5Kugeln: item.S1_5K,
                  Spieler2Punkte3bis8: item.S2_3bis8,
                  Spieler2Punkte5Kugeln: item.S2_5K,
                  HinRueckrunde: hinRueckInt
                }
              })
              const sql = `insert into tblSpielKombimeisterschaft(ID, SpieltagID, SpielerID1, SpielerID2, Spieler1Punkte3bis8, Spieler1Punkte5Kugeln, Spieler2Punkte3bis8, Spieler2Punkte5Kugeln, HinRückrunde) values (${created.ID}, ${spieltagId}, ${item.Spieler1ID}, ${item.Spieler2ID}, ${item.S1_3bis8}, ${item.S1_5K}, ${item.S2_3bis8}, ${item.S2_5K}, ${hinRueckInt})`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "insert", Command: sql, Tablename: "tblSpielKombimeisterschaft", Computername: "Server", Zeitstempel: new Date() }
              })
            } else if (
              existing.Spieler1Punkte3bis8 !== item.S1_3bis8 || 
              existing.Spieler1Punkte5Kugeln !== item.S1_5K ||
              existing.Spieler2Punkte3bis8 !== item.S2_3bis8 ||
              existing.Spieler2Punkte5Kugeln !== item.S2_5K ||
              existing.HinRueckrunde !== hinRueckInt
            ) {
              await tx.tblSpielKombimeisterschaft.update({
                where: { ID: existing.ID },
                data: {
                  Spieler1Punkte3bis8: item.S1_3bis8,
                  Spieler1Punkte5Kugeln: item.S1_5K,
                  Spieler2Punkte3bis8: item.S2_3bis8,
                  Spieler2Punkte5Kugeln: item.S2_5K,
                  HinRueckrunde: hinRueckInt
                }
              })
              const sql = `update tblSpielKombimeisterschaft set Spieler1Punkte3bis8 = ${item.S1_3bis8}, Spieler1Punkte5Kugeln = ${item.S1_5K}, Spieler2Punkte3bis8 = ${item.S2_3bis8}, Spieler2Punkte5Kugeln = ${item.S2_5K}, HinRückrunde = ${hinRueckInt} where ID = ${existing.ID}`
              await tx.tblDBChangeLog.create({
                data: { Changetype: "update", Command: sql, Tablename: "tblSpielKombimeisterschaft", Computername: "Server", Zeitstempel: new Date() }
              })
            }
          }
          break
      }

      return { success: true }
    })
  } catch (error) {
    console.error("Save error:", error)
    return { success: false, error: String(error) }
  } finally {
    revalidatePath("/verwaltung/eingabe")
  }
}
