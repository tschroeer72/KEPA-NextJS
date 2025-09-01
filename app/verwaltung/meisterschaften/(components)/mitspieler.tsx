"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {AktiverMitspieler} from "@/interfaces/aktiver-mitspieler";


interface MitspielerProps {
    meisterschaftID: number;
}

// Mock-Daten für die Demo
const initialAktiveMitglieder: AktiverMitspieler[] = [
    { ID: 1, Anzeigename: "Max Mustermann", Vorname: "Max", Nachname: "Mustermann", Spitzname: "Maxi" },
    { ID: 2, Anzeigename: "Anna Schmidt", Vorname: "Anna", Nachname: "Schmidt", Spitzname: "Anni" },
    { ID: 3, Anzeigename: "Peter Weber", Vorname: "Peter", Nachname: "Weber", Spitzname: "Peti" },
];

const initialAktiveTeilnehmer: AktiverMitspieler[] = [
    { ID: 4, Anzeigename: "Lisa Mueller", Vorname: "Lisa", Nachname: "Mueller", Spitzname: "Lisi" },
    { ID: 5, Anzeigename: "Tom Fischer", Vorname: "Tom", Nachname: "Fischer", Spitzname: "Tommy" },
];

export default function Mitspieler({meisterschaftID}: MitspielerProps) {
    console.log("Mitspieler-Props:", meisterschaftID);

    const [aktiveMitglieder, setAktiveMitglieder] = useState<AktiverMitspieler[]>(initialAktiveMitglieder);
    const [aktiveTeilnehmer, setAktiveTeilnehmer] = useState<AktiverMitspieler[]>(initialAktiveTeilnehmer);
    const [draggedItem, setDraggedItem] = useState<AktiverMitspieler | null>(null);
    const [draggedFromTable, setDraggedFromTable] = useState<'mitglieder' | 'teilnehmer' | null>(null);
    const [dragOverTable, setDragOverTable] = useState<'mitglieder' | 'teilnehmer' | null>(null);

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
    const handleDrop = useCallback((e: React.DragEvent, targetTable: 'mitglieder' | 'teilnehmer') => {
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
            setAktiveTeilnehmer(prev => prev.filter(item => item.ID !== draggedItem.ID));
        }

        // Item zur Zieltabelle hinzufügen
        if (targetTable === 'mitglieder') {
            setAktiveMitglieder(prev => [...prev, draggedItem]);
        } else {
            setAktiveTeilnehmer(prev => [...prev, draggedItem]);
        }

        // Reset drag state
        setDraggedItem(null);
        setDraggedFromTable(null);
        setDragOverTable(null);
    }, [draggedItem, draggedFromTable]);

    // Drag-End Handler
    const handleDragEnd = useCallback(() => {
        setDraggedItem(null);
        setDraggedFromTable(null);
        setDragOverTable(null);
    }, []);

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