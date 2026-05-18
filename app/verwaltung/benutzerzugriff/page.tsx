'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from "@/providers/auth-context-provider";
import { useRouter } from "next/navigation";
import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, UserMinus, UserCheck, Loader2, ArrowUpDown, Search } from 'lucide-react';
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Mitglied {
    ID: number;
    Vorname: string;
    Nachname: string;
    Login: string | null;
    Password: string | null;
}

export default function BenutzerzugriffPage() {
    const { isAdmin, isLogin } = useAuthContext();
    const router = useRouter();
    const [mitglieder, setMitglieder] = useState<Mitglied[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValues, setEditValues] = useState<{ login: string, passwort: string }>({ login: '', passwort: '' });
    const [deactivateId, setDeactivateId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState({ vorname: '', nachname: '', login: '' });
    const [sortConfig, setSortConfig] = useState<{ key: keyof Mitglied; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        if (!isLogin) {
            router.push('/');
            return;
        }
        if (!isAdmin) {
            router.push('/verwaltung');
            return;
        }
        fetchMitglieder();
    }, [isAdmin, isLogin, router]);

    const fetchMitglieder = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/verwaltung/benutzerzugriff');
            setMitglieder(response.data);
        } catch (error) {
            console.error('Fehler beim Laden der Mitglieder:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (m: Mitglied) => {
        setEditingId(m.ID);
        setEditValues({
            login: m.Login || '',
            passwort: m.Password || ''
        });
    };

    const handleSave = async (id: number) => {
        try {
            await axios.post('/api/verwaltung/benutzerzugriff', {
                id,
                login: editValues.login,
                passwort: editValues.passwort,
                action: 'speichern'
            });
            setEditingId(null);
            fetchMitglieder();
            toast.success('Änderungen erfolgreich gespeichert');
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            toast.error('Speichern fehlgeschlagen');
        }
    };

    const handleDeaktivieren = async (id: number) => {
        try {
            await axios.post('/api/verwaltung/benutzerzugriff', {
                id,
                action: 'deaktivieren'
            });
            fetchMitglieder();
            toast.success('Benutzerzugriff deaktiviert');
        } catch (error) {
            console.error('Fehler beim Deaktivieren:', error);
            toast.error('Deaktivierung fehlgeschlagen');
        } finally {
            setDeactivateId(null);
        }
    };

    const handleAktivieren = (m: Mitglied) => {
        handleEdit(m);
    };

    const requestSort = (key: keyof Mitglied) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredAndSortedMitglieder = [...mitglieder]
        .filter((m) => {
            const matchVorname = m.Vorname.toLowerCase().includes(searchTerm.vorname.toLowerCase());
            const matchNachname = m.Nachname.toLowerCase().includes(searchTerm.nachname.toLowerCase());
            const matchLogin = (m.Login || '').toLowerCase().includes(searchTerm.login.toLowerCase());
            return matchVorname && matchNachname && matchLogin;
        })
        .sort((a, b) => {
            if (!sortConfig) return 0;
            const { key, direction } = sortConfig;
            
            const aValue = a[key] || '';
            const bValue = b[key] || '';
            
            if (aValue < bValue) {
                return direction === 'asc' ? -1 : 1;
            }
            if (aValue > bValue) {
                return direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

    if (loading && mitglieder.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Benutzerzugriff Verwaltung</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Nachname filtern..."
                        className="pl-9"
                        value={searchTerm.nachname}
                        onChange={(e) => setSearchTerm({ ...searchTerm, nachname: e.target.value })}
                    />
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Vorname filtern..."
                        className="pl-9"
                        value={searchTerm.vorname}
                        onChange={(e) => setSearchTerm({ ...searchTerm, vorname: e.target.value })}
                    />
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                        placeholder="Login filtern..."
                        className="pl-9"
                        value={searchTerm.login}
                        onChange={(e) => setSearchTerm({ ...searchTerm, login: e.target.value })}
                    />
                </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => requestSort('Nachname')}>
                                <div className="flex items-center">
                                    Nachname <ArrowUpDown size={14} className="ml-1" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => requestSort('Vorname')}>
                                <div className="flex items-center">
                                    Vorname <ArrowUpDown size={14} className="ml-1" />
                                </div>
                            </TableHead>
                            <TableHead className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" onClick={() => requestSort('Login')}>
                                <div className="flex items-center">
                                    Login <ArrowUpDown size={14} className="ml-1" />
                                </div>
                            </TableHead>
                            <TableHead>Passwort</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAndSortedMitglieder.map((m) => (
                            <TableRow key={m.ID}>
                                <TableCell className="font-medium">{m.Nachname}</TableCell>
                                <TableCell>{m.Vorname}</TableCell>
                                <TableCell>
                                    {editingId === m.ID ? (
                                        <Input 
                                            value={editValues.login} 
                                            onChange={(e) => setEditValues({ ...editValues, login: e.target.value })}
                                            placeholder="Login"
                                            className="w-32"
                                        />
                                    ) : (
                                        m.Login || <span className="text-gray-400 italic">kein Zugriff</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {editingId === m.ID ? (
                                        <Input 
                                            type="password"
                                            value={editValues.passwort} 
                                            onChange={(e) => setEditValues({ ...editValues, passwort: e.target.value })}
                                            placeholder="Neues Passwort"
                                            className="w-32"
                                        />
                                    ) : (
                                        m.Password || ''
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end space-x-2">
                                        {editingId === m.ID ? (
                                            <>
                                                <Button size="sm" onClick={() => handleSave(m.ID)}>
                                                    <Save size={16} className="mr-1" /> Speichern
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                                                    Abbrechen
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                {m.Login ? (
                                                    <>
                                                        <Button size="sm" variant="outline" onClick={() => handleEdit(m)}>
                                                            Editieren
                                                        </Button>
                                                        <Button size="sm" variant="destructive" onClick={() => setDeactivateId(m.ID)}>
                                                            <UserMinus size={16} className="mr-1" /> Deaktivieren
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Button size="sm" variant="default" onClick={() => handleAktivieren(m)} className="bg-green-600 hover:bg-green-700">
                                                        <UserCheck size={16} className="mr-1" /> Aktivieren
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={deactivateId !== null} onOpenChange={(open) => !open && setDeactivateId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Möchten Sie den Benutzerzugriff für dieses Mitglied wirklich deaktivieren? Login und Passwort werden gelöscht.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => deactivateId && handleDeaktivieren(deactivateId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Deaktivieren
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
