'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useAuthContext } from "@/providers/auth-context-provider";

export default function Login() {
    const [benutzer, setBenutzer] = useState("");
    const [passwort, setPasswort] = useState("");
    const [error, setError] = useState(false);
    const router = useRouter();
    const {setIsLogin, setUserId, setUsername, setVorname, setNachname, setIsAdmin} = useAuthContext();

    const login = async () => {
        try {
            const response = await axios.post("/api/login", {
                benutzer,
                passwort
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            //console.log("Login erfolgreich", response);

            // Warten bis die Response vollständig verarbeitet wurde
            await new Promise(resolve => setTimeout(resolve, 200));

            setIsLogin(true);
            if (response.data) {
                if (response.data.userId !== undefined) setUserId(response.data.userId);
                if (response.data.username) setUsername(response.data.username);
                if (response.data.vorname) setVorname(response.data.vorname);
                if (response.data.nachname) setNachname(response.data.nachname);
                setIsAdmin(!!response.data.isAdmin);
            } else {
                setUsername(benutzer);
            }
            router.push("/verwaltung");
        } catch (error) {
            console.log("Login Error", error)
            setError(true)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <div>
                    <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                        Login
                    </h1>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
                        Login fehlgeschlagen
                    </div>
                )}

                <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); login(); }}>
                    <div className="space-y-2">
                        <Label htmlFor="benutzer">Benutzername</Label>
                        <Input
                            id="benutzer"
                            type="text"
                            placeholder="Benutzername eingeben"
                            value={benutzer}
                            onChange={(e) => setBenutzer(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="passwort">Passwort</Label>
                        <Input
                            id="passwort"
                            type="password"
                            placeholder="Passwort eingeben"
                            value={passwort}
                            onChange={(e) => setPasswort(e.target.value)}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={!benutzer || !passwort}
                    >
                        Anmelden
                    </Button>
                </form>
            </div>
        </div>
    )
}