"use client"

import * as React from "react"
import AuswahlCard from "@/app/verwaltung/eingabe/_components/auswahl-card"
import ErgebniseingabeCard, { InitialData } from "@/app/verwaltung/eingabe/_components/ergebniseingabe-card"
import GenericErgebnisCard from "@/components/generic-ergebnis-card"
import { SpieleType } from "@/types/spiele-type"
import { AktiverMitspieler } from "@/interfaces/aktiver-mitspieler"
import { getKontrollausgabeAction } from "@/app/actions/verwaltung/eingabe"
import MeisterschaftsStatusCard from "./meisterschafts-status-card"
import { toUTCDate } from "@/lib/date-utils"

type Meisterschaft = {
  ID: number
  Bezeichnung: string
  Aktiv: number
  tblMeisterschaftstyp?: {
    Meisterschaftstyp: string
  } | null
}

type Props = {
  mitglieder: AktiverMitspieler[]
  aktiveMeisterschaft: Meisterschaft | null | undefined
  allMeisterschaften: Meisterschaft[]
}

export default function EingabeContent({ mitglieder, aktiveMeisterschaft, allMeisterschaften }: Props) {
  const [date, setDate] = React.useState<Date | undefined>(toUTCDate(new Date()))
  const [spiel, setSpiel] = React.useState<string>(SpieleType[0]?.value)
  const [spielNr, setSpielNr] = React.useState<string>("1")
  const [kontrollData, setKontrollData] = React.useState<InitialData | null>(null)

  const meisterschaftsId = aktiveMeisterschaft?.ID
  const isDisabled = !aktiveMeisterschaft

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate ? toUTCDate(newDate) : undefined)
  }

  const loadKontrollData = React.useCallback(async () => {
    if (date) {
      const result = await getKontrollausgabeAction(date)
      if (result.success && result.data) {
        setKontrollData(result.data)
      } else {
        setKontrollData(null)
      }
    }
  }, [date])

  React.useEffect(() => {
    loadKontrollData()
  }, [loadKontrollData])

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <MeisterschaftsStatusCard 
        aktiveMeisterschaft={aktiveMeisterschaft}
        allMeisterschaften={allMeisterschaften}
      />

      {/* Erste Zeile: zwei Cards */}
      <div className="flex flex-col md:flex-row gap-4 items-start">
        {/* Linke Card: Kalender + Spielauswahl */}
        <AuswahlCard
          date={date}
          onDateChange={handleDateChange}
          spiel={spiel}
          onSpielChange={setSpiel}
          spielNr={spielNr}
          onSpielNrChange={setSpielNr}
          disabled={isDisabled}
        />

        {/* Rechte Card: Tabelle mit Mitgliedern */}
        <ErgebniseingabeCard
          className="flex-1"
          mitglieder={mitglieder}
          spiel={spiel}
          date={date}
          meisterschaftsId={meisterschaftsId}
          onSaveSuccess={loadKontrollData}
          disabled={isDisabled}
          initialData={kontrollData}
        />
      </div>

      {/* Zweite Zeile: eine Card mit Tabs */}
      <GenericErgebnisCard
        title="Kontrollausgabe"
        spiel={spiel} 
        onSpielChange={setSpiel} 
        data={kontrollData as any}
        disabled={isDisabled}
      />
    </div>
  )
}
