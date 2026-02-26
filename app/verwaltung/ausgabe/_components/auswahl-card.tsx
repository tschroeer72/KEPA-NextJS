"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Printer } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { MeisterschaftWithTyp, Spieltag, getSpieltageByMeisterschaft } from "@/app/actions/verwaltung/common/actions"
import { format } from "date-fns"
import { de } from "date-fns/locale"

interface AuswahlCardProps {
  meisterschaften: MeisterschaftWithTyp[]
  onRefresh: (selectedSpieltagIds: number[]) => void
}

export function AuswahlCard({ meisterschaften, onRefresh }: AuswahlCardProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedMeisterschaft, setSelectedMeisterschaft] = React.useState<MeisterschaftWithTyp | null>(null)
  const [spieltage, setSpieltage] = React.useState<Spieltag[]>([])
  const [selectedSpieltagIds, setSelectedSpieltagIds] = React.useState<number[]>([])

  const handleMeisterschaftSelect = async (mId: string) => {
    const m = meisterschaften.find((item) => item.ID.toString() === mId)
    if (m) {
      setSelectedMeisterschaft(m)
      const tage = await getSpieltageByMeisterschaft(m.ID)
      setSpieltage(tage)
      setSelectedSpieltagIds(tage.map((t) => t.ID))
      setOpen(false)
    }
  }

  const toggleSpieltag = (id: number) => {
    setSelectedSpieltagIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedSpieltagIds.length === spieltage.length) {
      setSelectedSpieltagIds([])
    } else {
      setSelectedSpieltagIds(spieltage.map((t) => t.ID))
    }
  }

  const handlePdfClick = () => {
    if (!selectedMeisterschaft) return;

    let route = "";
    const type = selectedMeisterschaft.Meisterschaftstyp;
  console.log("Type", type);
    if (type === "Kurztunier" || type === "Blitztunier" || type === "Kurzturnier") {
      route = "/api/ausgabe/kurztunier";
    } else if (type === "Meisterschaft" || type === "Meisterschaft_Alt") {
      route = "/api/ausgabe/meisterschaft";
    } else if (type === "Kombimeisterschaft") {
      route = "/api/ausgabe/kombimeisterschaft";
    }
  console.log("Route", route);
    if (route) {
      window.open(`${route}?id=${selectedMeisterschaft.ID}`, "_blank");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Auswahl</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 flex flex-col">
          <Label>Meisterschaft</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {selectedMeisterschaft
                  ? selectedMeisterschaft.Bezeichnung
                  : "Meisterschaft wählen..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Meisterschaft suchen..." />
                <CommandList>
                  <CommandEmpty>Keine Meisterschaft gefunden.</CommandEmpty>
                  <CommandGroup>
                    {meisterschaften.map((m) => (
                      <CommandItem
                        key={m.ID}
                        value={m.ID.toString()}
                        onSelect={handleMeisterschaftSelect}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedMeisterschaft?.ID === m.ID ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {m.Bezeichnung}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {selectedMeisterschaft && (
          <div className="space-y-1">
            <Label className="text-muted-foreground">Typ</Label>
            <div className="font-medium">{selectedMeisterschaft.Meisterschaftstyp}</div>
          </div>
        )}

        {spieltage.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Spieltage</Label>
              <Button variant="ghost" size="sm" onClick={toggleAll}>
                {selectedSpieltagIds.length === spieltage.length ? "Keine auswählen" : "Alle auswählen"}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2">
              {spieltage.map((s) => (
                <div key={s.ID} className="flex items-center space-x-2">
                  <Checkbox
                    id={`spieltag-${s.ID}`}
                    checked={selectedSpieltagIds.includes(s.ID)}
                    onCheckedChange={() => toggleSpieltag(s.ID)}
                  />
                  <label
                    htmlFor={`spieltag-${s.ID}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {format(s.Spieltag, "dd.MM.yyyy", { locale: de })}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-4">
          <Button 
            className="w-full" 
            onClick={() => onRefresh(selectedSpieltagIds)}
            disabled={!selectedMeisterschaft}
          >
            Aktualisieren
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handlePdfClick}
            disabled={!selectedMeisterschaft}
          >
            <Printer className="mr-2 h-4 w-4" /> PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
