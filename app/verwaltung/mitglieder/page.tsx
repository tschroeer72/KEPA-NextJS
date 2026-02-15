"use client";

import { useEffect, useState } from 'react';
import MitgliederClient from "@/app/verwaltung/mitglieder/_components/mitglieder-client";
import { getMitglieder } from '@/app/actions/db/mitglieder/actions';

export default function MitgliederPage() {
    const [mitgliederListe, setMitgliederListe] = useState<Mitglied[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadMitglieder = async () => {
        try {
            setLoading(true);
            const result = await getMitglieder();
            if (result.success && result.data) {
                setMitgliederListe(result.data as any);
            } else {
                setError(result.error || 'Fehler beim Laden der Mitgliederliste');
            }
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