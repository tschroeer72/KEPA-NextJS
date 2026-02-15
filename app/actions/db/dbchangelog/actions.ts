"use server"

import { prisma } from '@/lib/prisma'

export async function getChangeLogs() {
  try {
    const data = await prisma.tblDBChangeLog.findMany({
      orderBy: { ID: 'desc' }
    })
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Fehler beim Abrufen der ChangeLogs' }
  }
}
