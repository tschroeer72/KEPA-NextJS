"use client"

import * as React from "react"
import { AuswahlCard } from "./auswahl-card"
import GenericErgebnisCard from "@/components/generic-ergebnis-card"
import { MeisterschaftWithTyp } from "@/app/actions/meisterschaften/actions"
import { getErgebnisse, ErgebnisseData } from "@/app/actions/ergebnisse/actions"

interface AusgabeContentProps {
  meisterschaften: MeisterschaftWithTyp[]
}

export function AusgabeContent({ meisterschaften }: AusgabeContentProps) {
  const [selectedSpiel, setSelectedSpiel] = React.useState("9er-ratten-kranz8")
  const [ergebnisse, setErgebnisse] = React.useState<ErgebnisseData | null>(null)

  const handleRefresh = async (ids: number[]) => {
    const data = await getErgebnisse(ids)
    setErgebnisse(data)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full max-w-7xl mx-auto p-4">
      <div className="md:col-span-4">
        <AuswahlCard 
          meisterschaften={meisterschaften} 
          onRefresh={handleRefresh} 
        />
      </div>
      <div className="md:col-span-8">
        <GenericErgebnisCard 
          title="Spielergebnisse"
          spiel={selectedSpiel} 
          onSpielChange={setSelectedSpiel} 
          data={ergebnisse}
        />
      </div>
    </div>
  )
}
