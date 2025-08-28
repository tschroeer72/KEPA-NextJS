"use client"

import { Calendar } from "@/components/ui/calendar";
import { useMemo } from "react";
import { de } from "date-fns/locale";

// Funktion um den ersten Mittwoch des Jahres zu finden
const getFirstWednesday = (year: number): Date => {
    const firstDayOfYear = new Date(year, 0, 1);
    const dayOfWeek = firstDayOfYear.getDay();

    let daysUntilWednesday;
    if (dayOfWeek === 0) {
        daysUntilWednesday = 3;
    } else if (dayOfWeek <= 3) {
        daysUntilWednesday = 3 - dayOfWeek;
    } else {
        daysUntilWednesday = 7 - dayOfWeek + 3;
    }

    return new Date(year, 0, 1 + daysUntilWednesday);
};

// Funktion um alle Termine zu generieren
const generateTermine = (year: number): Date[] => {
    const termine: Date[] = [];
    const firstWednesday = getFirstWednesday(year);

    let currentDate = new Date(firstWednesday);
    termine.push(new Date(currentDate));

    for (let i = 1; i < 26; i++) {
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 14);

        if (currentDate.getFullYear() === year) {
            termine.push(new Date(currentDate));
        } else {
            break;
        }
    }

    return termine;
};

export default function Termine() {
    const currentYear = new Date().getFullYear();
    const terminDaten = useMemo(() => generateTermine(currentYear), [currentYear]);

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <h1 className="text-3xl font-bold mb-4">Termine</h1>
            <p className="text-lg mb-8 text-center">
                Im Kalender findest Du alle Termine des laufenden Jahres
            </p>

            {/* CSS für die Termin-Markierung und größere Zellen */}
            <style jsx>{`
                :global(.termine-tag) {
                    background: #3b82f6 !important;
                    color: white !important;
                    position: relative;
                    font-weight: 600;
                }
                :global(.termine-tag::after) {
                    content: "📅";
                    position: absolute;
                    top: 1px;
                    right: 1px;
                    font-size: 12px;
                }
                :global(.termine-tag:hover) {
                    background: #2563eb !important;
                }
                
                /* Größere Kalender-Zellen */
                :global([data-slot="calendar"]) {
                    --cell-size: 3.5rem;
                }
                
                /* Wochennummern Styling */
                :global(.rdp-week-number) {
                    font-size: 0.75rem;
                    color: #6b7280;
                    font-weight: 500;
                }
                
                /* Größere Schrift in den Zellen */
                :global(.rdp-button) {
                    font-size: 1rem;
                }
                
                /* Responsive Anpassungen */
                @media (max-width: 768px) {
                    :global([data-slot="calendar"]) {
                        --cell-size: 2.5rem;
                    }
                }
            `}</style>

            <div className="w-full max-w-4xl">
                <Calendar
                    mode="range"
                    numberOfMonths={2} // Zwei Monate nebeneinander für bessere Übersicht
                    className="bg-white border rounded-lg shadow-lg p-6"
                    buttonVariant="outline"
                    showWeekNumber={true} // Wochennummern anzeigen
                    weekStartsOn={1} // Woche beginnt am Montag
                    fixedWeeks={true} // Immer 6 Wochen pro Monat anzeigen
                    locale={de} // Deutsche Lokalisierung
                    modifiers={{
                        termine: terminDaten,
                    }}
                    modifiersClassNames={{
                        termine: "termine-tag",
                    }}
                />
            </div>
        </div>
    );
}