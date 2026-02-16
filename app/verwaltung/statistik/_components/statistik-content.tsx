"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { ZeitbereichAuswahl } from "./zeitbereich-auswahl"
import { StatistikAuswahl } from "./statistik-auswahl"

export function StatistikContent() {
  return (
    <div className="flex flex-col space-y-6 w-full max-w-5xl">
      <Card>
        <CardContent className="pt-6 space-y-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <ZeitbereichAuswahl />
            <StatistikAuswahl />
          </div>
          
          <div className="flex pt-4">
            <Button className="w-full sm:w-auto">
              <FileText className="mr-2 h-4 w-4" /> PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
