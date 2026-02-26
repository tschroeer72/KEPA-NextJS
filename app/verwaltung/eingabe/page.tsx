import { prisma } from '@/lib/prisma'
import { AktiverMitspieler } from '@/interfaces/aktiver-mitspieler'
import EingabeContent from "./_components/eingabe-content"

async function getAktiveMitglieder(meisterschaftsId?: number): Promise<AktiverMitspieler[]> {
  const whereClause: any = {
    PassivSeit: null
  }

  if (meisterschaftsId) {
    whereClause.tblTeilnehmer = {
      some: {
        MeisterschaftsID: meisterschaftsId
      }
    }
  }

  const dataMitglieder = await prisma.tblMitglieder.findMany({
    orderBy: [
      { Nachname: 'asc' },
      { Vorname: 'asc' }
    ],
    where: whereClause,
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
  return await prisma.tblMeisterschaften.findFirst({
    where: { Aktiv: 1 },
    include: {
      tblMeisterschaftstyp: true
    }
  })
}

async function getAllMeisterschaften() {
  return await prisma.tblMeisterschaften.findMany({
    orderBy: { ID: 'desc' },
    include: {
      tblMeisterschaftstyp: true
    }
  })
}

export default async function EingabePage() {
  const aktiveMeisterschaft = await getAktiveMeisterschaft()
  const mitglieder = await getAktiveMitglieder(aktiveMeisterschaft?.ID)
  const allMeisterschaften = await getAllMeisterschaften()

  return (
    <EingabeContent 
      mitglieder={mitglieder} 
      aktiveMeisterschaft={aktiveMeisterschaft} 
      allMeisterschaften={allMeisterschaften}
    />
  )
}