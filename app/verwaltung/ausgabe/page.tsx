import { getMeisterschaften } from "@/app/actions/meisterschaften/actions"
import { AusgabeContent } from "./_components/ausgabe-content"

export default async function AusgabePage() {
    const meisterschaften = await getMeisterschaften()

    return(
        <div className="flex flex-col h-full space-y-6">
            <h1 className="text-3xl font-bold text-center">Spielergebnisse</h1>
            <AusgabeContent meisterschaften={meisterschaften} />
        </div>
    )
}