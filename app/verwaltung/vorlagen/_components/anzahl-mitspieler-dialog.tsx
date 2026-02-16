"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AnzahlMitspielerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (anzahl: number) => void
  titel: string
}

export function AnzahlMitspielerDialog({
  open,
  onOpenChange,
  onConfirm,
  titel,
}: AnzahlMitspielerDialogProps) {
  const [anzahl, setAnzahl] = useState<string>("3")

  const handleConfirm = () => {
    const val = parseInt(anzahl)
    if (!isNaN(val) && val >= 3) {
      onConfirm(val)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{titel}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="anzahl" className="text-right">
              Teilnehmer
            </Label>
            <Input
              id="anzahl"
              type="number"
              min="3"
              value={anzahl}
              onChange={(e) => setAnzahl(e.target.value)}
              className="col-span-3"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Die Anzahl der Teilnehmer muss mindestens 3 sein.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm}>PDF Generieren</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
