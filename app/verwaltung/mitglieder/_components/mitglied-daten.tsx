"use client";

import {useCallback, useEffect, useState} from 'react';
import { getMitgliedById, updateMitglied, createMitglied } from '@/app/actions/db/mitglieder/actions';
import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs";
import FormPersoenliches from "@/app/verwaltung/mitglieder/_components/form-persoenliches";
import {MitgliedPersoenlichesFormData} from "@/interfaces/mitglied-persoenliches-form-data";
import {MitgliedNotizenFormData} from "@/interfaces/mitglied-notizen-form-data";
import FormNotizen from "@/app/verwaltung/mitglieder/_components/form-notizen";
import {z} from "zod";
import {toast} from "sonner";
import {mitgliedSchema} from "@/zod/mitgliedSchema";

interface MitgliedDatenProps {
    MitgliedID: number;
    onDataChange?: () => void;
}

export default function MitgliedDaten({MitgliedID, onDataChange}: MitgliedDatenProps) {
    const [currentMitgliedID, setCurrentMitgliedID] = useState(MitgliedID);

    const [mitglied, setMitglied] = useState<Mitglied | MitgliedCreate | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formDataMitgliedPersoenliches, setFormDataMitgliedPersoenliches] = useState<MitgliedPersoenlichesFormData>({
        Vorname: "",
        Nachname: "",
        MitgliedSeit: new Date(),
        Ehemaliger: false
    });
    const [formDataNotizen, setFormDataNotizen] = useState<MitgliedNotizenFormData>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [btnNeuEnabled, setBtnNeuEnabled] = useState(true);
    const [btnBearbeitenEnabled, setBtnBearbeitenEnabled] = useState(false);
    const [btnSpeichernEnabled, setBtnSpeichernEnabled] = useState(false);
    const [btnDruckenEnabled, setBtnDruckenEnabled] = useState(false);
    const [isEditable, setIsEditable] = useState(false);

    // Synchronisation des lokalen State mit dem Prop
    useEffect(() => {
        //console.log('Props MitgliedID changed:', MitgliedID);
        setCurrentMitgliedID(MitgliedID);

        return () => {} //Cleanup function
    }, [MitgliedID]);

    // Funktion zum Aktualisieren der FormData
    const handleFormDataPersoenlichesChange = (field: keyof MitgliedPersoenlichesFormData, value: string | Date | boolean) => {
        setFormDataMitgliedPersoenliches(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFormDataNotizenChange = (field: keyof MitgliedNotizenFormData, value: string | Date | boolean) => {
        setFormDataNotizen(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Validierungsfunktion
    const validateForm = useCallback(() => {
        try {
            mitgliedSchema.parse(formDataMitgliedPersoenliches);
            setValidationErrors({});
            return { isValid: true };
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors: Record<string, string> = {};
                error.issues.forEach(err => {
                    if (err.path.length > 0) {
                        errors[err.path[0].toString()] = err.message;
                    }
                });
                setValidationErrors(errors);
                return { isValid: false, errors: error };
            }
            return { isValid: false };
        }
    }, [formDataMitgliedPersoenliches]);

    useEffect(() => {
        //console.log('useEffect Laden => MitgliedID,  currentMitgliedID:', MitgliedID, currentMitgliedID);

        if (currentMitgliedID < 0){
            setMitglied(null);

            // FormData zurücksetzen
            setFormDataMitgliedPersoenliches({
                Vorname: "",
                Nachname: "",
                MitgliedSeit: new Date(),
                Ehemaliger: false
            });
            setFormDataNotizen({});
        }

        if (currentMitgliedID === 0) {
            const newMitglied = {
                Vorname: "",
                Nachname: "",
                MitgliedSeit: new Date(),
                Ehemaliger: false,
            } as MitgliedCreate;
            setMitglied(newMitglied);

            // FormData zurücksetzen
            setFormDataMitgliedPersoenliches({
                Vorname: "",
                Nachname: "",
                MitgliedSeit: new Date(),
                Ehemaliger: false
            });
            setFormDataNotizen({});

            return;
        }

        const fetchMitglied = async () => {
            setLoading(true);
            setError(null);

            try {
                //console.log('Lade Mitglied mit ID:', currentMitgliedID);
                const result = await getMitgliedById(MitgliedID);
                if (result.success && result.data) {
                    const mitgliedData = result.data;
                    setMitglied(mitgliedData as any);

                    // FormData mit Mitgliederdaten befüllen
                    setFormDataMitgliedPersoenliches({
                        Anrede: mitgliedData.Anrede || "",
                        Vorname: mitgliedData.Vorname || "",
                        Nachname: mitgliedData.Nachname || "",
                        Spitzname: mitgliedData.Spitzname || "",
                        Strasse: mitgliedData.Strasse || "",
                        PLZ: mitgliedData.PLZ || "",
                        Ort: mitgliedData.Ort || "",
                        TelefonPrivat: mitgliedData.TelefonPrivat || "",
                        TelefonMobil: mitgliedData.TelefonMobil || "",
                        EMail: mitgliedData.EMail || "",
                        Geburtsdatum: mitgliedData.Geburtsdatum ? new Date(mitgliedData.Geburtsdatum) : undefined,
                        MitgliedSeit: mitgliedData.MitgliedSeit ? new Date(mitgliedData.MitgliedSeit) : new Date(),
                        PassivSeit: mitgliedData.PassivSeit ? new Date(mitgliedData.PassivSeit) : undefined,
                        AusgeschiedenAm: mitgliedData.AusgeschiedenAm ? new Date(mitgliedData.AusgeschiedenAm) : undefined,
                        Ehemaliger: mitgliedData.Ehemaliger || false
                    });

                    setFormDataNotizen({
                        Notizen: mitgliedData.Notizen || "",
                        Bemerkungen: mitgliedData.Bemerkungen || ""
                    });

                    //console.log('Mitgliederdaten geladen:', result.data);

                    setBtnNeuEnabled(true);
                    setBtnBearbeitenEnabled(true);
                    setBtnSpeichernEnabled(false);
                    setBtnDruckenEnabled(true);
                } else {
                    setError(result.error || 'Fehler beim Laden der Mitgliederdaten');
                    setBtnNeuEnabled(true);
                    setBtnBearbeitenEnabled(false);
                    setBtnSpeichernEnabled(false);
                    setBtnDruckenEnabled(false);
                }
            } catch (err) {
                setError('Unbekannter Fehler');

                setBtnNeuEnabled(true);
                setBtnBearbeitenEnabled(false);
                setBtnSpeichernEnabled(false);
                setBtnDruckenEnabled(false);
            } finally {
                setLoading(false);
            }
        };

        fetchMitglied();

        return () => {} //Cleanup function
    }, [MitgliedID, currentMitgliedID]);

    const handleNeuClick = () => {
        setCurrentMitgliedID(0);

        const newMitglied = {
            Vorname: "",
            Nachname: "",
            MitgliedSeit: new Date(),
            Ehemaliger: false,
        } as MitgliedCreate;

        setMitglied(newMitglied);

        // FormData für neues Mitglied setzen
        setFormDataMitgliedPersoenliches({
            Vorname: "",
            Nachname: "",
            MitgliedSeit: new Date(),
            Ehemaliger: false
        });
        setFormDataNotizen({});

        // Validierungsfehler zurücksetzen
        setValidationErrors({});

        //console.log('btnNeu => nach set mitglied:', mitglied);

        setLoading(false);
        setError(null);

        setBtnNeuEnabled(false);
        setBtnBearbeitenEnabled(false);
        setBtnSpeichernEnabled(true);
        setIsEditable(true);
    }

    const handleBearbeitenClick = () => {
        //alert('bearbeiten..');
        setBtnNeuEnabled(false);
        setBtnBearbeitenEnabled(false);
        setBtnSpeichernEnabled(true);
        setIsEditable(true);
    }

    const handleSpeichernClick = useCallback(async () => {
        try {
            // Validierung
            const validation = validateForm();

            if (!validation.isValid) {
                const firstError = validation.errors?.issues[0];
                console.log('Validierungsfehler:', validation.errors?.issues);
                toast.error(`Validierungsfehler: ${firstError?.message || 'Bitte korrigieren Sie die Eingabefehler!'}`);
                return;
            }

            // Daten zu einem vollständigen Mitglied-Objekt zusammenführen
            const completeFormData = {
                ...formDataMitgliedPersoenliches,
                ...formDataNotizen
            };

            //console.log("currentMitgliedID:", currentMitgliedID);
            //console.log('Speichere Mitgliederdaten:', completeFormData);

            setLoading(true);

            if (currentMitgliedID > 0) {
                // Update existierendes Mitglied
                const result = await updateMitglied(currentMitgliedID, completeFormData);
                if (result.success && result.data) {
                    // Aktualisiere lokalen State mit den neuen Daten
                    setMitglied(result.data as any);
                    // Erfolgreiche Speicherung anzeigen
                    toast.success('Mitgliederdaten wurden erfolgreich geändert!');
                } else {
                    throw new Error(result.error || 'Fehler beim Aktualisieren des Mitglieds');
                }
            } else {
                // Neues Mitglied erstellen
                const result = await createMitglied(completeFormData);
                if (result.success && result.data) {
                    setMitglied(result.data as any);
                    // Erfolgreiche Speicherung anzeigen
                    toast.success('Mitglied wurde erfolgreich angelegt!');
                } else {
                    throw new Error(result.error || 'Fehler beim Erstellen des Mitglieds');
                }
            }

            setBtnNeuEnabled(true);
            setBtnBearbeitenEnabled(true);
            setBtnSpeichernEnabled(false);
            setBtnDruckenEnabled(true);
            setIsEditable(false);

            // Nach dem Speichern die übergeordnete Komponente über die Änderung informieren
            if (onDataChange) {
                onDataChange();
            }
        } catch (err: any) {
            console.error('Fehler beim Speichern:', err);
            setError(err.message || 'Fehler beim Speichern der Mitgliederdaten');
            toast.error(err.message || 'Fehler beim Speichern der Mitgliederdaten');
        } finally {
            setLoading(false);
        }
    }, [currentMitgliedID, formDataMitgliedPersoenliches, formDataNotizen, validateForm, onDataChange]);

    const handleDruckenClick = () => {
        toast.info('Druckfunktion wird implementiert...');
    }

    if (currentMitgliedID < 0) {
        return (
            <Card className="w-full gap-0">
                <CardHeader className="pb-2">
                    <h2 className="text-lg font-semibold">Mitglied-Daten</h2>
                </CardHeader>
                <CardContent className="pt-2 p-4">
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-gray-500">Kein Mitglied ausgewählt</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="flex justify-end">
                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnNeuEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnNeuEnabled}
                                onClick={() => {
                                    handleNeuClick();
                                }}
                        >Neues Mitglied
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnBearbeitenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnBearbeitenEnabled}
                                onClick={() => {
                                    handleBearbeitenClick();
                                }}
                        >Bearbeiten
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnSpeichernEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnSpeichernEnabled}

                                onClick={() => {
                                    handleSpeichernClick();
                                }}
                        >Speichern
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnDruckenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnDruckenEnabled}
                                onClick={() => {
                                    handleDruckenClick();
                                }}
                        >Drucken
                        </button>
                    </div>
                </CardFooter>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card className="w-full gap-0">
                <CardHeader className="pb-2">
                    <h2 className="text-lg font-semibold">Mitglied-Daten</h2>
                </CardHeader>
                <CardContent className="pt-2 p-4">
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-gray-500">Lade Mitgliederdaten...</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="flex justify-end">
                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnNeuEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnNeuEnabled}
                                onClick={() => {
                                    handleNeuClick();
                                }}
                        >Neues Mitglied
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnBearbeitenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnBearbeitenEnabled}
                                onClick={() => {
                                    handleBearbeitenClick();
                                }}
                        >Bearbeiten
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnSpeichernEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnSpeichernEnabled}

                                onClick={() => {
                                    handleSpeichernClick();
                                }}
                        >Speichern
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnDruckenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnDruckenEnabled}
                                onClick={() => {
                                    handleDruckenClick();
                                }}
                        >Drucken
                        </button>
                    </div>
                </CardFooter>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="w-full gap-0">
                <CardHeader className="pb-2">
                    <h2 className="text-lg font-semibold">Mitglied-Daten</h2>
                </CardHeader>
                <CardContent className="pt-2 p-4">
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-gray-500">Fehler: {error}</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="flex justify-end">
                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnNeuEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnNeuEnabled}
                                onClick={() => {
                                    handleNeuClick();
                                }}
                        >Neues Mitglied
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnBearbeitenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnBearbeitenEnabled}
                                onClick={() => {
                                    handleBearbeitenClick();
                                }}
                        >Bearbeiten
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnSpeichernEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnSpeichernEnabled}

                                onClick={() => {
                                    handleSpeichernClick();
                                }}
                        >Speichern
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnDruckenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnDruckenEnabled}
                                onClick={() => {
                                    handleDruckenClick();
                                }}
                        >Drucken
                        </button>
                    </div>
                </CardFooter>
            </Card>
        );
    }

    //if (!mitglied) {
    if (!mitglied || currentMitgliedID < 0) {
        return (
            <Card className="w-full gap-0">
                <CardHeader className="pb-2">
                    <h2 className="text-lg font-semibold">Mitglied-Daten</h2>
                </CardHeader>
                <CardContent className="pt-2 p-4">
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-gray-500">Mitglied nicht gefunden</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <div className="flex justify-end">
                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnNeuEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnNeuEnabled}
                                onClick={() => {
                                    handleNeuClick();
                                }}
                        >Neues Mitglied
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnBearbeitenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnBearbeitenEnabled}
                                onClick={() => {
                                    handleBearbeitenClick();
                                }}
                        >Bearbeiten
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnSpeichernEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnSpeichernEnabled}

                                onClick={() => {
                                    handleSpeichernClick();
                                }}
                        >Speichern
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnDruckenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnDruckenEnabled}
                                onClick={() => {
                                    handleDruckenClick();
                                }}
                        >Drucken
                        </button>
                    </div>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card className="w-full gap-0">
            <CardHeader className="pb-2">
                <h2 className="text-lg font-semibold">Mitglied-Daten</h2>
            </CardHeader>
            <CardContent className="pt-2 p-4">
                <Tabs defaultValue="persoenliches" className="mb-4">
                    <TabsList>
                        <TabsTrigger value="persoenliches">Persönliches</TabsTrigger>
                        <TabsTrigger value="notizen">Notizen</TabsTrigger>
                        <TabsTrigger value="ergebnisse">Ergebnisse</TabsTrigger>
                        <TabsTrigger value="statistik">Statistik</TabsTrigger>
                    </TabsList>

                    <TabsContent value="persoenliches">
                        <FormPersoenliches formData={formDataMitgliedPersoenliches}
                                           onFormDataChange={handleFormDataPersoenlichesChange}
                                           validationErrors={validationErrors}
                                           isEditable={isEditable}
                        />
                    </TabsContent>

                    <TabsContent value="notizen">
                        <FormNotizen formData={formDataNotizen}
                                     onFormDataChange={handleFormDataNotizenChange}
                                     isEditable={isEditable}
                        />
                    </TabsContent>
                    {/* Versteckte Refs für alle Formulare - immer gerendert */}
                    <div style={{ display: 'none' }}>
                        <FormPersoenliches formData={formDataMitgliedPersoenliches}
                                           onFormDataChange={handleFormDataPersoenlichesChange}
                                           validationErrors={validationErrors}
                                           isEditable={isEditable}/>
                        <FormNotizen formData={formDataNotizen}
                                     onFormDataChange={handleFormDataNotizenChange}
                                     isEditable={isEditable}/>
                    </div>

                    <TabsContent value="ergebnisse">
                        {/* Ergebnisse */}
                        <div className="mt-4">
                            <h2 className="font-semibold">Ergebnisse</h2>
                            <p>Ergebnisse:</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="statistik">
                        {/* Statistiken */}
                        <div className="mt-4">
                            <h2 className="font-semibold">Statistik</h2>
                            <p>Statistik:</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
            <CardFooter>
                <div className="flex justify-end">
                    <button className={`px-4 py-2 rounded-md mr-2 ${
                        btnNeuEnabled
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                            disabled={!btnNeuEnabled}
                            onClick={() => {
                                handleNeuClick();
                            }}
                    >Neues Mitglied
                    </button>

                    <button className={`px-4 py-2 rounded-md mr-2 ${
                        btnBearbeitenEnabled
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                            disabled={!btnBearbeitenEnabled}
                            onClick={() => {
                                handleBearbeitenClick();
                            }}
                    >Bearbeiten
                    </button>

                    <button className={`px-4 py-2 rounded-md mr-2 ${
                        btnSpeichernEnabled
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                            disabled={!btnSpeichernEnabled}

                            onClick={() => {
                                handleSpeichernClick();
                            }}
                    >Speichern
                    </button>

                    <button className={`px-4 py-2 rounded-md mr-2 ${
                        btnDruckenEnabled
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                            disabled={!btnDruckenEnabled}
                            onClick={() => {
                                handleDruckenClick();
                            }}
                    >Drucken
                    </button>
                </div>
            </CardFooter>
        </Card>
    );
}