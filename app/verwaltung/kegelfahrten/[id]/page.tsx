"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const ReactPlayer = dynamic(() => import("react-player"), { ssr: false }) as any;
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getKegelfahrtById } from "@/app/actions/verwaltung/kegelfahrten/get-kegelfahrt-by-id";
import { getFreigabeUrl } from "@/app/actions/verwaltung/kegelfahrten/get-freigabe-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Kegelfahrt {
    ID: number;
    Jahr: number;
    Ziel: string;
    Dateiname: string;
}

export default function KegelfahrtVideoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [kegelfahrt, setKegelfahrt] = useState<Kegelfahrt | null>(null);
    const [freigabeUrl, setFreigabeUrl] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
        const fetchData = async () => {
            try {
                const [data, baseExportUrl] = await Promise.all([
                    getKegelfahrtById(parseInt(id)),
                    getFreigabeUrl()
                ]);

                if (data) {
                    setKegelfahrt(data as unknown as Kegelfahrt);
                    setFreigabeUrl(baseExportUrl);
                } else {
                    setError("Kegelfahrt nicht gefunden.");
                }
            } catch (err) {
                console.error(err);
                setError("Fehler beim Laden der Daten.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Video wird vorbereitet...</p>
            </div>
        );
    }

    if (error || !kegelfahrt) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <p className="text-destructive text-lg font-semibold">{error || "Ein Fehler ist aufgetreten."}</p>
                <Button onClick={() => router.back()} variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Zurück zur Liste
                </Button>
            </div>
        );
    }

    const videoUrl = `${freigabeUrl.replace(/\/$/, "")}/${encodeURIComponent(kegelfahrt.Dateiname)}`;
    //console.log("Video-URL:", videoUrl);
    
    const isDirectLink = videoUrl.match(/\.(mp4|webm|ogg|mov)$/i);

    return (
        <div className="flex flex-col items-center justify-start h-full p-4 w-full max-w-5xl mx-auto space-y-6">
            <div className="w-full flex justify-start">
                <Button onClick={() => router.back()} variant="ghost">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Zurück
                </Button>
            </div>

            <Card className="w-full overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                        {kegelfahrt.Ziel} ({kegelfahrt.Jahr})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0 bg-black aspect-video flex items-center justify-center">
                    {isClient && (
                        <div className="w-full h-full flex items-center justify-center">
                            {!isDirectLink ? (
                                <div className="text-center p-6">
                                    <p className="text-white mb-4">Dieses Video kann nicht direkt im Player abgespielt werden.</p>
                                    <Button asChild>
                                        <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                                            Video in neuem Fenster öffnen
                                        </a>
                                    </Button>
                                </div>
                            ) : (
                                <ReactPlayer
                                    src={videoUrl}
                                    controls
                                    width="100%"
                                    height="100%"
                                    playing={true}
                                    onError={(e: any) => {
                                        console.error("ReactPlayer Error:", e);
                                        if (e && e.target && e.target.error) {
                                            console.error("HTML5 Video Error Code:", e.target.error.code);
                                            console.error("HTML5 Video Error Message:", e.target.error.message);
                                        }
                                        setError("Das Video konnte nicht abgespielt werden. Dies liegt wahrscheinlich an CORS-Einschränkungen des NAS-Servers oder einem inkompatiblen Videoformat.");
                                    }}
                                    config={{
                                        file: {
                                            forceVideo: true,
                                            attributes: {
                                                controlsList: "nodownload",
                                                playsInline: true,
                                            } as any,
                                        },
                                    } as any}
                                />
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
