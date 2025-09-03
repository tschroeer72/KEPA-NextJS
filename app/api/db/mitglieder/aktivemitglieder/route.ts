import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { AktiverMitspieler } from '@/interfaces/aktiver-mitspieler'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
    try {
        const url = await Promise.resolve(new URL(request.url))
        const { searchParams } = url
        const meisterschaftsId = await Promise.resolve(searchParams.get('MeisterschaftID'))

        let dataMitglieder

        if (meisterschaftsId) {
            // Wenn MeisterschaftID übergeben wird, nur aktive Mitglieder zurückgeben,
            // die NICHT in tblTeilnehmer für diese Meisterschaft enthalten sind
            const meisterschaftsIdNumber = parseInt(meisterschaftsId)
            if (isNaN(meisterschaftsIdNumber)) {
                return NextResponse.json(
                    { error: 'Ungültige Meisterschafts-ID' },
                    { status: 400 }
                )
            }

            // Erst prüfen, ob überhaupt Teilnehmer für diese Meisterschaft existieren
            const existingTeilnehmer = await prisma.tblTeilnehmer.count({
                where: {
                    MeisterschaftsID: meisterschaftsIdNumber
                }
            })

            if (existingTeilnehmer === 0) {
                // Wenn keine Teilnehmer existieren, alle aktiven Mitglieder zurückgeben
                dataMitglieder = await prisma.tblMitglieder.findMany({
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
            } else {
                // Wenn Teilnehmer existieren, nur die ausschließen, die bereits teilnehmen
                dataMitglieder = await prisma.tblMitglieder.findMany({
                    orderBy: [
                        { Nachname: 'asc' },
                        { Vorname: 'asc' }
                    ],
                    where: {
                        PassivSeit: null,
                        // Mitglieder ausschließen, die bereits in tblTeilnehmer für diese Meisterschaft sind
                        NOT: {
                            tblTeilnehmer: {
                                some: {
                                    MeisterschaftsID: meisterschaftsIdNumber
                                }
                            }
                        }
                    },
                    select: {
                        ID: true,
                        Vorname: true,
                        Nachname: true,
                        Spitzname: true
                    }
                })
            }

            //console.log(dataMitglieder)
        } else {
            // Wenn keine MeisterschaftID übergeben wird, alle aktiven Mitglieder zurückgeben
            dataMitglieder = await prisma.tblMitglieder.findMany({
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
            //console.log(dataMitglieder)
        }

        // Transformiere die Daten entsprechend dem AktiverMitspieler Interface
        const aktiveMitglieder: AktiverMitspieler[] = dataMitglieder.map(mitglied => {
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

        return NextResponse.json(aktiveMitglieder)
    } catch (error) {
        console.error('Database error:', error)
        return NextResponse.json(
            { error: 'Fehler beim Abrufen der Mitglieder' },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}