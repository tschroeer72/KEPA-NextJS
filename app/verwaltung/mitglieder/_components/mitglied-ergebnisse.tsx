"use client"

import { useEffect, useState, useMemo } from "react"
import { getStatistikSpielerErgebnisse } from "@/app/actions/verwaltung/statistik/actions"
import { StatistikSpielerErgebnisse } from "@/interfaces/statistik-spieler-ergebnisse"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface MitgliedErgebnisseProps {
  spielerId: number
}

export default function MitgliedErgebnisse({ spielerId }: MitgliedErgebnisseProps) {
  const [ergebnisse, setErgebnisse] = useState<StatistikSpielerErgebnisse[]>([])
  const [loading, setLoading] = useState(true)

  const columns = useMemo<ColumnDef<StatistikSpielerErgebnisse>[]>(() => [
    {
      accessorKey: "Spieltag",
      header: "Spieltag",
      cell: ({ row }) => format(new Date(row.getValue("Spieltag")), "dd.MM.yyyy", { locale: de }),
      sortingFn: "datetime",
    },
    {
      accessorKey: "Meisterschaft",
      header: "Meisterschaft",
    },
    {
      accessorKey: "Gegenspieler",
      header: "Gegenspieler",
      cell: ({ row }) => row.getValue("Gegenspieler") || "-",
    },
    {
      accessorKey: "Ergebnis",
      header: "Erg.",
      cell: ({ row }) => row.getValue("Ergebnis") ?? "-",
    },
    {
      accessorKey: "Holz",
      header: "Holz",
      cell: ({ row }) => row.getValue("Holz") ?? "-",
    },
    {
      accessorKey: "SechsTageRennen_Runden",
      header: "6-Tage-Rennen Runden",
      cell: ({ row }) => row.getValue("SechsTageRennen_Runden") ?? "-",
    },
    {
      accessorKey: "SechsTageRennen_Punkte",
      header: "6-Tage-Rennen Punkte",
      cell: ({ row }) => row.getValue("SechsTageRennen_Punkte") ?? "-",
    },
    {
      accessorKey: "SechsTageRennen_Platz",
      header: "6-Tage-Rennen Platz",
      cell: ({ row }) => row.getValue("SechsTageRennen_Platz") ?? "-",
    },
    {
      accessorKey: "Sarg",
      header: "Sarg",
      cell: ({ row }) => row.getValue("Sarg") ?? "-",
    },
    {
      accessorKey: "Pokal",
      header: "Pokal",
      cell: ({ row }) => row.getValue("Pokal") ?? "-",
    },
    {
      accessorKey: "Neuner",
      header: "Neuner",
      cell: ({ row }) => row.getValue("Neuner") ?? "-",
    },
    {
      accessorKey: "Ratten",
      header: "Ratten",
      cell: ({ row }) => row.getValue("Ratten") ?? "-",
    },
  ], [])

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
    <div className="mt-4">
      <DataTable 
        columns={columns} 
        data={ergebnisse} 
        showColumnFilters 
        alternateRowsBy="Spieltag"
      />
    </div>
  )
}
