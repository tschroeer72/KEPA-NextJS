'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function deleteEingabeRowAction(id: number, spiel: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      let tableName = ""
      
      switch (spiel) {
        case "9er-ratten-kranz8":
          tableName = "tbl9erRatten"
          await tx.tbl9erRatten.delete({ where: { ID: id } })
          break
        case "6-tage-rennen":
          tableName = "tblSpiel6TageRennen"
          await tx.tblSpiel6TageRennen.delete({ where: { ID: id } })
          break
        case "pokal":
          tableName = "tblSpielPokal"
          await tx.tblSpielPokal.delete({ where: { ID: id } })
          break
        case "sargkegeln":
          tableName = "tblSpielSargKegeln"
          await tx.tblSpielSargKegeln.delete({ where: { ID: id } })
          break
        case "meisterschaft":
          tableName = "tblSpielMeisterschaft"
          await tx.tblSpielMeisterschaft.delete({ where: { ID: id } })
          break
        case "blitztunier":
          tableName = "tblSpielBlitztunier"
          await tx.tblSpielBlitztunier.delete({ where: { ID: id } })
          break
        case "kombimeisterschaft":
          tableName = "tblSpielKombimeisterschaft"
          await tx.tblSpielKombimeisterschaft.delete({ where: { ID: id } })
          break
        default:
          throw new Error("Unbekannter Spieltyp")
      }

      const sql = `delete from ${tableName} where ID = ${id}`
      await tx.tblDBChangeLog.create({
        data: { 
          Changetype: "delete", 
          Command: sql, 
          Tablename: tableName, 
          Computername: "Server", 
          Zeitstempel: new Date() 
        }
      })

      return { success: true }
    })
  } catch (error) {
    console.error("Delete error:", error)
    return { success: false, error: String(error) }
  } finally {
    revalidatePath("/verwaltung/eingabe")
  }
}
