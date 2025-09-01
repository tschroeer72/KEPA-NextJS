﻿"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import Meisterschaftliste from "@/app/verwaltung/meisterschaften/(components)/meisterschaftliste";
import Meisterschaftsdaten from "@/app/verwaltung/meisterschaften/(components)/meisterschaft-daten";

export default function Meisterschaften() {
    const [meisterschaftenliste, setMeisterschaftenliste] = useState<Meisterschaft[]>([]);
    const [selectedMeisterschaftId, setSelectedMeisterschaftId] = useState<number>(-1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMeisterschaften = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/db/meisterschaften/liste');
            setMeisterschaftenliste(response.data);
        } catch (err) {
            setError('Fehler beim Laden der Meisterschaftenliste');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    const handleMeisterschaftSelect = (id: number) => {
        setSelectedMeisterschaftId(id);
    };

    const handleDataChange = () => {
        loadMeisterschaften();
    };

    useEffect(() => {
        loadMeisterschaften();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="mb-3 text-3xl font-bold">Meisterschaftsverwaltung</h1>
                <p>Lade Meisterschaftsverwaltung...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="mb-3 text-3xl font-bold">Meisterschaftsverwaltung</h1>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="mb-3 text-3xl font-bold">Meisterschaftsverwaltung</h1>
            <div className="flex flex-col lg:flex-row gap-6 w-full">
                <div className="w-full lg:w-1/2">
                    <Meisterschaftliste
                        lstMeisterschaften={meisterschaftenliste}
                        onDataChange={handleDataChange}
                        onMeisterschaftSelect={handleMeisterschaftSelect}
                    />
                </div>
                <div className="w-full lg:w-1/2">
                    <Meisterschaftsdaten
                        MeisterschaftID={selectedMeisterschaftId}
                        onDataChange={handleDataChange}
                    />
                </div>
            </div>
        </div>
    )
}