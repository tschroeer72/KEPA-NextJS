import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export { prisma };

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

/** Leert alle Tabellen in FK-sicherer Reihenfolge. */
export async function resetDb() {
  await prisma.tbl9erRatten.deleteMany();
  await prisma.tblSpiel6TageRennen.deleteMany();
  await prisma.tblSpielBlitztunier.deleteMany();
  await prisma.tblSpielKombimeisterschaft.deleteMany();
  await prisma.tblSpielMeisterschaft.deleteMany();
  await prisma.tblSpielPokal.deleteMany();
  await prisma.tblSpielSargKegeln.deleteMany();
  await prisma.tblSpieltag.deleteMany();
  await prisma.tblTeilnehmer.deleteMany();
  await prisma.tblMeisterschaften.deleteMany();
  await prisma.tblMeisterschaftstyp.deleteMany();
  await prisma.tblMitglieder.deleteMany();
  await prisma.tblSettings.deleteMany();
  await prisma.tblDBChangeLog.deleteMany();
  await prisma.tblKegelfahrten.deleteMany();
}

export const TEST_LOGIN = { user: "hans", password: "geheim" };

/** Legt Typ, 4 Mitglieder (eines mit Login), eine Meisterschaft und Teilnehmer an. */
export async function seedBasis() {
  const typ = await prisma.tblMeisterschaftstyp.create({ data: { Meisterschaftstyp: "Meisterschaft" } });

  const namen = [
    { Vorname: "Hans", Nachname: "Meier", Spitzname: "Hansi" },
    { Vorname: "Karl", Nachname: "Schmidt", Spitzname: null },
    { Vorname: "Otto", Nachname: "Becker", Spitzname: "Otti" },
    { Vorname: "Willi", Nachname: "Wagner", Spitzname: null },
  ];
  const mitglieder = [];
  for (const [i, n] of namen.entries()) {
    mitglieder.push(
      await prisma.tblMitglieder.create({
        data: {
          ...n,
          MitgliedSeit: new Date("2015-01-01"),
          Ehemaliger: false,
          EMail: `${n.Vorname.toLowerCase()}@example.com`,
          ...(i === 0 ? { Login: TEST_LOGIN.user, Password: sha256(TEST_LOGIN.password) } : {}),
        },
      })
    );
  }

  const meisterschaft = await prisma.tblMeisterschaften.create({
    data: {
      Bezeichnung: "Testmeisterschaft",
      Beginn: new Date("2025-01-01"),
      MeisterschaftstypID: typ.ID,
      Aktiv: 1,
    },
  });
  for (const m of mitglieder) {
    await prisma.tblTeilnehmer.create({ data: { MeisterschaftsID: meisterschaft.ID, SpielerID: m.ID } });
  }

  return { typ, mitglieder, meisterschaft };
}
