"use client"

import * as React from "react"
import AuswahlCard from "@/app/verwaltung/eingabe/_components/auswahl-card"
import ErgebniseingabeCard from "@/app/verwaltung/eingabe/_components/ergebniseingabe-card"
import GenericErgebnisCard from "@/components/generic-ergebnis-card"
import { SpieleType } from "@/types/spiele-type"
import { AktiverMitspieler } from "@/interfaces/aktiver-mitspieler"
import { getKontrollausgabeAction } from "@/app/actions/verwaltung/eingabe"

type Props = {
  mitglieder: AktiverMitspieler[]
  meisterschaftsId: number | undefined
}

export default function EingabeContent({ mitglieder, meisterschaftsId }: Props) {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [spiel, setSpiel] = React.useState<string>(SpieleType[0]?.value)
  const [spielNr, setSpielNr] = React.useState<string>("1")
  const [kontrollData, setKontrollData] = React.useState<any>(null)

  const loadKontrollData = React.useCallback(async () => {
    if (date) {
      const result = await getKontrollausgabeAction(date)
      if (result.success) {
        setKontrollData(result.data)
      }
    }
  }, [date])

  React.useEffect(() => {
    loadKontrollData()
  }, [loadKontrollData])

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      {/* Erste Zeile: zwei Cards */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Linke Card: Kalender + Spielauswahl */}
        <AuswahlCard
          date={date}
          onDateChange={setDate}
          spiel={spiel}
          onSpielChange={setSpiel}
          spielNr={spielNr}
          onSpielNrChange={setSpielNr}
        />

        {/* Rechte Card: Tabelle mit Mitgliedern */}
        <ErgebniseingabeCard
          className="flex-1"
          mitglieder={mitglieder}
          spiel={spiel}
          date={date}
          meisterschaftsId={meisterschaftsId}
          onSaveSuccess={loadKontrollData}
        />
      </div>

      {/* Zweite Zeile: eine Card mit Tabs */}
      <GenericErgebnisCard
        title="Kontrollausgabe"
        spiel={spiel} 
        onSpielChange={setSpiel} 
        data={kontrollData}
      />
    </div>
  )
}
