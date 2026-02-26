"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { SpieleType } from "@/types/spiele-type"
import { ErgebnisseData, NeunerRattenResult, SechsTageRennenResult, PokalResult, SargkegelnResult, MeisterschaftResult, BlitztunierResult, KombimeisterschaftResult } from "@/app/actions/verwaltung/ausgabe/actions"

type Props = {
  spiel: string
  onSpielChange: (value: string) => void
  data: ErgebnisseData | null
  className?: string
  title: string
  disabled?: boolean
}

export default function GenericErgebnisCard({ spiel, onSpielChange, data, className, title, disabled = false }: Props) {
  const neunerRattenColumns: ColumnDef<NeunerRattenResult>[] = [
    { accessorKey: "Spieltag", header: "Spieltag" },
    { accessorKey: "Spielername", header: "Spieler" },
    { accessorKey: "Neuner", header: "Neuner" },
    { accessorKey: "Ratten", header: "Ratten" },
    { accessorKey: "Kranz8", header: "Kranz 8" },
  ]

  const sechsTageRennenColumns: ColumnDef<SechsTageRennenResult>[] = [
    { accessorKey: "Spieltag", header: "Spieltag" },
    { accessorKey: "Spieler1Name", header: "Spieler 1" },
    { accessorKey: "Spieler2Name", header: "Spieler 2" },
    { accessorKey: "Runden", header: "Runden" },
    { accessorKey: "Punkte", header: "Punkte" },
    { accessorKey: "Spielnr", header: "Spielnr" },
  ]

  const pokalColumns: ColumnDef<PokalResult>[] = [
    { accessorKey: "Spieltag", header: "Spieltag" },
    { accessorKey: "Spielername", header: "Spieler" },
    { accessorKey: "Platzierung", header: "Platzierung" },
  ]

  const sargkegelnColumns: ColumnDef<SargkegelnResult>[] = [
    { accessorKey: "Spieltag", header: "Spieltag" },
    { accessorKey: "Spielername", header: "Spieler" },
    { accessorKey: "Platzierung", header: "Platzierung" },
  ]

  const meisterschaftColumns: ColumnDef<MeisterschaftResult>[] = [
    { accessorKey: "Spieltag", header: "Spieltag" },
    { accessorKey: "Spieler1Name", header: "Spieler 1" },
    { accessorKey: "Spieler2Name", header: "Spieler 2" },
    { accessorKey: "HolzSpieler1", header: "Holz S1" },
    { accessorKey: "HolzSpieler2", header: "Holz S2" },
    { accessorKey: "HinRueckrunde", header: "Hin/Rück" },
  ]

  const blitztunierColumns: ColumnDef<BlitztunierResult>[] = [
    { accessorKey: "Spieltag", header: "Spieltag" },
    { accessorKey: "Spieler1Name", header: "Spieler 1" },
    { accessorKey: "Spieler2Name", header: "Spieler 2" },
    { accessorKey: "PunkteSpieler1", header: "Punkte S1" },
    { accessorKey: "PunkteSpieler2", header: "Punkte S2" },
    { accessorKey: "HinRueckrunde", header: "Hin/Rück" },
  ]

  const kombimeisterschaftColumns: ColumnDef<KombimeisterschaftResult>[] = [
    { accessorKey: "Spieltag", header: "Spieltag" },
    { accessorKey: "Spieler1Name", header: "Spieler 1" },
    { accessorKey: "Spieler2Name", header: "Spieler 2" },
    { accessorKey: "Spieler1Punkte3bis8", header: "S1 3-8" },
    { accessorKey: "Spieler1Punkte5Kugeln", header: "S1 5K" },
    { accessorKey: "Spieler2Punkte3bis8", header: "S2 3-8" },
    { accessorKey: "Spieler2Punkte5Kugeln", header: "S2 5K" },
    { accessorKey: "HinRueckrunde", header: "Hin/Rück" },
  ]

  const renderTableContent = (sValue: string) => {
    if (!data) return <div className="text-sm text-muted-foreground italic">Keine Daten für diesen Tag gefunden.</div>

    switch (sValue) {
      case "9er-ratten-kranz8":
        if (!data.neunerRatten || data.neunerRatten.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return <DataTable columns={neunerRattenColumns} data={data.neunerRatten} showColumnFilters alternateRowsBy="Spieltag" />

      case "6-tage-rennen":
        if (!data.sechsTageRennen || data.sechsTageRennen.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return <DataTable columns={sechsTageRennenColumns} data={data.sechsTageRennen} showColumnFilters alternateRowsBy="Spieltag" />

      case "pokal":
        if (!data.pokal || data.pokal.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return <DataTable columns={pokalColumns} data={data.pokal} showColumnFilters alternateRowsBy="Spieltag" />

      case "sargkegeln":
        if (!data.sargkegeln || data.sargkegeln.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return <DataTable columns={sargkegelnColumns} data={data.sargkegeln} showColumnFilters alternateRowsBy="Spieltag" />

      case "meisterschaft":
        if (!data.meisterschaft || data.meisterschaft.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return <DataTable columns={meisterschaftColumns} data={data.meisterschaft} showColumnFilters alternateRowsBy="Spieltag" />

      case "blitztunier":
        if (!data.blitztunier || data.blitztunier.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return <DataTable columns={blitztunierColumns} data={data.blitztunier} showColumnFilters alternateRowsBy="Spieltag" />

      case "kombimeisterschaft":
        if (!data.kombimeisterschaft || data.kombimeisterschaft.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return <DataTable columns={kombimeisterschaftColumns} data={data.kombimeisterschaft} showColumnFilters alternateRowsBy="Spieltag" />

      default:
        return <div className="text-sm text-muted-foreground">Unbekanntes Spiel</div>
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={spiel} onValueChange={onSpielChange} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto">
            {SpieleType.map((s) => (
              <TabsTrigger key={s.value} value={s.value} disabled={disabled}>
                {s.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {SpieleType.map((s) => (
            <TabsContent key={s.value} value={s.value} className="mt-0">
              {renderTableContent(s.value)}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
