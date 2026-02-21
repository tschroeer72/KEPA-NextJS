import * as React from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AktiverMitspieler } from "@/interfaces/aktiver-mitspieler"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveEingabeAction } from "@/app/actions/verwaltung/eingabe"
import { deleteEingabeRowAction } from "@/app/actions/verwaltung/eingabe/delete-eingabe-row"
import { toast } from "sonner"

// Interfaces für die verschiedenen Spiel-Datentypen
interface NeunerRatten {
  ID?: number
  SpielerID: number
  Spielername: string
  Neuner: number
  Kranz8: number
  Ratten: number
}

interface SechsTageRennen {
  ID?: number
  Spieler1ID: number
  Spieler1Name: string
  Spieler2ID: number
  Spieler2Name: string
  Runden: number
  Punkte: number
  Spielnr: number | null
}

interface PlatzierungSpiel {
  ID?: number
  SpielerID: number
  Spielername: string
  Platzierung: number
}

interface PaarSpiel {
  ID?: number
  Spieler1ID: number
  Spieler1Name: string
  Spieler2ID: number
  Spieler2Name: string
  Wert1: number
  Wert2: number
  HinRueckrunde: string
}

interface KombiSpiel {
  ID?: number
  Spieler1ID: number
  Spieler1Name: string
  Spieler2ID: number
  Spieler2Name: string
  S1_3bis8: number
  S1_5K: number
  S2_3bis8: number
  S2_5K: number
  HinRueckrunde: string
}

export interface InitialData {
  neunerRatten?: (NeunerRatten & { Spieltag: string; SpieltagID: number })[]
  sechsTageRennen?: (SechsTageRennen & { Spieltag: string; SpieltagID: number })[]
  pokal?: (PlatzierungSpiel & { Spieltag: string; SpieltagID: number })[]
  sargkegeln?: (PlatzierungSpiel & { Spieltag: string; SpieltagID: number })[]
  meisterschaft?: {
    ID: number
    Spieltag: string
    SpieltagID: number
    Spieler1ID: number
    Spieler1Name: string
    Spieler2ID: number
    Spieler2Name: string
    HolzSpieler1: number
    HolzSpieler2: number
    HinRueckrunde: string
  }[]
  blitztunier?: {
    ID: number
    Spieltag: string
    SpieltagID: number
    Spieler1ID: number
    Spieler1Name: string
    Spieler2ID: number
    Spieler2Name: string
    PunkteSpieler1: number
    PunkteSpieler2: number
    HinRueckrunde: string
  }[]
  kombimeisterschaft?: {
    ID: number
    Spieltag: string
    SpieltagID: number
    Spieler1ID: number
    Spieler1Name: string
    Spieler2ID: number
    Spieler2Name: string
    Spieler1Punkte3bis8: number
    Spieler1Punkte5Kugeln: number
    Spieler2Punkte3bis8: number
    Spieler2Punkte5Kugeln: number
    HinRueckrunde: string
  }[]
}

type Props = {
  className?: string
  mitglieder: AktiverMitspieler[]
  spiel: string
  date?: Date
  meisterschaftsId?: number
  onSaveSuccess?: () => void
  disabled?: boolean
  initialData?: InitialData | null
}

type GenericGameItem = NeunerRatten | SechsTageRennen | PlatzierungSpiel | PaarSpiel | KombiSpiel;

export default function ErgebniseingabeCard({ className, mitglieder, spiel, date, meisterschaftsId, onSaveSuccess, disabled = false, initialData }: Props) {
  // States für die verschiedenen Spiele
  const [spielNeunerRatten, setSpielNeunerRatten] = React.useState<NeunerRatten[]>([])
  const [spiel6TageRennen, setSpiel6TageRennen] = React.useState<SechsTageRennen[]>([])
  const [spielPokal, setSpielPokal] = React.useState<PlatzierungSpiel[]>([])
  const [spielSargkegeln, setSpielSargkegeln] = React.useState<PlatzierungSpiel[]>([])
  const [spielMeisterschaft, setSpielMeisterschaft] = React.useState<PaarSpiel[]>([])
  const [spielBlitztunier, setSpielBlitztunier] = React.useState<PaarSpiel[]>([])
  const [spielKombimeisterschaft, setSpielKombimeisterschaft] = React.useState<KombiSpiel[]>([])
  const [deletedIds, setDeletedIds] = React.useState<number[]>([])

  // Effekt zum Laden der initialen Daten (bei Spieltagwechsel)
  React.useEffect(() => {
    setDeletedIds([])
    if (initialData) {
      setSpielNeunerRatten(initialData.neunerRatten?.map((i) => ({
        ID: i.ID,
        SpielerID: i.SpielerID,
        Spielername: i.Spielername,
        Neuner: i.Neuner,
        Kranz8: i.Kranz8,
        Ratten: i.Ratten
      })) || [])

      setSpiel6TageRennen(initialData.sechsTageRennen?.map((i) => ({
        ID: i.ID,
        Spieler1ID: i.Spieler1ID,
        Spieler1Name: i.Spieler1Name,
        Spieler2ID: i.Spieler2ID,
        Spieler2Name: i.Spieler2Name,
        Runden: i.Runden,
        Punkte: i.Punkte,
        Spielnr: i.Spielnr
      })) || [])

      setSpielPokal(initialData.pokal?.map((i) => ({
        ID: i.ID,
        SpielerID: i.SpielerID,
        Spielername: i.Spielername,
        Platzierung: i.Platzierung
      })) || [])

      setSpielSargkegeln(initialData.sargkegeln?.map((i) => ({
        ID: i.ID,
        SpielerID: i.SpielerID,
        Spielername: i.Spielername,
        Platzierung: i.Platzierung
      })) || [])

      setSpielMeisterschaft(initialData.meisterschaft?.map((i) => ({
        ID: i.ID,
        Spieler1ID: i.Spieler1ID,
        Spieler1Name: i.Spieler1Name,
        Spieler2ID: i.Spieler2ID,
        Spieler2Name: i.Spieler2Name,
        Wert1: i.HolzSpieler1,
        Wert2: i.HolzSpieler2,
        HinRueckrunde: i.HinRueckrunde
      })) || [])

      setSpielBlitztunier(initialData.blitztunier?.map((i) => ({
        ID: i.ID,
        Spieler1ID: i.Spieler1ID,
        Spieler1Name: i.Spieler1Name,
        Spieler2ID: i.Spieler2ID,
        Spieler2Name: i.Spieler2Name,
        Wert1: i.PunkteSpieler1,
        Wert2: i.PunkteSpieler2,
        HinRueckrunde: i.HinRueckrunde
      })) || [])

      setSpielKombimeisterschaft(initialData.kombimeisterschaft?.map((i) => ({
        ID: i.ID,
        Spieler1ID: i.Spieler1ID,
        Spieler1Name: i.Spieler1Name,
        Spieler2ID: i.Spieler2ID,
        Spieler2Name: i.Spieler2Name,
        S1_3bis8: i.Spieler1Punkte3bis8,
        S1_5K: i.Spieler1Punkte5Kugeln,
        S2_3bis8: i.Spieler2Punkte3bis8,
        S2_5K: i.Spieler2Punkte5Kugeln,
        HinRueckrunde: i.HinRueckrunde
      })) || [])
    } else {
      // Wenn keine Daten da sind, leeren (z.B. neuer Spieltag ohne Einträge)
      setSpielNeunerRatten([])
      setSpiel6TageRennen([])
      setSpielPokal([])
      setSpielSargkegeln([])
      setSpielMeisterschaft([])
      setSpielBlitztunier([])
      setSpielKombimeisterschaft([])
    }
  }, [initialData])

  const handleDragStart = (e: React.DragEvent, mitglied: AktiverMitspieler) => {
    e.dataTransfer.setData("mitglied", JSON.stringify(mitglied))
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragStartExisting = (e: React.DragEvent, item: GenericGameItem, sourceTable: string) => {
    e.dataTransfer.setData("existingItem", JSON.stringify(item))
    e.dataTransfer.setData("sourceTable", sourceTable)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const isPlayerInList = (id: number, list: GenericGameItem[], spielType: string) => {
    if (["6-tage-rennen", "meisterschaft", "blitztunier", "kombimeisterschaft"].includes(spielType)) {
      return list.some(item => {
        if ('Spieler1ID' in item) {
          return item.Spieler1ID === id || item.Spieler2ID === id
        }
        return false
      })
    }
    return list.some(item => {
      if ('SpielerID' in item) {
        return item.SpielerID === id
      }
      return false
    })
  }

  const handleDropToTable = (e: React.DragEvent) => {
    e.preventDefault()
    const mitgliedData = e.dataTransfer.getData("mitglied")
    if (!mitgliedData) return

    const mitglied: AktiverMitspieler = JSON.parse(mitgliedData)

    switch (spiel) {
      case "9er-ratten-kranz8":
        if (!isPlayerInList(mitglied.ID, spielNeunerRatten, spiel)) {
          setSpielNeunerRatten(prev => [...prev, {
            SpielerID: mitglied.ID,
            Spielername: mitglied.Anzeigename,
            Neuner: 0,
            Kranz8: 0,
            Ratten: 0
          }])
        }
        break
      case "6-tage-rennen":
        setSpiel6TageRennen(prev => {
          const lastItem = prev[prev.length - 1]
          const isCompletingOwnPair = lastItem && lastItem.Spieler1ID === mitglied.ID && lastItem.Spieler2ID <= 0

          if (isPlayerInList(mitglied.ID, prev, spiel) && !isCompletingOwnPair) return prev

          if (lastItem && lastItem.Spieler2ID <= 0) {
            const newArr = [...prev]
            newArr[newArr.length - 1] = { ...lastItem, Spieler2ID: mitglied.ID, Spieler2Name: mitglied.Anzeigename }
            return newArr
          } else {
            return [...prev, {
              Spieler1ID: mitglied.ID,
              Spieler1Name: mitglied.Anzeigename,
              Spieler2ID: -1,
              Spieler2Name: "",
              Runden: 0,
              Punkte: 0,
              Spielnr: 1
            }]
          }
        })
        break
      case "pokal":
        if (!isPlayerInList(mitglied.ID, spielPokal, spiel)) {
          setSpielPokal(prev => [...prev, {
            SpielerID: mitglied.ID,
            Spielername: mitglied.Anzeigename,
            Platzierung: prev.length + 1
          }])
        }
        break
      case "sargkegeln":
        if (!isPlayerInList(mitglied.ID, spielSargkegeln, spiel)) {
          setSpielSargkegeln(prev => [...prev, {
            SpielerID: mitglied.ID,
            Spielername: mitglied.Anzeigename,
            Platzierung: prev.length + 1
          }])
        }
        break
      case "meisterschaft":
        setSpielMeisterschaft(prev => {
          if (isPlayerInList(mitglied.ID, prev, spiel)) return prev
          const lastItem = prev[prev.length - 1]
          if (lastItem && lastItem.Spieler2ID <= 0) {
            const newArr = [...prev]
            newArr[newArr.length - 1] = { ...lastItem, Spieler2ID: mitglied.ID, Spieler2Name: mitglied.Anzeigename }
            return newArr
          } else {
            return [...prev, {
              Spieler1ID: mitglied.ID,
              Spieler1Name: mitglied.Anzeigename,
              Spieler2ID: -1,
              Spieler2Name: "",
              Wert1: 0,
              Wert2: 0,
              HinRueckrunde: "Hinrunde"
            }]
          }
        })
        break
      case "blitztunier":
        setSpielBlitztunier(prev => {
          if (isPlayerInList(mitglied.ID, prev, spiel)) return prev
          const lastItem = prev[prev.length - 1]
          if (lastItem && lastItem.Spieler2ID <= 0) {
            const newArr = [...prev]
            newArr[newArr.length - 1] = { ...lastItem, Spieler2ID: mitglied.ID, Spieler2Name: mitglied.Anzeigename }
            return newArr
          } else {
            return [...prev, {
              Spieler1ID: mitglied.ID,
              Spieler1Name: mitglied.Anzeigename,
              Spieler2ID: -1,
              Spieler2Name: "",
              Wert1: 0,
              Wert2: 0,
              HinRueckrunde: "Hinrunde"
            }]
          }
        })
        break
      case "kombimeisterschaft":
        setSpielKombimeisterschaft(prev => {
          if (isPlayerInList(mitglied.ID, prev, spiel)) return prev
          const lastItem = prev[prev.length - 1]
          if (lastItem && lastItem.Spieler2ID <= 0) {
            const newArr = [...prev]
            newArr[newArr.length - 1] = { ...lastItem, Spieler2ID: mitglied.ID, Spieler2Name: mitglied.Anzeigename }
            return newArr
          } else {
            return [...prev, {
              Spieler1ID: mitglied.ID,
              Spieler1Name: mitglied.Anzeigename,
              Spieler2ID: -1,
              Spieler2Name: "",
              S1_3bis8: 0,
              S1_5K: 0,
              S2_3bis8: 0,
              S2_5K: 0,
              HinRueckrunde: "Hinrunde"
            }]
          }
        })
        break
    }
  }

  const handleDropToMembers = async (e: React.DragEvent) => {
    e.preventDefault()
    const existingItemData = e.dataTransfer.getData("existingItem")
    const sourceTable = e.dataTransfer.getData("sourceTable")
    if (!existingItemData || !sourceTable) return

    const item = JSON.parse(existingItemData) as GenericGameItem
    if (item.ID) {
      const result = await deleteEingabeRowAction(item.ID, sourceTable)
      if (result.success) {
        toast.success("Eintrag gelöscht")
        if (onSaveSuccess) onSaveSuccess()
      } else {
        toast.error("Fehler beim Löschen")
        return
      }
    }

    switch (sourceTable) {
      case "9er-ratten-kranz8": {
        const i = item as NeunerRatten
        setSpielNeunerRatten(prev => prev.filter(p => p.SpielerID !== i.SpielerID))
        break
      }
      case "6-tage-rennen": {
        const i = item as SechsTageRennen
        setSpiel6TageRennen(prev => prev.filter(p => p.Spieler1ID !== i.Spieler1ID))
        break
      }
      case "pokal": {
        const i = item as PlatzierungSpiel
        setSpielPokal(prev => prev.filter(p => p.SpielerID !== i.SpielerID))
        break
      }
      case "sargkegeln": {
        const i = item as PlatzierungSpiel
        setSpielSargkegeln(prev => prev.filter(p => p.SpielerID !== i.SpielerID))
        break
      }
      case "meisterschaft": {
        const i = item as PaarSpiel
        setSpielMeisterschaft(prev => prev.filter(p => p.Spieler1ID !== i.Spieler1ID))
        break
      }
      case "blitztunier": {
        const i = item as PaarSpiel
        setSpielBlitztunier(prev => prev.filter(p => p.Spieler1ID !== i.Spieler1ID))
        break
      }
      case "kombimeisterschaft": {
        const i = item as KombiSpiel
        setSpielKombimeisterschaft(prev => prev.filter(p => p.Spieler1ID !== i.Spieler1ID))
        break
      }
    }
  }

  const removeItem = async (item: GenericGameItem, sourceTable: string) => {
    console.log("Item, sourceTable: ", item, sourceTable)
    if (item.ID) {
      const result = await deleteEingabeRowAction(item.ID, sourceTable)
      if (result.success) {
        toast.success("Eintrag gelöscht")
        if (onSaveSuccess) onSaveSuccess()
      } else {
        toast.error("Fehler beim Löschen")
        return
      }
    }
    switch (sourceTable) {
      case "9er-ratten-kranz8": {
        const i = item as NeunerRatten
        setSpielNeunerRatten(prev => prev.filter(p => p.SpielerID !== i.SpielerID))
        break
      }
      case "6-tage-rennen": {
        const i = item as SechsTageRennen
        setSpiel6TageRennen(prev => prev.filter(p => p.Spieler1ID !== i.Spieler1ID))
        break
      }
      case "pokal": {
        const i = item as PlatzierungSpiel
        setSpielPokal(prev => prev.filter(p => p.SpielerID !== i.SpielerID))
        break
      }
      case "sargkegeln": {
        const i = item as PlatzierungSpiel
        setSpielSargkegeln(prev => prev.filter(p => p.SpielerID !== i.SpielerID))
        break
      }
      case "meisterschaft": {
        const i = item as PaarSpiel
        setSpielMeisterschaft(prev => prev.filter(p => p.Spieler1ID !== i.Spieler1ID))
        break
      }
      case "blitztunier": {
        const i = item as PaarSpiel
        setSpielBlitztunier(prev => prev.filter(p => p.Spieler1ID !== i.Spieler1ID))
        break
      }
      case "kombimeisterschaft": {
        const i = item as KombiSpiel
        setSpielKombimeisterschaft(prev => prev.filter(p => p.Spieler1ID !== i.Spieler1ID))
        break
      }
    }
  }

  const updateItem = (index: number, field: string, value: string | number, sourceTable: string) => {
    switch (sourceTable) {
      case "9er-ratten-kranz8":
        setSpielNeunerRatten(prev => {
          const newArr = [...prev]
          newArr[index] = { ...newArr[index], [field]: value }
          return newArr
        })
        break
      case "6-tage-rennen":
        setSpiel6TageRennen(prev => {
          const newArr = [...prev]
          newArr[index] = { ...newArr[index], [field]: value }
          return newArr
        })
        break
      case "pokal":
        setSpielPokal(prev => {
          const newArr = [...prev]
          newArr[index] = { ...newArr[index], [field]: value }
          return newArr
        })
        break
      case "sargkegeln":
        setSpielSargkegeln(prev => {
          const newArr = [...prev]
          newArr[index] = { ...newArr[index], [field]: value }
          return newArr
        })
        break
      case "meisterschaft":
        setSpielMeisterschaft(prev => {
          const newArr = [...prev]
          newArr[index] = { ...newArr[index], [field]: value }
          return newArr
        })
        break
      case "blitztunier":
        setSpielBlitztunier(prev => {
          const newArr = [...prev]
          newArr[index] = { ...newArr[index], [field]: value }
          return newArr
        })
        break
      case "kombimeisterschaft":
        setSpielKombimeisterschaft(prev => {
          const newArr = [...prev]
          newArr[index] = { ...newArr[index], [field]: value }
          return newArr
        })
        break
    }
  }

  const renderEingabeTable = () => {
    switch (spiel) {
      case "9er-ratten-kranz8":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spielername</TableHead>
                <TableHead className="whitespace-nowrap">Neuner</TableHead>
                <TableHead className="whitespace-nowrap">Kranz 8</TableHead>
                <TableHead className="whitespace-nowrap">Ratten</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spielNeunerRatten.map((item, index) => (
                <TableRow 
                  key={index} 
                  draggable 
                  onDragStart={(e) => handleDragStartExisting(e, item, "9er-ratten-kranz8")}
                >
                  <TableCell>{item.Spielername}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.Neuner} 
                      onChange={(e) => updateItem(index, "Neuner", parseInt(e.target.value) || 0, "9er-ratten-kranz8")}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.Kranz8} 
                      onChange={(e) => updateItem(index, "Kranz8", parseInt(e.target.value) || 0, "9er-ratten-kranz8")}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.Ratten} 
                      onChange={(e) => updateItem(index, "Ratten", parseInt(e.target.value) || 0, "9er-ratten-kranz8")}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item, "9er-ratten-kranz8")} disabled={disabled}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      case "6-tage-rennen":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spieler 1</TableHead>
                <TableHead>Spieler 2</TableHead>
                <TableHead className="whitespace-nowrap">Runden</TableHead>
                <TableHead className="whitespace-nowrap">Punkte</TableHead>
                <TableHead className="whitespace-nowrap">Spielnr</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spiel6TageRennen.map((item, index) => (
                <TableRow 
                  key={index}
                  draggable 
                  onDragStart={(e) => handleDragStartExisting(e, item, "6-tage-rennen")}
                >
                  <TableCell>{item.Spieler1Name}</TableCell>
                  <TableCell>{item.Spieler2Name || "..."}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.Runden} 
                      onChange={(e) => updateItem(index, "Runden", parseInt(e.target.value) || 0, "6-tage-rennen")}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.Punkte} 
                      onChange={(e) => updateItem(index, "Punkte", parseInt(e.target.value) || 0, "6-tage-rennen")}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.Spielnr ?? 0} 
                      onChange={(e) => updateItem(index, "Spielnr", parseInt(e.target.value) || 0, "6-tage-rennen")}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item, "6-tage-rennen")} disabled={disabled}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      case "pokal":
      case "sargkegeln":
        const currentData = spiel === "pokal" ? spielPokal : spielSargkegeln
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spielername</TableHead>
                <TableHead className="whitespace-nowrap">Platzierung</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((item, index) => (
                <TableRow 
                  key={index}
                  draggable 
                  onDragStart={(e) => handleDragStartExisting(e, item, spiel)}
                >
                  <TableCell>{item.Spielername}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.Platzierung} 
                      onChange={(e) => updateItem(index, "Platzierung", parseInt(e.target.value) || 0, spiel)}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item, spiel)} disabled={disabled}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      case "meisterschaft":
      case "blitztunier":
        const currentPaarData = spiel === "meisterschaft" ? spielMeisterschaft : spielBlitztunier
        const wertLabel = spiel === "meisterschaft" ? "Holz" : "Pkt"
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spieler 1</TableHead>
                <TableHead>Spieler 2</TableHead>
                <TableHead className="whitespace-nowrap">{wertLabel} S1</TableHead>
                <TableHead className="whitespace-nowrap">{wertLabel} S2</TableHead>
                <TableHead className="whitespace-nowrap">Hin/Rück</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPaarData.map((item, index) => (
                <TableRow 
                  key={index}
                  draggable 
                  onDragStart={(e) => handleDragStartExisting(e, item, spiel)}
                >
                  <TableCell>{item.Spieler1Name}</TableCell>
                  <TableCell>{item.Spieler2Name || "..."}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.Wert1} 
                      onChange={(e) => updateItem(index, "Wert1", parseInt(e.target.value) || 0, spiel)}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.Wert2} 
                      onChange={(e) => updateItem(index, "Wert2", parseInt(e.target.value) || 0, spiel)}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={item.HinRueckrunde}
                      onValueChange={(val) => updateItem(index, "HinRueckrunde", val, spiel)}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hinrunde">Hinrunde</SelectItem>
                        <SelectItem value="Rückrunde">Rückrunde</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item, spiel)} disabled={disabled}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      case "kombimeisterschaft":
        return (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Spieler 1</TableHead>
                <TableHead>Spieler 2</TableHead>
                <TableHead className="whitespace-nowrap">S1 3-8</TableHead>
                <TableHead className="whitespace-nowrap">S1 5K</TableHead>
                <TableHead className="whitespace-nowrap">S2 3-8</TableHead>
                <TableHead className="whitespace-nowrap">S2 5K</TableHead>
                <TableHead className="whitespace-nowrap">Hin/Rück</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spielKombimeisterschaft.map((item, index) => (
                <TableRow 
                  key={index}
                  draggable 
                  onDragStart={(e) => handleDragStartExisting(e, item, "kombimeisterschaft")}
                >
                  <TableCell>{item.Spieler1Name}</TableCell>
                  <TableCell>{item.Spieler2Name || "..."}</TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.S1_3bis8} 
                      onChange={(e) => updateItem(index, "S1_3bis8", parseInt(e.target.value) || 0, "kombimeisterschaft")}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.S1_5K} 
                      onChange={(e) => updateItem(index, "S1_5K", parseInt(e.target.value) || 0, "kombimeisterschaft")}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.S2_3bis8} 
                      onChange={(e) => updateItem(index, "S2_3bis8", parseInt(e.target.value) || 0, "kombimeisterschaft")}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.S2_5K} 
                      onChange={(e) => updateItem(index, "S2_5K", parseInt(e.target.value) || 0, "kombimeisterschaft")}
                      className="h-8 w-20" 
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={item.HinRueckrunde}
                      onValueChange={(val) => updateItem(index, "HinRueckrunde", val, "kombimeisterschaft")}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hinrunde">Hinrunde</SelectItem>
                        <SelectItem value="Rückrunde">Rückrunde</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(item, "kombimeisterschaft")} disabled={disabled}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      default:
        return <div>Bitte ein Spiel auswählen</div>
    }
  }

  const hasData = () => {
    switch (spiel) {
      case "9er-ratten-kranz8": return spielNeunerRatten.length > 0
      case "6-tage-rennen": return spiel6TageRennen.length > 0
      case "pokal": return spielPokal.length > 0
      case "sargkegeln": return spielSargkegeln.length > 0
      case "meisterschaft": return spielMeisterschaft.length > 0
      case "blitztunier": return spielBlitztunier.length > 0
      case "kombimeisterschaft": return spielKombimeisterschaft.length > 0
      default: return false
    }
  }

  const getSpielName = (spielId: string) => {
    switch (spielId) {
      case "9er-ratten-kranz8": return "9er, Ratten & Kranz 8"
      case "6-tage-rennen": return "6-Tage-Rennen"
      case "pokal": return "Pokal"
      case "sargkegeln": return "Sargkegeln"
      case "meisterschaft": return "Meisterschaft"
      case "blitztunier": return "Blitztunier"
      case "kombimeisterschaft": return "Kombimeisterschaft"
      default: return spielId
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-baseline gap-2">
          <CardTitle>Ergebniseingabe</CardTitle>
          <span className="text-sm text-muted-foreground">
            {getSpielName(spiel)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Linke Seite: Aktive Mitglieder */}
          <div 
            className="flex-1 min-w-[300px]"
            onDragOver={handleDragOver}
            onDrop={handleDropToMembers}
          >
            <h3 className="text-sm font-medium mb-4">Aktive Mitglieder</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vorname</TableHead>
                    <TableHead>Nachname</TableHead>
                    <TableHead>Spitzname</TableHead>
                    <TableHead>Anzeigename</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mitglieder.map((mitglied) => (
                    <TableRow 
                      key={mitglied.ID}
                      draggable
                      onDragStart={(e) => handleDragStart(e, mitglied)}
                      className="cursor-move"
                    >
                      <TableCell>{mitglied.Vorname}</TableCell>
                      <TableCell>{mitglied.Nachname}</TableCell>
                      <TableCell>{mitglied.Spitzname}</TableCell>
                      <TableCell>{mitglied.Anzeigename}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Rechte Seite: Dynamische Eingabe */}
          <div 
            className="flex-[2] min-w-[500px]"
            onDragOver={handleDragOver}
            onDrop={handleDropToTable}
          >
            <h3 className="text-sm font-medium mb-4">Eingabetabelle</h3>
            <div className="rounded-md border">
              {renderEingabeTable()}
            </div>
          </div>
        </div>
      </CardContent>
      {hasData() && (
        <CardFooter className="flex justify-end border-t p-4">
          <Button
            onClick={async () => {
              try {
                if (!meisterschaftsId || !date) {
                  toast.warning("Bitte Datum und aktive Meisterschaft auswählen.")
                  return
                }
                const dataPayload =
                    spiel === "9er-ratten-kranz8"
                      ? spielNeunerRatten.map(({ ID, SpielerID, Neuner, Ratten, Kranz8 }) => ({ ID, SpielerID, Neuner, Ratten, Kranz8 }))
                      : spiel === "6-tage-rennen"
                        ? spiel6TageRennen.map(({ ID, Spieler1ID, Spieler2ID, Runden, Punkte, Spielnr }) => ({ ID, Spieler1ID, Spieler2ID, Runden, Punkte, Spielnr }))
                        : spiel === "pokal"
                          ? spielPokal.map(({ ID, SpielerID, Platzierung }) => ({ ID, SpielerID, Platzierung }))
                          : spiel === "sargkegeln"
                            ? spielSargkegeln.map(({ ID, SpielerID, Platzierung }) => ({ ID, SpielerID, Platzierung }))
                            : spiel === "meisterschaft"
                              ? spielMeisterschaft.map(({ ID, Spieler1ID, Spieler2ID, Wert1, Wert2, HinRueckrunde }) => ({ ID, Spieler1ID, Spieler2ID, Wert1, Wert2, HinRueckrunde }))
                              : spiel === "blitztunier"
                                ? spielBlitztunier.map(({ ID, Spieler1ID, Spieler2ID, Wert1, Wert2, HinRueckrunde }) => ({ ID, Spieler1ID, Spieler2ID, Wert1, Wert2, HinRueckrunde }))
                                : spielKombimeisterschaft.map(({ ID, Spieler1ID, Spieler2ID, S1_3bis8, S1_5K, S2_3bis8, S2_5K, HinRueckrunde }) => ({ ID, Spieler1ID, Spieler2ID, S1_3bis8, S1_5K, S2_3bis8, S2_5K, HinRueckrunde }))


                const result = await saveEingabeAction(meisterschaftsId, date, spiel, dataPayload, deletedIds)
                
                if (!result.success) {
                  throw new Error(('error' in result ? result.error : undefined) || "Fehler beim Speichern")
                }
                toast.success("Erfolgreich gespeichert!")
                setDeletedIds([])
                if (onSaveSuccess) onSaveSuccess()
              } catch (e) {
                console.error(e)
                const error = e as Error | { message?: string }
                toast.error(error.message || "Fehler beim Speichern")
              }
            }}
          >
            Speichern
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
