"use client";

import { MitgliederTreeviewType } from "@/types/miglieder-treeview-type";
import Treeview from "./treeview";
import MitgliedDaten from "@/app/verwaltung/mitglieder/_components/mitglied-daten";
import {useState} from "react";

interface MitgliederClientProps {
    lstMitglieder: MitgliederTreeviewType[];
    onDataChange: () => void;
}

export default function MitgliederClient({ lstMitglieder, onDataChange }: MitgliederClientProps) {
    const [mitgliedId, setMitgliedId] = useState<number>(-1);

    const handleMemberSelect = (id: number) => {
        setMitgliedId(id);
        //console.log('Mitglied ausgewählt:', id);
    };

    const handleDataChange = () => {
        // Nach dem Speichern die Mitgliederliste neu laden
        onDataChange();
        // Optional: Mitglied-Auswahl zurücksetzen oder beibehalten
        // setMitgliedId(-1);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 w-full">
            <div className="w-full lg:w-1/4 xl:w-1/5">
                <Treeview
                    lstMitglieder={lstMitglieder}
                    onMemberSelect={handleMemberSelect}
                />
            </div>
            <div className="w-full lg:w-3/4 xl:w-4/5">
                <MitgliedDaten
                    MitgliedID={mitgliedId}
                    onDataChange={handleDataChange}
                />
            </div>
        </div>
    );
}