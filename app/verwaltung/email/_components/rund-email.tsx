"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Send } from "lucide-react";
import { getMembersForEmail } from "@/app/actions/db/mitglieder/actions";

interface Member {
  ID: number;
  Vorname: string;
  Nachname: string;
  EMail: string | null;
  PassivSeit: string | null;
}

export function RundEmail() {
  const [members, setMembers] = useState<Member[]>([]);
  const [manualMembers, setManualMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [selectionType, setSelectionType] = useState<string>("all");
  const [additionalEmail, setAdditionalEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<{ name: string; content: string; contentType: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingMembers, setFetchingMembers] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    filterMembers();
  }, [selectionType, members, manualMembers]);

  const fetchMembers = async () => {
    setFetchingMembers(true);
    try {
      const result = await getMembersForEmail();
      if (result.success && result.data) {
        const memberData = (result.data as any[]).map(m => ({
          ID: m.ID,
          Vorname: m.Vorname,
          Nachname: m.Nachname,
          EMail: m.EMail,
          PassivSeit: m.PassivSeit ? m.PassivSeit.toISOString() : null
        }));
        setMembers(memberData);
      } else {
        toast.error(result.error || "Fehler beim Laden der Mitglieder");
      }
    } catch (error) {
      toast.error("Netzwerkfehler beim Laden der Mitglieder");
    } finally {
      setFetchingMembers(false);
    }
  };

  const filterMembers = () => {
    let filtered = [...members];
    if (selectionType === "active") {
      filtered = members.filter((m) => !m.PassivSeit);
    }
    
    // Add manual members to the filtered list
    const combined = [...filtered, ...manualMembers];
    setFilteredMembers(combined);
    
    // Auto-select filtered members that have an email
    // Preserve manually added emails that are already in selectedEmails
    const filteredEmails = combined
      .map(m => m.EMail?.trim())
      .filter((email): email is string => !!email && email.includes("@"));
    
    setSelectedEmails(filteredEmails);
  };

  const handleToggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const handleAddEmail = () => {
    if (additionalEmail && !selectedEmails.includes(additionalEmail)) {
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(additionalEmail)) {
        const newManualMember: Member = {
          ID: -Date.now(), // Unique negative ID
          Vorname: "",
          Nachname: "",
          EMail: additionalEmail,
          PassivSeit: null
        };
        setManualMembers(prev => [...prev, newManualMember]);
        setSelectedEmails((prev) => [...prev, additionalEmail]);
        setAdditionalEmail("");
      } else {
        toast.error("Ungültige E-Mail-Adresse");
      }
    }
  };

  const handleRemoveSelectedEmails = () => {
    // This is more like "unselect all" in this context, but for manual ones we remove them
    setSelectedEmails([]);
    setManualMembers([]);
  };

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach((file) => {
      if (file.size > MAX_SIZE) {
        toast.error(`Datei "${file.name}" ist zu groß (max. 5MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        // base64 content
        const base64Content = content.split(",")[1];
        
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            content: base64Content,
            contentType: file.type,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    e.target.value = "";
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAttachments = () => {
    setAttachments([]);
  };

  const handleSendMail = async () => {
    if (selectedEmails.length === 0) {
      toast.error("Keine Empfänger ausgewählt");
      return;
    }
    if (!subject) {
      toast.error("Bitte Betreff eingeben");
      return;
    }
    if (!message) {
      toast.error("Bitte Nachricht eingeben");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: selectedEmails,
          subject,
          message,
          attachments,
        }),
      });

      if (response.ok) {
        toast.success("E-Mail erfolgreich versendet");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Fehler beim Versand");
      }
    } catch (error) {
      toast.error("Netzwerkfehler beim E-Mail-Versand");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Titel Bereich */}
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold">Rund-Email</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Spalte 0: Empfängerauswahl */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold border-b pb-2">Empfängerauswahl</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-3">
              <Label>Auswahlgruppe</Label>
              <RadioGroup
                value={selectionType}
                onValueChange={setSelectionType}
                className="flex flex-row gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="all" />
                  <Label htmlFor="all">Alle Mitglieder</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="active" id="active" />
                  <Label htmlFor="active">Nur aktive</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="border rounded-md p-2 bg-slate-50 dark:bg-slate-900">
              <div className="max-h-[250px] overflow-y-auto space-y-1">
                {fetchingMembers ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <div key={member.ID} className="flex items-center space-x-2 text-sm p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded">
                      <Checkbox
                        id={`member-${member.ID}`}
                        checked={!!member.EMail && selectedEmails.includes(member.EMail)}
                        onCheckedChange={() => member.EMail && handleToggleEmail(member.EMail)}
                      />
                      <Label
                        htmlFor={`member-${member.ID}`}
                        className="flex flex-1 justify-between gap-2 cursor-pointer"
                      >
                        <span className="truncate">{member.Vorname} {member.Nachname}</span>
                        <span className="truncate opacity-70">{member.EMail}</span>
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-center p-4 text-muted-foreground">Keine Mitglieder gefunden</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="extra-email">Weiterer Empfänger</Label>
              <div className="flex gap-2">
                <Input
                  id="extra-email"
                  placeholder="name@beispiel.de"
                  value={additionalEmail}
                  onChange={(e) => setAdditionalEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between mt-2">
              <Button variant="destructive" size="sm" onClick={handleRemoveSelectedEmails}>
                <Trash2 className="size-4 mr-2" />
                Löschen
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddEmail}>
                <Plus className="size-4 mr-2" />
                Hinzufügen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Spalte 1: Anhänge */}
        <Card className="shadow-md relative">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold border-b pb-2">Anhänge</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="border rounded-md p-2 bg-slate-50 dark:bg-slate-900">
              <div className="min-h-[200px] max-h-[250px] overflow-y-auto">
                {attachments.length > 0 ? (
                  <ul className="space-y-1">
                    {attachments.map((file, idx) => (
                      <li key={idx} className="text-sm p-2 bg-background border rounded flex justify-between items-center">
                        <span className="truncate">{file.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-destructive"
                          onClick={() => handleRemoveAttachment(idx)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-center p-4 text-muted-foreground mt-8">Keine Anhänge</p>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-auto">
              <Button variant="destructive" size="sm" onClick={handleRemoveAttachments}>
                <Trash2 className="size-4 mr-2" />
                Löschen
              </Button>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer flex items-center">
                  <Plus className="size-4 mr-2" />
                  Hinzufügen
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleAddAttachment}
                  />
                </label>
              </Button>
            </div>

            {loading && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10 rounded-xl">
                <Loader2 className="size-12 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spalte 2: Nachricht */}
        <Card className="shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold border-b pb-2">Nachricht</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Betreff</Label>
              <Input
                id="subject"
                placeholder="Betreff"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Nachricht</Label>
              <Textarea
                id="message"
                placeholder="Ihre Nachricht..."
                className="min-h-[300px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <Button className="w-full mt-2" onClick={handleSendMail} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Versenden
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
