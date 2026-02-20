"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { de } from "date-fns/locale"
import { SpieleType } from "@/types/spiele-type"
import { fromUTCDate } from "@/lib/date-utils"

type Props = {
  date: Date | undefined
  onDateChange: (date: Date | undefined) => void
  spiel: string
  onSpielChange: (value: string) => void
  spielNr: string
  onSpielNrChange: (value: string) => void
  className?: string
  disabled?: boolean
}

export default function AuswahlCard({
  date,
  onDateChange,
  spiel,
  onSpielChange,
  spielNr,
  onSpielNrChange,
  className,
  disabled = false,
}: Props) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Auswahl</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 w-fit">
        <div>
          <Label className="mb-2">Datum</Label>
          <Calendar
            mode="single"
            selected={date ? fromUTCDate(date) : undefined}
            onSelect={onDateChange}
            className="rounded-md border"
            showOutsideDays={false}
            locale={de}
            disabled={disabled}
            formatters={{
              formatMonthDropdown: (d) =>
                d.toLocaleString("de-DE", { month: "short" }),
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="spielauswahl">Spielauswahl</Label>
          <Select value={spiel} onValueChange={onSpielChange} disabled={disabled}>
            <SelectTrigger id="spielauswahl" className="w-full">
              <SelectValue placeholder="Spiel auswählen" />
            </SelectTrigger>
            <SelectContent>
              {SpieleType.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {spiel === "6-tage-rennen" && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="spielnr">Spielnr.</Label>
            <Select value={spielNr} onValueChange={onSpielNrChange} disabled={disabled}>
              <SelectTrigger id="spielnr" className="w-full">
                <SelectValue placeholder="Spielnr. auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
