"use server"

import { prisma } from '@/lib/prisma'
import { createChangeLogAction } from '@/utils/change-log-action'

export async function getSettings() {
  try {
    const data = await prisma.tblSettings.findMany()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Fehler beim Abrufen der Einstellungen' }
  }
}

export async function updateSetting(id: number, value: string) {
  try {
    const data = await prisma.tblSettings.update({
      where: { ID: id },
      data: { Parameterwert: value }
    })
    await createChangeLogAction("tblSettings", "update", `update tblSettings set Parameterwert='${value}' where ID=${id}`)
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Fehler beim Aktualisieren der Einstellung' }
  }
}
