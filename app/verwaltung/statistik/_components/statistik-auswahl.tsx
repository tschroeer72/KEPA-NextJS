"use client"

import * as React from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function StatistikAuswahl({ value, onValueChange }: { value: string, onValueChange: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Auswahl</h3>
      <RadioGroup value={value} onValueChange={onValueChange} className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="neuner" id="neuner" />
            <Label htmlFor="neuner">Neuner</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ratten" id="ratten" />
            <Label htmlFor="ratten">Ratten</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="pokal" id="pokal" />
            <Label htmlFor="pokal">Pokal</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sarg" id="sarg" />
            <Label htmlFor="sarg">Sarg</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ergebnisse-spieler" id="ergebnisse-spieler" />
            <Label htmlFor="ergebnisse-spieler">Ergebnisse Spieler/Spieler</Label>
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="platzierung-6tage" id="platzierung-6tage" />
            <Label htmlFor="platzierung-6tage">Platzierung 6-Tage-Rennen</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="beste-mannschaft-6tage" id="beste-mannschaft-6tage" />
            <Label htmlFor="beste-mannschaft-6tage">Beste Mannschaft 6-Tage-Rennen</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mannschaft-mitglied-6tage" id="mannschaft-mitglied-6tage" />
            <Label htmlFor="mannschaft-mitglied-6tage">Mannschaft / Mitglied 6-Tage-Rennen</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="neunerkoenig-rattenorden" id="neunerkoenig-rattenorden" />
            <Label htmlFor="neunerkoenig-rattenorden">Neunerkönig / Rattenorden</Label>
          </div>
        </div>
      </RadioGroup>
    </div>
  )
}
