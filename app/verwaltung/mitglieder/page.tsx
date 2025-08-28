"use client";

import { useEffect, useState } from 'react';
import MitgliederClient from "@/app/verwaltung/mitglieder/(components)/mitglieder-client";
import axios from 'axios';

export default function Mitglieder() {
    const [mitgliederListe, setMitgliederListe] = useState<Mitglied[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMitglieder = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/db/mitglieder/liste');
            setMitgliederListe(response.data);
        } catch (err) {
            setError('Fehler beim Laden der Mitgliederliste');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMitglieder();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="mb-3 text-3xl font-bold">Mitgliederverwaltung</h1>
                <p>Lade Mitgliederliste...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <h1 className="mb-3 text-3xl font-bold">Mitgliederverwaltung</h1>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full">
            <h1 className="mb-3 text-3xl font-bold">Mitgliederverwaltung</h1>
            <MitgliederClient
                lstMitglieder={mitgliederListe}
                onDataChange={loadMitglieder}
            />
        </div>
    );
}