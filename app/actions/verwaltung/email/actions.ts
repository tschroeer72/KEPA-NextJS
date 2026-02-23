"use server"

import { prisma } from '@/lib/prisma'

export async function getMembersForEmail() {
  try {
    const members = await prisma.tblMitglieder.findMany({
      where: {
        AusgeschiedenAm: null,
        Ehemaliger: false,
      },
      select: {
        ID: true,
        Vorname: true,
        Nachname: true,
        EMail: true,
        PassivSeit: true,
      },
      orderBy: {
        Nachname: 'asc'
      }
    });

    const validMembers = members.filter(m => 
      m.EMail && 
      m.EMail.trim() !== "" && 
      m.EMail.includes("@")
    );

    return { success: true, data: validMembers };
  } catch (error) {
    console.error("Error fetching members for email:", error);
    return { success: false, error: "Fehler beim Laden der Mitglieder" };
  }
}
