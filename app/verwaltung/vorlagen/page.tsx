"use client"

import { useState } from "react"
import { VorlagenData } from "@/data/vorlagen-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { AnzahlMitspielerDialog } from "./_components/anzahl-mitspieler-dialog"

export default function VorlagenPage() {
    const [selectedTemplate, setSelectedTemplate] = useState<string>("")
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogTitle, setDialogTitle] = useState("")
    const [loading, setLoading] = useState(false)

    const handleExport = () => {
        if (!selectedTemplate || selectedTemplate === "dummy") return

        if (selectedTemplate.includes("/api/vorlagen/meisterschaft") || selectedTemplate.includes("/api/vorlagen/blitztunier")) {
            setDialogTitle(selectedTemplate.includes("meisterschaft") ? "Meisterschaft" : "Blitztunier")
            setDialogOpen(true)
            return
        }

        downloadPdf(selectedTemplate)
    }

    const downloadPdf = async (url: string) => {
        setLoading(true)
        try {
            const response = await fetch(url)
            if (!response.ok) throw new Error("Download fehlgeschlagen")
            
            const blob = await response.blob()
            const downloadUrl = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = downloadUrl
            link.download = url.split("/").pop()?.split("?")[0] || "vorlage.pdf"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(downloadUrl)
        } catch (error) {
            console.error("Fehler beim PDF-Download:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleDialogConfirm = (anzahl: number) => {
        const urlWithAnzahl = `${selectedTemplate}?anzahl=${anzahl}`
        downloadPdf(urlWithAnzahl)
    }

    return (
        <div className="flex flex-col gap-6 p-10">
            <Card className="w-fit">
                <CardHeader>
                    <CardTitle>Vorlagen</CardTitle>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <div className="flex flex-row gap-8">
                            {VorlagenData.map((group) => (
                                <div key={group.title} className="flex flex-col gap-4 border p-4 rounded-lg min-w-[200px]">
                                    <h2 className="font-semibold text-lg border-b pb-2">{group.title}</h2>
                                    <div className="flex flex-col gap-3">
                                        {group.subtitle.map((item) => (
                                            <div key={item.subtitle} className="flex items-center space-x-2">
                                                <RadioGroupItem 
                                                    value={item.href} 
                                                    id={`${group.title}-${item.subtitle}`}
                                                />
                                                <Label 
                                                    htmlFor={`${group.title}-${item.subtitle}`}
                                                    className="cursor-pointer"
                                                >
                                                    {item.subtitle}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </RadioGroup>

                    <div className="flex flex-row gap-4 mt-8">
                        <Button 
                            onClick={handleExport} 
                            disabled={!selectedTemplate || selectedTemplate === "dummy" || loading}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            PDF
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <AnzahlMitspielerDialog 
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onConfirm={handleDialogConfirm}
                titel={`Für wieviele Teilnehmer soll die Vorlage "${dialogTitle}" generiert werden?`}
            />
        </div>
    )
}