import { StatistikContent } from "./_components/statistik-content"

export default function StatistikPage() {
    return (
        <div className="flex flex-col h-full p-4 md:p-10 space-y-6">
            <h1 className="text-3xl font-bold">Statistik</h1>
            <StatistikContent />
        </div>
    )
}