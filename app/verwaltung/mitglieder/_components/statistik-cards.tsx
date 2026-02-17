"use client";

import { useEffect, useState } from "react";
import { getStatistikSpielerById } from "@/app/actions/db/statistik/actions";
import { StatistikSpieler } from "@/interfaces/statistik-spieler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Zap, Sigma, Calculator, MousePointer2, Target } from "lucide-react";

interface StatistikCardsProps {
    spielerId: number;
}

export default function StatistikCards({ spielerId }: StatistikCardsProps) {
    const [statistik, setStatistik] = useState<StatistikSpieler | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStatistik = async () => {
            if (spielerId <= 0) return;
            setLoading(true);
            try {
                const result = await getStatistikSpielerById(spielerId);
                if (result.success && result.data) {
                    setStatistik(result.data);
                } else {
                    setError(result.error || "Fehler beim Laden der Statistik");
                }
            } catch (err) {
                setError("Ein unerwarteter Fehler ist aufgetreten");
            } finally {
                setLoading(false);
            }
        };

        fetchStatistik();
    }, [spielerId]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-1/2" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        return <div className="text-red-500 mt-4">{error}</div>;
    }

    if (!statistik) {
        return <div className="mt-4 text-gray-500">Keine Statistikdaten verfügbar</div>;
    }

    const cards = [
        {
            title: "Meisterschaft",
            icon: <Trophy className="h-4 w-4 text-yellow-500" />,
            stats: [
                { label: "Max Holz", value: statistik.HolzMeisterMax },
                { label: "Min Holz", value: statistik.HolzMeisterMin },
                { label: "Durchschnitt", value: statistik.HolzMeisterAVG.toFixed(2) },
                { label: "Summe", value: statistik.HolzMeisterSumme },
            ]
        },
        {
            title: "Blitztunier",
            icon: <Zap className="h-4 w-4 text-blue-500" />,
            stats: [
                { label: "Max Punkte", value: statistik.HolzBlitzMax },
                { label: "Min Punkte", value: statistik.HolzBlitzMin },
                { label: "Durchschnitt", value: statistik.HolzBlitzAVG.toFixed(2) },
                { label: "Summe", value: statistik.HolzBlitzSumme },
            ]
        },
        {
            title: "Gesamt (Holz)",
            icon: <Sigma className="h-4 w-4 text-green-500" />,
            stats: [
                { label: "Max Holz/Pkt", value: statistik.HolzMax },
                { label: "Min Holz/Pkt", value: statistik.HolzMin },
                { label: "Durchschnitt", value: statistik.HolzAVG.toFixed(2) },
                { label: "Summe", value: statistik.HolzSumme },
            ]
        },
        {
            title: "Neuner, Kranz 8 & Ratten",
            icon: <Target className="h-4 w-4 text-red-500" />,
            stats: [
                { label: "Ratten Max", value: statistik.RattenMax },
                { label: "Ratten Summe", value: statistik.RattenSumme },
                { label: "Neuner Max", value: statistik.NeunerMax },
                { label: "Neuner Summe", value: statistik.NeunerSumme },
                { label: "Kranz8 Max", value: statistik.Kranz8Max },
                { label: "Kranz8 Summe", value: statistik.Kranz8Summe },
            ]
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {cards.map((card, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            {card.title}
                        </CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {card.stats.map((stat, j) => (
                                <div key={j} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{stat.label}:</span>
                                    <span className="font-bold">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
