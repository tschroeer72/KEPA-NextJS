import {Card, CardContent, CardFooter} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs";
import FormMeisterschaftsdaten from "./form-meisterschaft-daten";
import {MeisterschaftDatenFormDataFormData} from "@/interfaces/meisterschaft-daten-form-data";
import {useState, useEffect, useCallback} from "react";
import {toast} from "sonner";
import { getMeisterschaftById, updateMeisterschaft, createMeisterschaft } from "@/app/actions/verwaltung/meisterschaften/actions";
import Mitspieler from "@/app/verwaltung/meisterschaften/_components/mitspieler";
import {meisterschaftsSchema} from "@/zod/meisterschaftSchema";
import {z} from "zod";

interface MeisterschaftdatenProps {
    MeisterschaftID: number;
    onDataChange?: () => void;
    onMeisterschaftSelect?: (id: number) => void;
}

export default function Meisterschaftsdaten({MeisterschaftID, onDataChange, onMeisterschaftSelect}: MeisterschaftdatenProps) {
    //console.log('Meisterschaftsdaten: MeisterschaftID:', MeisterschaftID);

    const [formData, setFormData] = useState<MeisterschaftDatenFormDataFormData>({
        Bezeichnung: "",
        Beginn: new Date(),
        Ende: undefined,
        MeisterschaftstypID: 1,
        Aktiv: 1,
        Bemerkungen: ""
    });
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const [meisterschaft, setMeisterschaft] = useState<Meisterschaft | MeisterschaftCreate | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [btnNeuEnabled, setBtnNeuEnabled] = useState(true);
    const [btnBearbeitenEnabled, setBtnBearbeitenEnabled] = useState(false);
    const [btnSpeichernEnabled, setBtnSpeichernEnabled] = useState(false);
    const [isEditable, setIsEditable] = useState(false);

    // Synchronisation des lokalen State mit dem Prop
    useEffect(() => {
        const loadMeisterschaftsdaten = async () => {
            // Zurücksetzen bei ungültiger ID
            if (MeisterschaftID < 0) {
                setMeisterschaft(null);
                setFormData({
                    Bezeichnung: "",
                    Beginn: new Date(),
                    Ende: undefined,
                    MeisterschaftstypID: 1,
                    Aktiv: 1,
                    Bemerkungen: ""
                });
                setError(null);
                setBtnBearbeitenEnabled(false);
                return;
            }

            // Neue Meisterschaft erstellen
            if (MeisterschaftID === 0) {
                const newMeisterschaft = {
                    Bezeichnung: "",
                    Beginn: new Date(),
                    Ende: undefined,
                    MeisterschaftstypID: 1,
                    Aktiv: 1,
                    Bemerkungen: ""
                } as MeisterschaftCreate;

                setMeisterschaft(newMeisterschaft);
                setFormData({
                    Bezeichnung: "",
                    Beginn: new Date(),
                    Ende: undefined,
                    MeisterschaftstypID: 1,
                    Aktiv: 1,
                    Bemerkungen: ""
                });
                setError(null);
                setBtnNeuEnabled(false);
                setBtnBearbeitenEnabled(false);
                setBtnSpeichernEnabled(true);
                setIsEditable(true);
                return;
            }

            // Existierende Meisterschaft laden
            setLoading(true);
            setError(null);

            try {
                const result = await getMeisterschaftById(MeisterschaftID);
                if (result.success && result.data) {
                    const meisterschaftData = result.data;
                    setMeisterschaft(meisterschaftData as any);

                    // FormData mit Meisterschaftsdaten befüllen
                    setFormData({
                        Bezeichnung: meisterschaftData.Bezeichnung || "",
                        Beginn: new Date(meisterschaftData.Beginn),
                        Ende: meisterschaftData.Ende ? new Date(meisterschaftData.Ende) : undefined,
                        MeisterschaftstypID: meisterschaftData.MeisterschaftstypID || 1,
                        Aktiv: meisterschaftData.Aktiv || 0,
                        Bemerkungen: meisterschaftData.Bemerkungen || ""
                    });

                    setBtnNeuEnabled(true);
                    setBtnBearbeitenEnabled(true);
                    setBtnSpeichernEnabled(false);
                    setIsEditable(false);
                } else {
                    setError(result.error || 'Fehler beim Laden der Meisterschaftsdaten');

                    setBtnNeuEnabled(true);
                    setBtnBearbeitenEnabled(false);
                    setBtnSpeichernEnabled(false);
                }
            } catch (err: any) {
                setError(err.message || 'Unbekannter Fehler');

                setBtnNeuEnabled(true);
                setBtnBearbeitenEnabled(false);
                setBtnSpeichernEnabled(false);
            } finally {
                setLoading(false);
            }
        };

        loadMeisterschaftsdaten();
    }, [MeisterschaftID]); // Nur MeisterschaftID als Dependency

    // Validierungsfunktion
    const validateForm = useCallback(() => {
        try {
            meisterschaftsSchema.parse(formData);
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
    }, [formData]);

    const handleNeuClick = () => {
        onMeisterschaftSelect?.(0);
    }

    const handleBearbeitenClick = () => {
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
                //console.log('Validierungsfehler:', validation.errors?.issues);
                toast.error(`Validierungsfehler: ${firstError?.message || 'Bitte korrigieren Sie die Eingabefehler!'}`);
                return;
            }

            //console.log("MeisterschaftID:", MeisterschaftID);
            //console.log('Speichere Meisterschaftsdaten:', formData);

            setLoading(true);

            if (MeisterschaftID > 0) {
                // Update existierende Meisterschaft
                const result = await updateMeisterschaft(MeisterschaftID, formData);
                if (result.success && result.data) {
                    // Aktualisiere lokalen State mit den neuen Daten
                    setMeisterschaft(result.data as any);
                    toast.success('Meisterschaftsdaten wurden erfolgreich geändert!');
                } else {
                    throw new Error(result.error || 'Fehler beim Aktualisieren der Meisterschaft');
                }
            } else {
                // Neue Meisterschaft erstellen
                const result = await createMeisterschaft(formData);
                if (result.success && result.data) {
                    const savedData = result.data as any;
                    setMeisterschaft(savedData);
                    toast.success('Meisterschaft wurde erfolgreich angelegt!');
                    
                    // Neue ID an Parent-Komponente weitergeben
                    if (savedData.ID) {
                        onMeisterschaftSelect?.(savedData.ID);
                    }
                } else {
                    throw new Error(result.error || 'Fehler beim Erstellen der Meisterschaft');
                }
            }

            setBtnNeuEnabled(true);
            setBtnBearbeitenEnabled(true);
            setBtnSpeichernEnabled(false);
            setIsEditable(false);

            // Nach dem Speichern die übergeordnete Komponente über die Änderung informieren
            if (onDataChange) {
                onDataChange();
            }
        } catch (err: any) {
            setError(err.message || 'Fehler beim Speichern der Meisterschaftsdaten');
            toast.error(err.message || 'Fehler beim Speichern der Meisterschaftsdaten');
        } finally {
            setLoading(false);
        }
    }, [MeisterschaftID, formData, validateForm, onDataChange]);

    const handleFormDataChange = (field: keyof MeisterschaftDatenFormDataFormData, value: string | number | Date | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (MeisterschaftID < 0) {
        return (
            <Card className="w-full gap-0">
                <CardContent className="pt-2 p-4">
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-gray-500">Keine Meisterschaft ausgewählt</p>
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
                                }}>
                            Neue Meisterschaft
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnBearbeitenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnBearbeitenEnabled}
                                onClick={() => {
                                    handleBearbeitenClick();
                                }}>
                            Bearbeiten
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnSpeichernEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnSpeichernEnabled}

                                onClick={() => {
                                    handleSpeichernClick();
                                }}>
                            Speichern
                        </button>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    if (loading) {
        return (
            <Card className="w-full gap-0">
                <CardContent className="pt-2 p-4">
                    <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-gray-500">Lade Meisterschaftsdaten...</p>
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
                                }}>
                            Neue Meisterschaft
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnBearbeitenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnBearbeitenEnabled}
                                onClick={() => {
                                    handleBearbeitenClick();
                                }}>
                            Bearbeiten
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnSpeichernEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnSpeichernEnabled}

                                onClick={() => {
                                    handleSpeichernClick();
                                }}>
                            Speichern
                        </button>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="w-full gap-0">
                <CardContent className="pt-2 p-4">
                    <div className="flex flex-col items-center justify-center h-full">
                        <div className="flex flex-col items-center justify-center h-full">
                            <p className="text-gray-500">Fehler: {error}</p>
                        </div>
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
                                }}>
                            Neue Meisterschaft
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnBearbeitenEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnBearbeitenEnabled}
                                onClick={() => {
                                    handleBearbeitenClick();
                                }}>
                            Bearbeiten
                        </button>

                        <button className={`px-4 py-2 rounded-md mr-2 ${
                            btnSpeichernEnabled
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                                disabled={!btnSpeichernEnabled}

                                onClick={() => {
                                    handleSpeichernClick();
                                }}>
                            Speichern
                        </button>
                    </div>
                </CardFooter>
            </Card>
        )
    }

    return (
        <Card className="w-full gap-0">
            {/*<CardHeader className="pb-2">*/}
            {/*    <h2 className="text-lg font-semibold">Meisterschaftsdaten</h2>*/}
            {/*</CardHeader>*/}
            <CardContent className="pt-2 p-4">
                <Tabs defaultValue="meisterschaftsdaten" className="mb-4">
                    <TabsList>
                        <TabsTrigger value="meisterschaftsdaten">Meisterschaftsdaten</TabsTrigger>
                        <TabsTrigger value="mitspieler">Mitspieler</TabsTrigger>
                    </TabsList>

                    <TabsContent value="meisterschaftsdaten">
                        <FormMeisterschaftsdaten
                            formData={formData}
                            onFormDataChange={handleFormDataChange}
                            validationErrors={validationErrors}
                            isEditable={isEditable}
                        />
                    </TabsContent>
                    {/* Versteckte Refs für alle Formulare - immer gerendert */}
                    <div style={{ display: 'none' }}>
                        <FormMeisterschaftsdaten
                            formData={formData}
                            onFormDataChange={handleFormDataChange}
                            validationErrors={validationErrors}
                            isEditable={isEditable}
                        />
                    </div>

                    <TabsContent value="mitspieler">
                        <Mitspieler meisterschaftID={MeisterschaftID} />
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
                            }}>
                        Neue Meisterschaft
                    </button>

                    <button className={`px-4 py-2 rounded-md mr-2 ${
                        btnBearbeitenEnabled
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                            disabled={!btnBearbeitenEnabled}
                            onClick={() => {
                                handleBearbeitenClick();
                            }}>
                        Bearbeiten
                    </button>

                    <button className={`px-4 py-2 rounded-md mr-2 ${
                        btnSpeichernEnabled
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                            disabled={!btnSpeichernEnabled}

                            onClick={() => {
                                handleSpeichernClick();
                            }}>
                        Speichern
                    </button>
                </div>
            </CardFooter>
        </Card>
    )
}