"use client"

import React, {useState} from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {Checkbox} from "@/components/ui/checkbox"
import {Calendar} from "@/components/ui/calendar"
import {Button} from "@/components/ui/button"
import {CalendarIcon} from "lucide-react"
import {format} from "date-fns"
import {de} from "date-fns/locale"
import {MitgliedPersoenlichesFormData} from "@/interfaces/MitgliedPersoenlichesFormData";

interface FormPersoenlichesProps {
    formData: MitgliedPersoenlichesFormData;
    onFormDataChange: (field: keyof MitgliedPersoenlichesFormData, value: string | Date | boolean) => void;
    validationErrors: Record<string, string>;
    isEditable: boolean;
}

const FormPersoenliches: React.FC<FormPersoenlichesProps> = ({
                                                                 formData,
                                                                 onFormDataChange,
                                                                 validationErrors,
                                                                 isEditable
                                                             }) => {

    const [showGeburtsdatum, setShowGeburtsdatum] = useState(false);
    const [showMitgliedSeit, setShowMitgliedSeit] = useState(false);
    const [showPassivSeit, setShowPassivSeit] = useState(false);
    const [showAusgeschiedenAm, setShowAusgeschiedenAm] = useState(false);


    const handleInputChange = (field: keyof MitgliedPersoenlichesFormData, value: string | Date | boolean) => {
        onFormDataChange(field, value);
    };


    const handleDateSelect = (field: 'Geburtsdatum' | 'MitgliedSeit' | 'PassivSeit' | 'AusgeschiedenAm', date: Date | undefined) => {
        if (date) {
            handleInputChange(field, date);
        }
        // Kalender schließen
        if (field === 'Geburtsdatum') setShowGeburtsdatum(false);
        if (field === 'MitgliedSeit') setShowMitgliedSeit(false);
        if (field === 'PassivSeit') setShowPassivSeit(false);
        if (field === 'AusgeschiedenAm') setShowAusgeschiedenAm(false);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardContent>
                {/* Persönliche Informationen */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="anrede">Anrede</Label>
                        <Input
                            id="vorname"
                            value={formData.Anrede || ""}
                            onChange={(e) => handleInputChange('Anrede', e.target.value)}
                            placeholder="Anrede"
                            required
                            disabled={!isEditable}
                        />
                        {validationErrors.Anrede && (
                            <p className="text-sm text-red-500">{validationErrors.Anrede}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="vorname">Vorname *</Label>
                        <Input
                            id="vorname"
                            value={formData.Vorname || ""}
                            onChange={(e) => handleInputChange('Vorname', e.target.value)}
                            placeholder="Vorname"
                            required
                            disabled={!isEditable}
                        />
                        {validationErrors.Vorname && (
                            <p className="text-sm text-red-500">{validationErrors.Vorname}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nachname">Nachname *</Label>
                        <Input
                            id="nachname"
                            value={formData.Nachname || ""}
                            onChange={(e) => handleInputChange('Nachname', e.target.value)}
                            placeholder="Nachname"
                            required
                            disabled={!isEditable}
                        />
                        {validationErrors.Nachname && (
                            <p className="text-sm text-red-500">{validationErrors.Nachname}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="spitzname">Spitzname</Label>
                        <Input
                            id="spitzname"
                            value={formData.Spitzname || ""}
                            onChange={(e) => handleInputChange('Spitzname', e.target.value)}
                            placeholder="Spitzname"
                            disabled={!isEditable}
                        />
                        {validationErrors.Spitzname && (
                            <p className="text-sm text-red-500">{validationErrors.Spitzname}</p>
                        )}
                    </div>
                </div>

                {/* Adresse */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="strasse">Straße</Label>
                        <Input
                            id="strasse"
                            value={formData.Strasse || ""}
                            onChange={(e) => handleInputChange('Strasse', e.target.value)}
                            placeholder="Straße und Hausnummer"
                            disabled={!isEditable}
                        />
                        {validationErrors.Strasse && (
                            <p className="text-sm text-red-500">{validationErrors.Strasse}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="plz">PLZ</Label>
                            <Input
                                id="plz"
                                value={formData.PLZ || ""}
                                onChange={(e) => handleInputChange('PLZ', e.target.value)}
                                placeholder="PLZ"
                                maxLength={5}
                                disabled={!isEditable}
                            />
                            {validationErrors.PLZ && (
                                <p className="text-sm text-red-500">{validationErrors.PLZ}</p>
                            )}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="ort">Ort</Label>
                            <Input
                                id="ort"
                                value={formData.Ort || ""}
                                onChange={(e) => handleInputChange('Ort', e.target.value)}
                                placeholder="Ort"
                                disabled={!isEditable}
                            />
                            {validationErrors.Ort && (
                                <p className="text-sm text-red-500">{validationErrors.Ort}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Kontaktdaten */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Kontaktdaten</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="festnetz">Festnetz</Label>
                            <Input
                                id="festnetz"
                                value={formData.TelefonPrivat || ""}
                                onChange={(e) => handleInputChange('TelefonPrivat', e.target.value)}
                                placeholder="Festnetznummer"
                                disabled={!isEditable}
                            />
                            {validationErrors.TelefonPrivat && (
                                <p className="text-sm text-red-500">{validationErrors.TelefonPrivat}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mobil">Mobil</Label>
                            <Input
                                id="mobil"
                                value={formData.TelefonMobil || ""}
                                onChange={(e) => handleInputChange('TelefonMobil', e.target.value)}
                                placeholder="Mobilnummer"
                                disabled={!isEditable}
                            />
                            {validationErrors.TelefonMobil && (
                                <p className="text-sm text-red-500">{validationErrors.TelefonMobil}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">E-Mail</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.EMail || ""}
                            onChange={(e) => handleInputChange('EMail', e.target.value)}
                            placeholder="E-Mail-Adresse"
                            disabled={!isEditable}
                        />
                        {validationErrors.EMail && (
                            <p className="text-sm text-red-500">{validationErrors.EMail}</p>
                        )}
                    </div>
                </div>

                {/* Datumsfelder */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Zeittafel</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Geburtsdatum */}
                        <div className="space-y-2">
                            <Label>Geburtsdatum</Label>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                    onClick={() => setShowGeburtsdatum(!showGeburtsdatum)}
                                    disabled={!isEditable}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4"/>
                                    {formData.Geburtsdatum ? (
                                        format(formData.Geburtsdatum, "PPP", {locale: de})
                                    ) : (
                                        <span>Datum wählen</span>
                                    )}
                                </Button>
                                {showGeburtsdatum && isEditable && (
                                    <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg">
                                        <Calendar
                                            hideNavigation captionLayout="dropdown"
                                            mode="single"
                                            selected={formData.Geburtsdatum}
                                            onSelect={(date) => handleDateSelect('Geburtsdatum', date)}
                                            initialFocus
                                        />
                                    </div>
                                )}
                            </div>
                            {validationErrors.Geburtsdatum && (
                                <p className="text-sm text-red-500">{validationErrors.Geburtsdatum}</p>
                            )}
                        </div>

                        {/* Mitglied seit */}
                        <div className="space-y-2">
                            <Label>Mitglied seit *</Label>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                    onClick={() => setShowMitgliedSeit(!showMitgliedSeit)}
                                    disabled={!isEditable}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4"/>
                                    {format(formData.MitgliedSeit, "PPP", {locale: de})}
                                </Button>
                                {showMitgliedSeit && isEditable && (
                                    <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg">
                                        <Calendar
                                            hideNavigation captionLayout="dropdown"
                                            mode="single"
                                            selected={formData.MitgliedSeit}
                                            onSelect={(date) => handleDateSelect('MitgliedSeit', date)}
                                            initialFocus
                                        />
                                    </div>
                                )}
                            </div>
                            {validationErrors.MitgliedSeit && (
                                <p className="text-sm text-red-500">{validationErrors.MitgliedSeit}</p>
                            )}
                        </div>

                        {/* Passiv seit */}
                        <div className="space-y-2">
                            <Label>Passiv seit</Label>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                    onClick={() => setShowPassivSeit(!showPassivSeit)}
                                    disabled={!isEditable}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4"/>
                                    {formData.PassivSeit ? (
                                        format(formData.PassivSeit, "PPP", {locale: de})
                                    ) : (
                                        <span>Datum wählen</span>
                                    )}
                                </Button>
                                {showPassivSeit && isEditable && (
                                    <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg">
                                        <Calendar
                                            hideNavigation captionLayout="dropdown"
                                            mode="single"
                                            selected={formData.PassivSeit}
                                            onSelect={(date) => handleDateSelect('PassivSeit', date)}
                                            initialFocus
                                        />
                                    </div>
                                )}
                            </div>
                            {validationErrors.PassivSeit && (
                                <p className="text-sm text-red-500">{validationErrors.PassivSeit}</p>
                            )}
                        </div>

                        {/* Ausgeschieden am */}
                        <div className="space-y-2">
                            <Label>Ausgeschieden am</Label>
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                    onClick={() => setShowAusgeschiedenAm(!showAusgeschiedenAm)}
                                    disabled={!isEditable}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4"/>
                                    {formData.AusgeschiedenAm ? (
                                        format(formData.AusgeschiedenAm, "PPP", {locale: de})
                                    ) : (
                                        <span>Datum wählen</span>
                                    )}
                                </Button>
                                {showAusgeschiedenAm && isEditable && (
                                    <div className="absolute z-10 mt-1 bg-white border rounded-md shadow-lg">
                                        <Calendar
                                            hideNavigation captionLayout="dropdown"
                                            mode="single"
                                            selected={formData.AusgeschiedenAm}
                                            onSelect={(date) => handleDateSelect('AusgeschiedenAm', date)}
                                            initialFocus
                                        />
                                    </div>
                                )}
                            </div>
                            {validationErrors.AusgeschiedenAm && (
                                <p className="text-sm text-red-500">{validationErrors.AusgeschiedenAm}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Status</h3>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="ehemaliger"
                            checked={formData.Ehemaliger}
                            onCheckedChange={(checked) => handleInputChange('Ehemaliger', checked as boolean)}
                            disabled={!isEditable}
                        />
                        <Label
                            htmlFor="ehemaliger"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            Ehemaliger
                        </Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

FormPersoenliches.displayName = 'FormPersoenliches';

export default FormPersoenliches;
