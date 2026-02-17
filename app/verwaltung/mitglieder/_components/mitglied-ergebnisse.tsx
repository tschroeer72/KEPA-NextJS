"use client"

import { useEffect, useState } from "react"
import { getStatistikSpielerErgebnisse } from "@/app/actions/db/statistik/actions"
import { StatistikSpielerErgebnisse } from "@/interfaces/statistik-spieler-ergebnisse"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface MitgliedErgebnisseProps {
  spielerId: number
}

export default function MitgliedErgebnisse({ spielerId }: MitgliedErgebnisseProps) {
  const [ergebnisse, setErgebnisse] = useState<StatistikSpielerErgebnisse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchErgebnisse = async () => {
      setLoading(true)
      try {
        const data = await getStatistikSpielerErgebnisse(spielerId)
        setErgebnisse(data)
      } catch (error) {
        console.error("Fehler beim Laden der Ergebnisse:", error)
      } finally {
        setLoading(false)
      }
    }

    if (spielerId > 0) {
      fetchErgebnisse()
    }
  }, [spielerId])

  if (loading) {
    return <p className="text-sm text-muted-foreground italic">Lade Ergebnisse...</p>
  }

  if (ergebnisse.length === 0) {
    return <p className="text-sm text-muted-foreground italic">Keine Ergebnisse für dieses Mitglied gefunden.</p>
  }

  return (
    <div className="mt-4 border rounded-md">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[130px]">Spieltag</TableHead>
              <TableHead className="min-w-[250px]">Meisterschaft</TableHead>
              <TableHead className="min-w-[250px]">Gegenspieler</TableHead>
              <TableHead className="min-w-[50px]">Erg.</TableHead>
              <TableHead className="min-w-[50px]">Holz</TableHead>
              <TableHead className="min-w-[250px]">6-Tage-Rennen Runden</TableHead>
              <TableHead className="min-w-[250px]">6-Tage-Rennen Punkte</TableHead>
              <TableHead className="min-w-[250px]">6-Tage-Rennen Platz</TableHead>
              <TableHead className="min-w-[60px]">Sarg</TableHead>
              <TableHead className="min-w-[70px]">Pokal</TableHead>
              <TableHead className="min-w-[100px]">Neuner</TableHead>
              <TableHead className="min-w-[90px]">Ratten</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ergebnisse.map((erg, index) => (
              <TableRow key={index}>
                <TableCell>{format(new Date(erg.Spieltag), "dd.MM.yyyy", { locale: de })}</TableCell>
                <TableCell>{erg.Meisterschaft}</TableCell>
                <TableCell>{erg.Gegenspieler || "-"}</TableCell>
                <TableCell>{erg.Ergebnis !== undefined ? erg.Ergebnis : "-"}</TableCell>
                <TableCell>{erg.Holz !== undefined ? erg.Holz : "-"}</TableCell>
                <TableCell>{erg.SechsTageRennen_Runden !== undefined ? erg.SechsTageRennen_Runden : "-"}</TableCell>
                <TableCell>{erg.SechsTageRennen_Punkte !== undefined ? erg.SechsTageRennen_Punkte : "-"}</TableCell>
                <TableCell>{erg.SechsTageRennen_Platz !== undefined ? erg.SechsTageRennen_Platz : "-"}</TableCell>
                <TableCell>{erg.Sarg !== undefined ? erg.Sarg : "-"}</TableCell>
                <TableCell>{erg.Pokal !== undefined ? erg.Pokal : "-"}</TableCell>
                <TableCell>{erg.Neuner !== undefined ? erg.Neuner : "-"}</TableCell>
                <TableCell>{erg.Ratten !== undefined ? erg.Ratten : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
