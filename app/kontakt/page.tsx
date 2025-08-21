"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, User, Send } from "lucide-react";

export default function Kontakt() {
    const [formData, setFormData] = useState({
        name: '',
        telefon: '',
        nachricht: '',
        // Honeypot-Feld - wird von Bots ausgefüllt, aber von Menschen ignoriert
        website: ''
    });
    const [errors, setErrors] = useState<{[key: string]: string}>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Fehler zurücksetzen wenn Benutzer tippt
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        // Bot-Schutz: Honeypot-Feld prüfen
        // Wenn das versteckte "website"-Feld ausgefüllt wurde, ist es wahrscheinlich ein Bot
        if (formData.website.trim()) {
            newErrors.bot = 'Bot erkannt. Das Formular kann nicht gesendet werden.';
            return false;
        }

        // Normale Validierung
        if (!formData.name.trim()) {
            newErrors.name = 'Name ist ein Pflichtfeld';
        }

        if (!formData.nachricht.trim()) {
            newErrors.nachricht = 'Nachricht ist ein Pflichtfeld';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // E-Mail-Adresse hier anpassen
        const emailTo = "t.schroeer@web.de";
        const subject = encodeURIComponent("Kontaktanfrage von " + formData.name);
        const body = encodeURIComponent(
            `Name: ${formData.name}\n` +
            `Telefon: ${formData.telefon || 'Nicht angegeben'}\n\n` +
            `Nachricht:\n${formData.nachricht}`
        );

        const mailtoLink = `mailto:${emailTo}?subject=${subject}&body=${body}`;

        // Öffnet das Standard-E-Mail-Programm
        window.location.href = mailtoLink;
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-4">Kontakt</h1>
                <p className="text-lg text-muted-foreground">
                    Haben Sie Fragen oder möchten Sie uns kontaktieren?
                    Nutzen Sie das folgende Formular.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Kontaktformular
                    </CardTitle>
                    <CardDescription>
                        Füllen Sie die Pflichtfelder (*) aus und klicken Sie auf &quot;Nachricht senden&quot;.
                        Ihr Standard-E-Mail-Programm wird geöffnet.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Bot-Fehler anzeigen */}
                        {errors.bot && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-sm text-red-600 font-medium">{errors.bot}</p>
                            </div>
                        )}

                        {/* Honeypot-Feld - versteckt für Menschen, aber sichtbar für Bots */}
                        <div
                            className="absolute -left-[9999px] opacity-0 pointer-events-none"
                            style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
                            tabIndex={-1}
                        >
                            <Label htmlFor="website">
                                Website (Bitte leer lassen - dieses Feld ist nur für Spam-Schutz)
                            </Label>
                            <Input
                                id="website"
                                name="website"
                                type="text"
                                value={formData.website}
                                onChange={handleInputChange}
                                tabIndex={-1}
                                autoComplete="off"
                                placeholder="Nicht ausfüllen"
                            />
                        </div>

                        {/* Name - Pflichtfeld */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Name *
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Ihr vollständiger Name"
                                className={errors.name ? "border-red-500" : ""}
                                required
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name}</p>
                            )}
                        </div>

                        {/* Telefon - Optional */}
                        <div className="space-y-2">
                            <Label htmlFor="telefon" className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                Telefonnummer
                            </Label>
                            <Input
                                id="telefon"
                                name="telefon"
                                type="tel"
                                value={formData.telefon}
                                onChange={handleInputChange}
                                placeholder="Ihre Telefonnummer (optional)"
                            />
                        </div>

                        {/* Nachricht - Pflichtfeld */}
                        <div className="space-y-2">
                            <Label htmlFor="nachricht">
                                Nachricht *
                            </Label>
                            <Textarea
                                id="nachricht"
                                name="nachricht"
                                value={formData.nachricht}
                                onChange={handleInputChange}
                                placeholder="Ihre Nachricht an uns..."
                                rows={6}
                                className={errors.nachricht ? "border-red-500" : ""}
                                required
                            />
                            {errors.nachricht && (
                                <p className="text-sm text-red-500">{errors.nachricht}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button type="submit" className="w-full" size="lg">
                            <Send className="w-4 h-4 mr-2" />
                            Nachricht senden
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-muted-foreground">
                <p>
                    * Pflichtfelder müssen ausgefüllt werden
                </p>
            </div>
        </div>
    );
}