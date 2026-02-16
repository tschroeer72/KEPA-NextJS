"use client"

import * as React from "react"
import { format } from "date-fns"
import { de } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export function ZeitbereichAuswahl() {
  const [dateVon, setDateVon] = React.useState<Date>()
  const [dateBis, setDateBis] = React.useState<Date>()
  const [zeit, setZeit] = React.useState("laufende")

  const isIndividuell = zeit === "individuell"

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground border-b pb-1">Zeitbereich</h3>
      <RadioGroup value={zeit} onValueChange={setZeit} className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="laufende" id="laufende" />
          <Label htmlFor="laufende">Laufende Meisterschaft</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="letzte" id="letzte" />
          <Label htmlFor="letzte">Letzte Meisterschaft</Label>
        </div>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="individuell" id="individuell" />
            <Label htmlFor="individuell">Individueller Zeitbereich</Label>
          </div>
          <div className="flex flex-wrap items-center gap-2 pl-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Von</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !dateVon && "text-muted-foreground"
                    )}
                    disabled={!isIndividuell}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateVon ? format(dateVon, "dd.MM.yyyy") : <span>Datum</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateVon}
                    onSelect={setDateVon}
                    initialFocus
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Bis</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[140px] justify-start text-left font-normal",
                      !dateBis && "text-muted-foreground"
                    )}
                    disabled={!isIndividuell}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateBis ? format(dateBis, "dd.MM.yyyy") : <span>Datum</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateBis}
                    onSelect={setDateBis}
                    initialFocus
                    locale={de}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="gesamt" id="gesamt" />
          <Label htmlFor="gesamt">Gesamt</Label>
        </div>
      </RadioGroup>
    </div>
  )
}
