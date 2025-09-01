import {Card, CardContent, CardFooter} from "@/components/ui/card";
import {Tabs, TabsContent, TabsList, TabsTrigger,} from "@/components/ui/tabs";
import FormMeisterschaftsdaten from "./form-meisterschaft-daten";
import {MeisterschaftDatenFormDataFormData} from "@/interfaces/meisterschaft-daten-form-data";
import {useState, useEffect, useCallback} from "react";
import {toast} from "sonner";
import axios from "axios";
import Mitspieler from "@/app/verwaltung/meisterschaften/(components)/mitspieler";

interface MeisterschaftdatenProps {
    MeisterschaftID: number;
    onDataChange?: () => void;
}

export default function Meisterschaftsdaten({MeisterschaftID, onDataChange}: MeisterschaftdatenProps) {
    //console.log('Meisterschaftsdaten: MeisterschaftID:', MeisterschaftID);

    const [currentMeisterschaftsID, setCurrentMeisterschaftsID] = useState(MeisterschaftID);

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
        //console.log('Props MeisterschaftID changed:', MeisterschaftID);
        setCurrentMeisterschaftsID(MeisterschaftID);

        return () => {} //Cleanup function
    }, [MeisterschaftID]);

    useEffect(() => {
        if (currentMeisterschaftsID < 0){
            setMeisterschaft(null);

            // FormData zurücksetzen
            setFormData({
                Bezeichnung: "",
                Beginn: new Date(),
                Ende: undefined,
                MeisterschaftstypID: 1,
                Aktiv: 1,
                Bemerkungen: ""
            });
        }

        if (currentMeisterschaftsID === 0) {
            const newMeister = {
                Bezeichnung: "",
                Beginn: new Date(),
                Ende: undefined,
                MeisterschaftstypID: 1,
                Aktiv: 1,
                Bemerkungen: ""
            } as MeisterschaftCreate;
            setMeisterschaft(newMeister);

            // FormData zurücksetzen
            setFormData({
                Bezeichnung: "",
                Beginn: new Date(),
                Ende: undefined,
                MeisterschaftstypID: 1,
                Aktiv: 1,
                Bemerkungen: ""
            });

            return;
        }

        const fetchMeisterschaft = async () => {
            setLoading(true);
            setError(null);

            try {
                //console.log('Lade Mitglied mit ID:', currentMitgliedID);
                const response = await axios.get(`/api/db/meisterschaften/${MeisterschaftID}`);
                const meisterschaftData = response.data;
                setMeisterschaft(meisterschaftData);

                // FormData mit Mitgliederdaten befüllen
                setFormData({
                    Bezeichnung: meisterschaftData.Bezeichnung || "",
                    Beginn: meisterschaftData.Beginn = new Date(meisterschaftData.Beginn),
                    Ende: meisterschaftData.Ende ? new Date(meisterschaftData.Ende) : undefined,
                    MeisterschaftstypID: meisterschaftData.MeisterschaftstypID || 1,
                    Aktiv: meisterschaftData.Aktiv || false,
                    Bemerkungen: meisterschaftData.Bemerkungen || ""
                });

                //console.log('Mitgliederdaten geladen:', response.data);

                setBtnNeuEnabled(true);
                setBtnBearbeitenEnabled(true);
                setBtnSpeichernEnabled(false);
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.error || 'Fehler beim Laden der Mitgliederdaten');
                } else {
                    setError('Unbekannter Fehler');
                }

                setBtnNeuEnabled(true);
                setBtnBearbeitenEnabled(false);
                setBtnSpeichernEnabled(false);
            } finally {
                setLoading(false);
            }
        };

        fetchMeisterschaft();

        return () => {} //Cleanup function
    },[MeisterschaftID, currentMeisterschaftsID]);

    const handleNeuClick = () => {
        // setCurrentMitgliedID(0);
        //
        // const newMitglied = {
        //     Vorname: "",
        //     Nachname: "",
        //     MitgliedSeit: new Date(),
        //     Ehemaliger: false,
        // } as MitgliedCreate;
        //
        // setMitglied(newMitglied);
        //
        // // FormData für neues Mitglied setzen
        // setFormDataMitgliedPersoenliches({
        //     Vorname: "",
        //     Nachname: "",
        //     MitgliedSeit: new Date(),
        //     Ehemaliger: false
        // });
        // setFormDataNotizen({});
        //
        // // Validierungsfehler zurücksetzen
        // setValidationErrors({});
        //
        // //console.log('btnNeu => nach set mitglied:', mitglied);
        //
        // setLoading(false);
        // setError(null);

        setBtnNeuEnabled(false);
        setBtnBearbeitenEnabled(false);
        setBtnSpeichernEnabled(true);
        setIsEditable(true);
    }

    const handleBearbeitenClick = () => {
        setBtnNeuEnabled(false);
        setBtnBearbeitenEnabled(false);
        setBtnSpeichernEnabled(true);
        setIsEditable(true);
    }

    const handleSpeichernClick = useCallback(async () => {
        try {
            //     // Validierung
            //     const validation = validateForm();
            //
            //     if (!validation.isValid) {
            //         const firstError = validation.errors?.issues[0];
            //         console.log('Validierungsfehler:', validation.errors?.issues);
            //         toast.error(`Validierungsfehler: ${firstError?.message || 'Bitte korrigieren Sie die Eingabefehler!'}`);
            //         return;
            //     }
            //
            //     // Daten zu einem vollständigen Mitglied-Objekt zusammenführen
            //     const completeFormData = {
            //         ...formDataMitgliedPersoenliches,
            //         ...formDataNotizen
            //     };
            //
            //     console.log("currentMitgliedID:", currentMitgliedID);
            //     console.log('Speichere Mitgliederdaten:', completeFormData);
            //
            //     setLoading(true);
            //
            //     if (currentMitgliedID > 0) {
            //         // Update existierendes Mitglied
            //         const response = await axios.put(`/api/db/mitglieder/${currentMitgliedID}`, completeFormData);
            //         //console.log('Mitglied erfolgreich aktualisiert:', response.data);
            //
            //         // Aktualisiere lokalen State mit den neuen Daten
            //         setMitglied(response.data);
            //         // Erfolgreiche Speicherung anzeigen
            //         toast.success('Mitglied wurde erfolgreich angelegt!');
            //     } else {
            //         // Neues Mitglied erstellen
            //         const response = await axios.post(`/api/db/mitglieder`, completeFormData);
            //         //console.log('Neues Mitglied erstellt:', response.data);
            //
            //         setMitglied(response.data);
            //
            //         // Erfolgreiche Speicherung anzeigen
            //         toast.success('Mitgliederdaten wurden erfolgreich geändert!');
            //     }
            //
            //     // // Erfolgreiche Speicherung anzeigen
            //     // toast.success('Mitgliederdaten wurden erfolgreich gespeichert!');
            //
                setBtnNeuEnabled(true);
                setBtnBearbeitenEnabled(true);
                setBtnSpeichernEnabled(false);
                setIsEditable(false);

                // Nach dem Speichern die übergeordnete Komponente über die Änderung informieren
                if (onDataChange) {
                    onDataChange();
                }
        } catch (err) {
                console.error('Fehler beim Speichern:', err);
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.error || 'Fehler beim Speichern der Mitgliederdaten');
                    toast.error(err.response?.data?.error || 'Fehler beim Speichern der Mitgliederdaten');
                } else {
                    setError('Unbekannter Fehler beim Speichern');
                    toast.error('Unbekannter Fehler beim Speichern');
                }
            } finally {
                setLoading(false);
        }
    }, []);

    const handleFormDataChange = (field: keyof MeisterschaftDatenFormDataFormData, value: string | number | Date | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (currentMeisterschaftsID < 0) {
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
                        <Mitspieler meisterschaftID={currentMeisterschaftsID} />
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