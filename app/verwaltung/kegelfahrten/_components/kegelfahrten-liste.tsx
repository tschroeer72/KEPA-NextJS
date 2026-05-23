"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getKegelfahrten } from "@/app/actions/verwaltung/kegelfahrten/get-kegelfahrten";

interface Kegelfahrt {
    ID: number;
    Jahr: number;
    Ziel: string;
    Von: Date;
    Bis: Date;
    Dateiname: string;
}

export default function KegelfahrtenListe() {
    const router = useRouter();
    const [kegelfahrten, setKegelfahrten] = useState<Kegelfahrt[]>([]);
    const [filter, setFilter] = useState("");
    const [sortBy, setSortBy] = useState<"Jahr" | "Ziel">("Jahr");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getKegelfahrten();
                setKegelfahrten(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handlePlay = (kegelfahrt: Kegelfahrt) => {
        router.push(`/verwaltung/kegelfahrten/${kegelfahrt.ID}`);
    };

    const filteredAndSortedData = kegelfahrten
        .filter((fahrt) =>
            fahrt.Ziel.toLowerCase().includes(filter.toLowerCase()) ||
            fahrt.Jahr.toString().includes(filter)
        )
        .sort((a, b) => {
            if (sortBy === "Jahr") {
                return sortOrder === "asc" ? a.Jahr - b.Jahr : b.Jahr - a.Jahr;
            } else {
                return sortOrder === "asc"
                    ? a.Ziel.localeCompare(b.Ziel)
                    : b.Ziel.localeCompare(a.Ziel);
            }
        });

    if (loading) {
        return <div className="text-center p-8">Lade Kegelfahrten...</div>;
    }

    return (
        <div className="w-full max-w-4xl space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Filtern nach Jahr oder Ziel..."
                        className="pl-8"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Sortieren nach" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Jahr">Jahr</SelectItem>
                            <SelectItem value="Ziel">Ziel</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredAndSortedData.map((fahrt) => (
                    <Card key={fahrt.ID}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="grid gap-1">
                                <CardTitle className="text-xl font-bold">
                                    {fahrt.Ziel}
                                </CardTitle>
                                <CardDescription>
                                    Jahr: {fahrt.Jahr}
                                </CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handlePlay(fahrt)}
                            >
                                <Play className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Zeitraum: {new Date(fahrt.Von).toLocaleDateString("de-DE")} - {new Date(fahrt.Bis).toLocaleDateString("de-DE")}
                            </p>
                        </CardContent>
                    </Card>
                ))}
                {filteredAndSortedData.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        Keine Kegelfahrten gefunden.
                    </div>
                )}
            </div>
        </div>
    );
}
