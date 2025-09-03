"use client"

import React, {useEffect, useState} from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Checkbox} from "@/components/ui/checkbox"
import {Calendar} from "@/components/ui/calendar"
import {CalendarIcon} from "lucide-react"
import {format} from "date-fns"
import {de} from "date-fns/locale"
import {Button} from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select"
import {MeisterschaftDatenFormDataFormData} from "@/interfaces/meisterschaft-daten-form-data";
import {Meisterschaftstyp} from "@/interfaces/meisterschaftstyp";
import axios from "axios";

interface FormMeisterschaftDatenProps {
    formData: MeisterschaftDatenFormDataFormData;
    onFormDataChange: (field: keyof MeisterschaftDatenFormDataFormData, value: string | number | Date | boolean) => void;
    validationErrors: Record<string, string>;
    isEditable: boolean;
}

const FormMeisterschaftDaten: React.FC<FormMeisterschaftDatenProps> = ({
                                                 formData,
                                                 onFormDataChange,
                                                 validationErrors,
                                                 isEditable
                                             }) => {

    const [showBeginndatum, setShowBeginn] = useState(false);
    const [showEndedatum, setShowEndedatum] = useState(false);
    const [meisterschaftstypen, setMeisterschaftstypen] = useState<Meisterschaftstyp[]>([]);
    const [loadingMeisterschaftstypen, setLoadingMeisterschaftstypen] = useState(true);

    // Meisterschaftstypen beim Laden der Komponente abrufen
    useEffect(() => {
        const fetchMeisterschaftstypen = async () => {
            try {
                const response = await axios.get('/api/db/meisterschaftstyp');
                //console.log('Meisterschaftstypen:', response.data);
                setMeisterschaftstypen(response.data);
            } catch (error) {
                console.error('Fehler beim Laden der Meisterschaftstypen:', error);
            } finally {
                setLoadingMeisterschaftstypen(false);
            }
        };

        fetchMeisterschaftstypen();
    }, []);

    const handleInputChange = (field: keyof MeisterschaftDatenFormDataFormData, value: string | number | Date | boolean) => {
        onFormDataChange(field, value);
    };


    const handleDateSelect = (field: 'Beginn' | 'Ende', date: Date | undefined) => {
        if (date) {
            handleInputChange(field, date);
        }
        // Kalender schließen
        if (field === 'Beginn') setShowBeginn(false);
        if (field === 'Ende') setShowEndedatum(false);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Bezeichnung */}
                    <div className="space-y-2">
                        <Label htmlFor="Bezeichnung">Bezeichnung</Label>
                        <Input
                            id="bezeichnung"
                            value={formData.Bezeichnung || ""}
                            onChange={(e) => handleInputChange('Bezeichnung', e.target.value)}
                            placeholder="Bezeichnung"
                            required
                            disabled={!isEditable}
                        />
                        {validationErrors.Bezeichnung && (
                            <p className="text-sm text-red-500">{validationErrors.Bezeichnung}</p>
                        )}
                    </div>

                    {/* Beginn */}
                    <div className="space-y-2">
                        <Label>Beginn</Label>
                        <div className="relative">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                onClick={() => setShowBeginn(!showBeginndatum)}
                                disabled={!isEditable}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4"/>
                                {formData.Beginn ? (
                                    format(formData.Beginn, "PPP", {locale: de})
                                ) : (
                                    <span>Datum wählen</span>
                                )}
                            </Button>
                            {showBeginndatum && isEditable && (
                                <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg">
                                    <Calendar
                                        hideNavigation captionLayout="dropdown"
                                        mode="single"
                                        selected={formData.Beginn}
                                        onSelect={(date) => handleDateSelect('Beginn', date)}
                                        initialFocus
                                    />
                                </div>
                            )}
                        </div>
                        {validationErrors.Beginn && (
                            <p className="text-sm text-red-500">{validationErrors.Beginn}</p>
                        )}
                    </div>

                    {/* Ende */}
                    <div className="space-y-2">
                        <Label>Ende</Label>
                        <div className="relative">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                                onClick={() => setShowEndedatum(!showEndedatum)}
                                disabled={!isEditable}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4"/>
                                {formData.Ende ? (
                                    format(formData.Ende, "PPP", {locale: de})
                                ) : (
                                    <span>Datum wählen</span>
                                )}
                            </Button>
                            {showEndedatum && isEditable && (
                                <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg">
                                    <Calendar
                                        hideNavigation captionLayout="dropdown"
                                        mode="single"
                                        selected={formData.Ende}
                                        onSelect={(date) => handleDateSelect('Ende', date)}
                                        initialFocus
                                    />
                                </div>
                            )}
                        </div>
                        {validationErrors.Ende && (
                            <p className="text-sm text-red-500">{validationErrors.Ende}</p>
                        )}
                    </div>

                    {/* Meisterschaftstyp */}
                    <div className="space-y-2">
                        <Label>Meisterschaftstyp</Label>
                        <Select
                            value={formData.MeisterschaftstypID?.toString() || ""}
                            onValueChange={(value) => handleInputChange('MeisterschaftstypID', parseInt(value))}
                            disabled={!isEditable}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Meisterschaftstyp auswählen" />
                            </SelectTrigger>
                            <SelectContent>
                                {loadingMeisterschaftstypen ? (
                                    <SelectItem value="loading" disabled>
                                        Lade Meisterschaftstypen...
                                    </SelectItem>
                                ) : (
                                    meisterschaftstypen.map((typ) => (
                                        <SelectItem key={typ.ID} value={typ.ID.toString()}>
                                            {typ.Meisterschaftstyp}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {validationErrors.MeisterschaftstypID && (
                            <p className="text-sm text-red-500">{validationErrors.MeisterschaftstypID}</p>
                        )}
                    </div>

                    {/* Aktiv */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="aktiv"
                            checked={formData.Aktiv === 1}
                            onCheckedChange={(checked) => handleInputChange('Aktiv', checked ? 1 : 0)}
                            disabled={!isEditable}
                        />
                        <Label
                            htmlFor="aktiv"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Aktiv
                        </Label>
                    </div>

                    {/* Bezeichnung */}
                    <div className="space-y-2">
                        <Label htmlFor="Bezeichnung">Bemerkungen</Label>
                        <Input
                            id="bemerkungen"
                            value={formData.Bemerkungen || ""}
                            onChange={(e) => handleInputChange('Bemerkungen', e.target.value)}
                            placeholder="Bemerkungen"
                            disabled={!isEditable}
                        />
                        {validationErrors.Bemerkungen && (
                            <p className="text-sm text-red-500">{validationErrors.Bemerkungen}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )

}

FormMeisterschaftDaten.displayName = 'FormMeisterschaftDaten';

export default FormMeisterschaftDaten;
