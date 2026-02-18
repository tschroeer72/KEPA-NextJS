'use client';

import { useState } from "react";
import { useAuthContext } from "@/providers/auth-context-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ProfilPage() {
    const { username, vorname, nachname } = useAuthContext();
    
    const [altesPasswort, setAltesPasswort] = useState("");
    const [neuesPasswort, setNeuesPasswort] = useState("");
    const [neuesPasswortWdh, setNeuesPasswortWdh] = useState("");
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (neuesPasswort !== neuesPasswortWdh) {
            setError("Die neuen Passwörter stimmen nicht überein.");
            return;
        }

        if (altesPasswort === neuesPasswort) {
            setError("Das neue Passwort darf nicht dem alten entsprechen.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post("/api/auth/change-password", {
                altesPasswort,
                neuesPasswort
            });
            setSuccess(response.data.message || "Passwort erfolgreich geändert.");
            setAltesPasswort("");
            setNeuesPasswort("");
            setNeuesPasswortWdh("");
        } catch (err: any) {
            setError(err.response?.data?.error || "Ein Fehler ist aufgetreten.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6">Profil</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Benutzerinformationen */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="bg-blue-500 text-white rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold">
                                {vorname ? vorname.charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : 'U')}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">
                                    {vorname && nachname ? `${vorname} ${nachname}` : (username || 'Benutzer')}
                                </h2>
                                <p className="text-gray-500 dark:text-gray-400">Angemeldet</p>
                            </div>
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-medium mb-4">Benutzerinformationen</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Vorname</label>
                                    <p className="mt-1 text-lg">{vorname || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Nachname</label>
                                    <p className="mt-1 text-lg">{nachname || '-'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">Benutzername</label>
                                    <p className="mt-1 text-lg">{username || '-'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Passwort ändern */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                        <h3 className="text-lg font-medium mb-4">Passwort ändern</h3>
                        
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md flex items-start space-x-2">
                                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}
                        
                        {success && (
                            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md flex items-start space-x-2">
                                <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
                                <span className="text-sm">{success}</span>
                            </div>
                        )}

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="altesPasswort">Altes Passwort</Label>
                                <Input 
                                    id="altesPasswort"
                                    type="password"
                                    value={altesPasswort}
                                    onChange={(e) => setAltesPasswort(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="neuesPasswort">Neues Passwort</Label>
                                <Input 
                                    id="neuesPasswort"
                                    type="password"
                                    value={neuesPasswort}
                                    onChange={(e) => setNeuesPasswort(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="neuesPasswortWdh">Neues Passwort wiederholen</Label>
                                <Input 
                                    id="neuesPasswortWdh"
                                    type="password"
                                    value={neuesPasswortWdh}
                                    onChange={(e) => setNeuesPasswortWdh(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            
                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={loading || !altesPasswort || !neuesPasswort || !neuesPasswortWdh}
                            >
                                {loading ? "Wird geändert..." : "Passwort speichern"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
