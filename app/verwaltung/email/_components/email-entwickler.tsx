"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { getMembersForEmail } from "@/app/actions/verwaltung/email/actions";

interface Member {
    ID: number;
    Vorname: string;
    Nachname: string;
    EMail: string | null;
}

export function EmailEntwickler() {
    const [grund, setGrund] = useState("Fehler");
    const [betreff, setBetreff] = useState("");
    const [nachricht, setNachricht] = useState("");
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    const [fetchingMembers, setFetchingMembers] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            setFetchingMembers(true);
            try {
                const result = await getMembersForEmail();
                if (result.success && result.data) {
                    // Result is already filtered by server action, but we can be extra safe
                    const memberData = (result.data as any[])
                        .map(m => ({
                            ID: m.ID,
                            Vorname: m.Vorname,
                            Nachname: m.Nachname,
                            EMail: m.EMail?.trim()
                        }))
                        .filter(m => m.EMail && m.EMail.includes("@"));
                    
                    setMembers(memberData);
                } else {
                    toast.error(result.error || "Fehler beim Laden der CC-Empfänger");
                }
            } catch (error) {
                toast.error("Netzwerkfehler beim Laden der CC-Empfänger");
            } finally {
                setFetchingMembers(false);
            }
        };
        fetchMembers();
    }, []);

    const handleSendMail = async () => {
        if (!betreff.trim() || !nachricht.trim()) {
            toast.error("Betreff und Nachricht müssen gefüllt sein!");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("/api/email/send-error", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    to: ["t.schroeer@web.de"],
                    cc: selectedEmails,
                    subject: betreff,
                    message: nachricht,
                    type: grund,
                }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Mail wurde versendet");
                setBetreff("");
                setNachricht("");
            } else {
                toast.error(result.error || "Fehler beim Versenden der E-Mail");
            }
        } catch (error) {
            toast.error("Netzwerkfehler beim Versenden der E-Mail");
        } finally {
            setLoading(false);
        }
    };

    const toggleEmail = (email: string) => {
        setSelectedEmails(prev =>
            prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]
        );
    };

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex items-center">
                <h1 className="text-2xl font-bold border-b-2 border-primary pb-1">E-Mail an Entwickler</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
                {/* Linke Seite: Versandgrund und CC-Empfänger */}
                <div className="flex flex-col gap-6">
                    <Card className="shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-medium text-primary">Versandgrund und CC-Empfänger</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="space-y-2 border rounded-md p-4">
                                <Label className="text-sm font-semibold">Grund der E-Mail</Label>
                                <RadioGroup value={grund} onValueChange={setGrund} className="flex gap-4 pt-2">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Fehler" id="fehler" />
                                        <Label htmlFor="fehler" className="cursor-pointer">Fehler</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Info" id="info" />
                                        <Label htmlFor="info" className="cursor-pointer">Info</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Wunsch" id="wunsch" />
                                        <Label htmlFor="wunsch" className="cursor-pointer">Wunsch</Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-sm font-semibold">CC-Empfänger</Label>
                                <div className="border border-primary rounded-md overflow-hidden">
                                    <div className="h-[250px] w-full p-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted">
                                        {fetchingMembers ? (
                                            <div className="flex justify-center p-4">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                {members.map((member) => (
                                                    <div key={member.ID} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-sm transition-colors cursor-pointer" onClick={() => toggleEmail(member.EMail!)}>
                                                        <Checkbox 
                                                            id={`member-${member.ID}`} 
                                                            checked={selectedEmails.includes(member.EMail!)}
                                                            onCheckedChange={() => toggleEmail(member.EMail!)}
                                                        />
                                                        <div className="flex justify-between w-full text-xs">
                                                            <span className="font-medium">{member.Vorname} {member.Nachname}</span>
                                                            <span className="text-muted-foreground">{member.EMail}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Rechte Seite: Nachricht */}
                <div className="flex flex-col gap-6 relative">
                    <Card className="shadow-md h-full">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg font-medium text-primary">Nachricht</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="betreff">Betreff</Label>
                                <Input 
                                    id="betreff" 
                                    placeholder="Betreff" 
                                    value={betreff} 
                                    onChange={(e) => setBetreff(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2 flex-grow">
                                <Label htmlFor="nachricht">Nachricht</Label>
                                <Textarea 
                                    id="nachricht" 
                                    placeholder="Nachricht" 
                                    className="min-h-[400px] resize-none"
                                    value={nachricht}
                                    onChange={(e) => setNachricht(e.target.value)}
                                />
                            </div>

                            <Button 
                                className="w-full mt-2" 
                                onClick={handleSendMail} 
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Versenden
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Progress Overlay ähnlich wie ProgressRing im WPF Grid */}
                    {loading && (
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50 rounded-lg">
                            <div className="flex flex-col items-center gap-2">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <span className="font-medium">Wird versendet...</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
