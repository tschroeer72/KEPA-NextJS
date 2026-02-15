"use server";

import { prisma } from "@/lib/prisma";
import { getComputerInfo } from "@/utils/get-computer-info";
import type { NextRequest } from "next/server";

/**
 * Setzt den Wert der aktiven Meisterschaft in `tblSettings`.
 * Dabei wird der `Computername` über `getComputerInfo(request)` ermittelt
 * und zusammen mit `Parametername = "AktiveMeisterschaft"` gespeichert.
 */
export async function setCurrentMeisterschaft(
  request: NextRequest,
  meisterschaft: string
): Promise<void> {
  const computername = getComputerInfo(request);

  // Versuche, existierenden Eintrag für diesen Computer und Parameter zu finden
  const existing = await prisma.tblSettings.findFirst({
    where: {
      Parametername: "AktiveMeisterschaft",
      Computername: computername,
    },
    select: { ID: true },
  });

  if (existing?.ID) {
    await prisma.tblSettings.update({
      where: { ID: existing.ID },
      data: { Parameterwert: meisterschaft },
    });
    return;
  }

  await prisma.tblSettings.create({
    data: {
      Computername: computername,
      Parametername: "AktiveMeisterschaft",
      Parameterwert: meisterschaft,
    },
  });
}
