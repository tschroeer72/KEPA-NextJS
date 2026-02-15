"use server";

import { prisma } from "@/lib/prisma";

/**
 * Liest den aktuellen Wert der aktiven Meisterschaft aus `tblSettings`.
 * Es wird der Datensatz mit `Parametername = "AktiveMeisterschaft"` gelesen
 * (falls mehrere existieren, wird der zuletzt angelegte per ID absteigend gewählt).
 */
export async function getCurrentMeisterschaft(): Promise<string | null> {
  const setting = await prisma.tblSettings.findFirst({
    where: { Parametername: "AktiveMeisterschaft" },
    orderBy: { ID: "desc" },
    select: { Parameterwert: true },
  });

  return setting?.Parameterwert ?? null;
}


