import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
  }
}
