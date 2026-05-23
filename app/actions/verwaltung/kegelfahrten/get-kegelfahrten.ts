"use server";

import { prisma } from "@/lib/prisma";

export async function getKegelfahrten() {
    try {
        const kegelfahrten = await prisma.tblKegelfahrten.findMany({
            orderBy: {
                Jahr: "desc",
            },
        });
        return kegelfahrten;
    } catch (error) {
        console.error("Fehler beim Laden der Kegelfahrten:", error);
        throw new Error("Kegelfahrten konnten nicht geladen werden.");
    }
}
