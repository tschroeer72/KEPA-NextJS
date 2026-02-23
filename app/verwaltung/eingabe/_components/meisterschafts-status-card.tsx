"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { updateMeisterschaft } from "@/app/actions/verwaltung/meisterschaften/actions"
import { toast } from "sonner"

type Meisterschaft = {
  ID: number
  Bezeichnung: string
  Aktiv: number
  tblMeisterschaftstyp?: {
    Meisterschaftstyp: string
  } | null
}

type Props = {
  aktiveMeisterschaft: Meisterschaft | null | undefined
  allMeisterschaften: Meisterschaft[]
  className?: string
}

export default function MeisterschaftsStatusCard({
  aktiveMeisterschaft,
  allMeisterschaften,
  className,
}: Props) {
  const router = useRouter()
  const [selectedId, setSelectedId] = React.useState<string>("")
  const [isUpdating, setIsUpdating] = React.useState(false)

  const handleSetActive = async () => {
    if (!selectedId) return
    setIsUpdating(true)
    try {
      const result = await updateMeisterschaft(parseInt(selectedId), { Aktiv: 1 })
      if (result.success) {
        toast.success("Meisterschaft wurde aktiviert")
        router.refresh()
      } else {
        toast.error(result.error || "Fehler beim Aktivieren")
      }
    } catch (error) {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsUpdating(false)
    }
  }

  if (aktiveMeisterschaft) {
    return (
      <Card className={className}>
        <CardHeader className="py-4 flex flex-col items-center">
          <div className="flex items-baseline gap-2 justify-center">
            <CardTitle>{aktiveMeisterschaft.Bezeichnung}</CardTitle>
            <span className="text-sm text-muted-foreground">
              {aktiveMeisterschaft.tblMeisterschaftstyp?.Meisterschaftstyp}
            </span>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="py-4 text-center">
        <CardTitle>Keine aktive Meisterschaft</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex flex-col gap-2 flex-1">
          <label className="text-sm font-medium">Meisterschaft aktivieren</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Meisterschaft auswählen" />
            </SelectTrigger>
            <SelectContent>
              {allMeisterschaften.map((m) => (
                <SelectItem key={m.ID} value={m.ID.toString()}>
                  {m.Bezeichnung} ({m.tblMeisterschaftstyp?.Meisterschaftstyp})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSetActive} 
            disabled={!selectedId || isUpdating}
          >
            Aktivieren
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push("/verwaltung/meisterschaften")}
          >
            Zur Meisterschaftsseite
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
