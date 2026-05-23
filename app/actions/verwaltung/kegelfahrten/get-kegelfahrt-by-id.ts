"use server";

import { prisma } from "@/lib/prisma";

export async function getKegelfahrtById(id: number) {
    try {
        const kegelfahrt = await prisma.tblKegelfahrten.findUnique({
            where: {
                ID: id,
            },
        });
        return kegelfahrt;
    } catch (error) {
        console.error("Fehler beim Laden der Kegelfahrt:", error);
        throw new Error("Kegelfahrt konnte nicht geladen werden.");
    }
}
