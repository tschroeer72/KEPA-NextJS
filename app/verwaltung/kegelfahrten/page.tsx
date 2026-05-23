import KegelfahrtenListe from "@/app/verwaltung/kegelfahrten/_components/kegelfahrten-liste";

export default function KegelfahrtenPage() {
    return (
        <div className="flex flex-col items-center justify-start h-full p-4 overflow-auto">
            <h1 className="mb-6 text-3xl font-bold">Kegelfahrten</h1>
            <KegelfahrtenListe />
        </div>
    );
}
