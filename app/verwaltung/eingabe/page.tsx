import { prisma } from '@/lib/prisma'
import { AktiverMitspieler } from '@/interfaces/aktiver-mitspieler'
import EingabeContent from "./_components/eingabe-content"

async function getAktiveMitglieder(): Promise<AktiverMitspieler[]> {
  const dataMitglieder = await prisma.tblMitglieder.findMany({
    orderBy: [
      { Nachname: 'asc' },
      { Vorname: 'asc' }
    ],
    where: {
      PassivSeit: null
    },
    select: {
      ID: true,
      Vorname: true,
      Nachname: true,
      Spitzname: true
    }
  })

  return dataMitglieder.map((mitglied) => {
    const anzeigename = mitglied.Spitzname && mitglied.Spitzname.trim() !== ''
      ? mitglied.Spitzname
      : mitglied.Vorname

    return {
      ID: mitglied.ID,
      Vorname: mitglied.Vorname,
      Nachname: mitglied.Nachname,
      Spitzname: mitglied.Spitzname || '',
      Anzeigename: anzeigename
    }
  })
}

async function getAktiveMeisterschaft() {
  const meisterschaft = await prisma.tblMeisterschaften.findFirst({
    where: { Aktiv: 1 },
    select: { ID: true }
  })
  return meisterschaft?.ID
}

export default async function EingabePage() {
  const mitglieder = await getAktiveMitglieder()
  const meisterschaftsId = await getAktiveMeisterschaft()

  return <EingabeContent mitglieder={mitglieder} meisterschaftsId={meisterschaftsId} />
}