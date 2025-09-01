"use client"

import React from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Label} from "@/components/ui/label"
import {MitgliedNotizenFormData} from "@/interfaces/mitglied-notizen-form-data";

interface FormNotizenProps {
    formData: MitgliedNotizenFormData;
    onFormDataChange: (field: keyof MitgliedNotizenFormData, value: string | Date | boolean) => void;
    isEditable: boolean;
}

const FormNotizen: React.FC<FormNotizenProps> = ({formData, onFormDataChange, isEditable}) => {
    const handleInputChange = (field: keyof MitgliedNotizenFormData, value: string | Date | boolean) => {
        onFormDataChange(field, value);
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardContent>
                {/* Notizen */}
                <div className="space-y-2">
                    <Label htmlFor="notizen">Notizen</Label>
                    <textarea
                        id="notizen"
                        value={formData.Notizen || ""}
                        onChange={(e) => handleInputChange('Notizen', e.target.value)}
                        placeholder="Notizen eingeben..."
                        disabled={!isEditable}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical"
                    />
                </div>

                {/* Bemerkungen */}
                <div className="space-y-2">
                    <Label htmlFor="bemerkungen">Bemerkungen</Label>
                    <textarea
                        id="bemerkungen"
                        value={formData.Bemerkungen || ""}
                        onChange={(e) => handleInputChange('Bemerkungen', e.target.value)}
                        placeholder="Bemerkungen eingeben..."
                        disabled={!isEditable}
                        rows={8}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical"
                    />
                </div>
            </CardContent>
        </Card>
    );
}

FormNotizen.displayName = 'FormNotizen';

export default FormNotizen;
