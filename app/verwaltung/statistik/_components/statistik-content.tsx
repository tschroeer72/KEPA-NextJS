"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { ZeitbereichAuswahl } from "./zeitbereich-auswahl"
import { StatistikAuswahl } from "./statistik-auswahl"

export function StatistikContent() {
  const [auswahl, setAuswahl] = React.useState("neuner")
  const [zeit, setZeit] = React.useState("laufende")
  const [dateVon, setDateVon] = React.useState<Date>()
  const [dateBis, setDateBis] = React.useState<Date>()
  const [loading, setLoading] = React.useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/statistik/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auswahl,
          zeit,
          dateVon,
          dateBis
        }),
      })

      if (!response.ok) {
        throw new Error('Export fehlgeschlagen')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Statistik_${auswahl}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Der PDF-Export ist fehlgeschlagen.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full max-w-5xl">
      <Card>
        <CardContent className="pt-6 space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <ZeitbereichAuswahl 
              zeit={zeit} 
              setZeit={setZeit} 
              dateVon={dateVon} 
              setDateVon={setDateVon} 
              dateBis={dateBis} 
              setDateBis={setDateBis} 
            />
            <StatistikAuswahl value={auswahl} onValueChange={setAuswahl} />
          </div>
          
          <div className="flex pt-4">
            <Button className="w-full sm:w-auto" onClick={handleExport} disabled={loading}>
              <FileText className="mr-2 h-4 w-4" /> {loading ? 'Wird erstellt...' : 'PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
