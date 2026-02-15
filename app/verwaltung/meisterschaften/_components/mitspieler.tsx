"use client";

import React, {useState, useCallback, useEffect} from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {AktiverMitspieler} from "@/interfaces/aktiver-mitspieler";
import { getAktiveMitglieder } from '@/app/actions/db/mitglieder/actions';
import { getTeilnehmerByMeisterschaft, addTeilnehmer, removeTeilnehmer } from '@/app/actions/db/teilnehmer/actions';

interface MitspielerProps {
    meisterschaftID: number;
}

// Mock-Daten für die Demo
const initialAktiveMitglieder: AktiverMitspieler[] = [
    // { ID: 1, Anzeigename: "Max Mustermann", Vorname: "Max", Nachname: "Mustermann", Spitzname: "Maxi" },
    // { ID: 2, Anzeigename: "Anna Schmidt", Vorname: "Anna", Nachname: "Schmidt", Spitzname: "Anni" },
    // { ID: 3, Anzeigename: "Peter Weber", Vorname: "Peter", Nachname: "Weber", Spitzname: "Peti" },
];

const initialAktiveTeilnehmer: AktiverMitspieler[] = [
    // { ID: 4, Anzeigename: "Lisa Mueller", Vorname: "Lisa", Nachname: "Mueller", Spitzname: "Lisi" },
    // { ID: 5, Anzeigename: "Tom Fischer", Vorname: "Tom", Nachname: "Fischer", Spitzname: "Tommy" },
];

export default function Mitspieler({meisterschaftID}: MitspielerProps) {
    const [currentMeisterschaftsID, setCurrentMeisterschaftsID] = useState(meisterschaftID);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [aktiveMitglieder, setAktiveMitglieder] = useState<AktiverMitspieler[]>(initialAktiveMitglieder);
    const [aktiveTeilnehmer, setAktiveTeilnehmer] = useState<AktiverMitspieler[]>(initialAktiveTeilnehmer);
    const [draggedItem, setDraggedItem] = useState<AktiverMitspieler | null>(null);
    const [draggedFromTable, setDraggedFromTable] = useState<'mitglieder' | 'teilnehmer' | null>(null);
    const [dragOverTable, setDragOverTable] = useState<'mitglieder' | 'teilnehmer' | null>(null);

    // Synchronisation des lokalen State mit dem Prop
    useEffect(() => {
        //console.log('Props MeisterschaftID changed:', MeisterschaftID);
        setCurrentMeisterschaftsID(meisterschaftID);

        return () => {} //Cleanup function
    }, [meisterschaftID]);

    useEffect(() => {
        const fetchMeisterschaft = async () => {
            setLoading(true);
            setError(null);

            try{
                const mitgliederResult = await getAktiveMitglieder();
                const teilnehmerResult = await getTeilnehmerByMeisterschaft(currentMeisterschaftsID);

                if (mitgliederResult.success && mitgliederResult.data && teilnehmerResult.success && teilnehmerResult.data) {
                    const teilnehmerIds = new Set(teilnehmerResult.data.map(t => t.ID));
                    const gefilterteMitglieder = (mitgliederResult.data as AktiverMitspieler[]).filter(m => !teilnehmerIds.has(m.ID));
                    
                    setAktiveMitglieder(gefilterteMitglieder);
                    setAktiveTeilnehmer(teilnehmerResult.data as AktiverMitspieler[]);
                } else {
                    setError(mitgliederResult.error || teilnehmerResult.error || 'Fehler beim Laden der Daten');
                }
            }catch (err: any) {
                setError(err.message || 'Unbekannter Fehler');
            }finally {
                setLoading(false);
            }
        }

        fetchMeisterschaft();
    }, [currentMeisterschaftsID]);

    // Drag-Start Handler
    const handleDragStart = useCallback((item: AktiverMitspieler, fromTable: 'mitglieder' | 'teilnehmer') => {
        setDraggedItem(item);
        setDraggedFromTable(fromTable);
    }, []);

    // Drag-Over Handler
    const handleDragOver = useCallback((e: React.DragEvent, overTable: 'mitglieder' | 'teilnehmer') => {
        e.preventDefault();
        setDragOverTable(overTable);
    }, []);

    // Drag-Leave Handler
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        // Prüfen ob wir wirklich die Tabelle verlassen
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
            setDragOverTable(null);
        }
    }, []);

    // Drop Handler
    const handleDrop = useCallback(async (e: React.DragEvent, targetTable: 'mitglieder' | 'teilnehmer') => {
        e.preventDefault();

        if (!draggedItem || !draggedFromTable) return;

        // Wenn das Item in die gleiche Tabelle gedroppt wird, nichts tun
        if (draggedFromTable === targetTable) {
            setDraggedItem(null);
            setDraggedFromTable(null);
            setDragOverTable(null);
            return;
        }

        // Item von der ursprünglichen Tabelle entfernen
        if (draggedFromTable === 'mitglieder') {
            setAktiveMitglieder(prev => prev.filter(item => item.ID !== draggedItem.ID));
        } else {
            //setAktiveTeilnehmer(prev => prev.filter(item => item.ID !== draggedItem.ID));
            try {
                const result = await removeTeilnehmer(currentMeisterschaftsID, draggedItem.ID);
                if (result.success) {
                    // Teilnehmer aus der lokalen Liste entfernen
                    console.log(`Teilnehmer ${draggedItem.Anzeigename} wurde gelöscht`);
                    setAktiveTeilnehmer(prev => prev.filter(item => item.ID !== draggedItem.ID));
                } else {
                    setError(result.error || 'Fehler beim Löschen des Teilnehmers');
                }
            } catch (err: any) {
                setError(err.message || 'Unbekannter Fehler beim Löschen');
            }
        }

        // Item zur Zieltabelle hinzufügen
        if (targetTable === 'mitglieder') {
            setAktiveMitglieder(prev => [...prev, draggedItem]);
        } else {
            //setAktiveTeilnehmer(prev => [...prev, draggedItem]);
            try {
                const result = await addTeilnehmer(currentMeisterschaftsID, draggedItem.ID);
                if (result.success) {
                    console.log(`Teilnehmer ${draggedItem.Anzeigename} wurde geadded`);
                    setAktiveTeilnehmer(prev => [...prev, draggedItem]);
                } else {
                    setError(result.error || 'Fehler beim adden des Teilnehmers');
                }
            } catch (err: any) {
                setError(err.message || 'Unbekannter Fehler beim adden');
            }
        }

        // Reset drag state
        setDraggedItem(null);
        setDraggedFromTable(null);
        setDragOverTable(null);
    }, [currentMeisterschaftsID, draggedItem, draggedFromTable]);

    // Drag-End Handler
    const handleDragEnd = useCallback(() => {
        setDraggedItem(null);
        setDraggedFromTable(null);
        setDragOverTable(null);
    }, []);

    if (loading) {
        return <div className="p-4">Lade Teilnehmer...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-600">Fehler: {error}</div>;
    }

    return (
        <div className="p-4 space-y-6">
            {/* Aktive Mitglieder Tabelle */}
            <Card
                className={cn(
                    "transition-all duration-200",
                    dragOverTable === 'mitglieder' && draggedFromTable !== 'mitglieder'
                        ? "ring-2 ring-blue-400 bg-blue-50/50"
                        : ""
                )}
                onDragOver={(e) => handleDragOver(e, 'mitglieder')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'mitglieder')}
            >
                <CardHeader>
                    <CardTitle>Aktive Mitglieder</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px] min-w-[200px]">Anzeigename</TableHead>
                                <TableHead className="w-[100px] min-w-[100px]">Vorname</TableHead>
                                <TableHead className="w-[100px] min-w-[100px]">Nachname</TableHead>
                                <TableHead className="w-[100px] min-w-[100px]">Spitzname</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {aktiveMitglieder.map((mitglied) => (
                                <TableRow
                                    key={mitglied.ID}
                                    draggable
                                    className={cn(
                                        "cursor-move transition-all duration-200 hover:bg-gray-50",
                                        draggedItem?.ID === mitglied.ID ? "opacity-50" : ""
                                    )}
                                    onDragStart={() => handleDragStart(mitglied, 'mitglieder')}
                                    onDragEnd={handleDragEnd}
                                >
                                    <TableCell className="font-medium">{mitglied.Anzeigename}</TableCell>
                                    <TableCell>{mitglied.Vorname}</TableCell>
                                    <TableCell>{mitglied.Nachname}</TableCell>
                                    <TableCell>{mitglied.Spitzname}</TableCell>
                                </TableRow>
                            ))}
                            {aktiveMitglieder.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                        Keine aktiven Mitglieder
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Aktive Spieler/Teilnehmer Tabelle */}
            <Card
                className={cn(
                    "transition-all duration-200",
                    dragOverTable === 'teilnehmer' && draggedFromTable !== 'teilnehmer'
                        ? "ring-2 ring-blue-400 bg-blue-50/50"
                        : ""
                )}
                onDragOver={(e) => handleDragOver(e, 'teilnehmer')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, 'teilnehmer')}
            >
                <CardHeader>
                    <CardTitle>Aktive Spieler</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px] min-w-[200px]">Anzeigename</TableHead>
                                <TableHead className="w-[100px] min-w-[100px]">Vorname</TableHead>
                                <TableHead className="w-[100px] min-w-[100px]">Nachname</TableHead>
                                <TableHead className="w-[100px] min-w-[100px]">Spitzname</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {aktiveTeilnehmer.map((teilnehmer) => (
                                <TableRow
                                    key={teilnehmer.ID}
                                    draggable
                                    className={cn(
                                        "cursor-move transition-all duration-200 hover:bg-gray-50",
                                        draggedItem?.ID === teilnehmer.ID ? "opacity-50" : ""
                                    )}
                                    onDragStart={() => handleDragStart(teilnehmer, 'teilnehmer')}
                                    onDragEnd={handleDragEnd}
                                >
                                    <TableCell className="font-medium">{teilnehmer.Anzeigename}</TableCell>
                                    <TableCell>{teilnehmer.Vorname}</TableCell>
                                    <TableCell>{teilnehmer.Nachname}</TableCell>
                                    <TableCell>{teilnehmer.Spitzname}</TableCell>
                                </TableRow>
                            ))}
                            {aktiveTeilnehmer.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                                        Keine aktiven Spieler
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Drag-Hinweise */}
            {draggedItem && (
                <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
                    <p className="text-sm">
                        Ziehe &quot;{draggedItem.Anzeigename}&quot; zwischen den Tabellen
                    </p>
                </div>
            )}
        </div>
    );
}