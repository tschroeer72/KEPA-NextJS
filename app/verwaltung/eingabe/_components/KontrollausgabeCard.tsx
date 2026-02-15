"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SpieleType } from "@/types/spiele-type"

type Props = {
  spiel: string
  onSpielChange: (value: string) => void
  data: any | null
  className?: string
}

export default function KontrollausgabeCard({ spiel, onSpielChange, data, className }: Props) {
  const renderTableContent = (sValue: string) => {
    if (!data) return <div className="text-sm text-muted-foreground italic">Keine Daten für diesen Tag gefunden.</div>

    switch (sValue) {
      case "9er-ratten-kranz8":
        if (!data.neunerRatten || data.neunerRatten.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spieler</TableHead>
                <TableHead>Neuner</TableHead>
                <TableHead>Ratten</TableHead>
                <TableHead>Kranz 8</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.neunerRatten.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{item.Spielername}</TableCell>
                  <TableCell>{item.Neuner}</TableCell>
                  <TableCell>{item.Ratten}</TableCell>
                  <TableCell>{item.Kranz8}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case "6-tage-rennen":
        if (!data.sechsTageRennen || data.sechsTageRennen.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spieler 1</TableHead>
                <TableHead>Spieler 2</TableHead>
                <TableHead>Runden</TableHead>
                <TableHead>Punkte</TableHead>
                <TableHead>Spielnr</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sechsTageRennen.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{item.Spieler1Name}</TableCell>
                  <TableCell>{item.Spieler2Name}</TableCell>
                  <TableCell>{item.Runden}</TableCell>
                  <TableCell>{item.Punkte}</TableCell>
                  <TableCell>{item.Spielnr}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case "pokal":
        if (!data.pokal || data.pokal.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spieler</TableHead>
                <TableHead>Platzierung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.pokal.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{item.Spielername}</TableCell>
                  <TableCell>{item.Platzierung}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case "sargkegeln":
        if (!data.sargkegeln || data.sargkegeln.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spieler</TableHead>
                <TableHead>Platzierung</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.sargkegeln.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{item.Spielername}</TableCell>
                  <TableCell>{item.Platzierung}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case "meisterschaft":
        if (!data.meisterschaft || data.meisterschaft.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spieler 1</TableHead>
                <TableHead>Spieler 2</TableHead>
                <TableHead>Holz S1</TableHead>
                <TableHead>Holz S2</TableHead>
                <TableHead>Hin/Rück</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.meisterschaft.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{item.Spieler1Name}</TableCell>
                  <TableCell>{item.Spieler2Name}</TableCell>
                  <TableCell>{item.HolzSpieler1}</TableCell>
                  <TableCell>{item.HolzSpieler2}</TableCell>
                  <TableCell>{item.HinRueckrunde}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case "blitztunier":
        if (!data.blitztunier || data.blitztunier.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spieler 1</TableHead>
                <TableHead>Spieler 2</TableHead>
                <TableHead>Punkte S1</TableHead>
                <TableHead>Punkte S2</TableHead>
                <TableHead>Hin/Rück</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.blitztunier.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{item.Spieler1Name}</TableCell>
                  <TableCell>{item.Spieler2Name}</TableCell>
                  <TableCell>{item.PunkteSpieler1}</TableCell>
                  <TableCell>{item.PunkteSpieler2}</TableCell>
                  <TableCell>{item.HinRueckrunde}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      case "kombimeisterschaft":
        if (!data.kombimeisterschaft || data.kombimeisterschaft.length === 0) return <div className="text-sm text-muted-foreground">Keine Ergebnisse eingetragen.</div>
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spieler 1</TableHead>
                <TableHead>Spieler 2</TableHead>
                <TableHead>S1 3-8</TableHead>
                <TableHead>S1 5K</TableHead>
                <TableHead>S2 3-8</TableHead>
                <TableHead>S2 5K</TableHead>
                <TableHead>Hin/Rück</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.kombimeisterschaft.map((item: any, i: number) => (
                <TableRow key={i}>
                  <TableCell>{item.Spieler1Name}</TableCell>
                  <TableCell>{item.Spieler2Name}</TableCell>
                  <TableCell>{item.Spieler1Punkte3bis8}</TableCell>
                  <TableCell>{item.Spieler1Punkte5Kugeln}</TableCell>
                  <TableCell>{item.Spieler2Punkte3bis8}</TableCell>
                  <TableCell>{item.Spieler2Punkte5Kugeln}</TableCell>
                  <TableCell>{item.HinRueckrunde}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )

      default:
        return <div className="text-sm text-muted-foreground">Unbekanntes Spiel</div>
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Kontrollausgabe</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={spiel} onValueChange={onSpielChange} className="w-full">
          <TabsList className="mb-4 flex-wrap h-auto">
            {SpieleType.map((s) => (
              <TabsTrigger key={s.value} value={s.value}>
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
