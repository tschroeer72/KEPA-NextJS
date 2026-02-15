"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import {Checkbox} from "@/components/ui/checkbox";
import {useState} from "react";

interface MeisterschaftlisteProps {
    lstMeisterschaften: Meisterschaftliste[];
    onMeisterschaftSelect?: (id: number) => void;
}

export default function Meisterschaftliste({ lstMeisterschaften, onMeisterschaftSelect }: MeisterschaftlisteProps) {
    const [selectedId, setSelectedId] = useState<number>(-1);

    const handleRowClick = (meisterschaft: Meisterschaftliste) => {
        setSelectedId(meisterschaft.ID);
        onMeisterschaftSelect?.(meisterschaft.ID);
    };

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return "-";
        return format(new Date(date), "dd.MM.yyyy", { locale: de });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Meisterschaftenliste</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Bezeichnung</TableHead>
                            <TableHead>Beginn</TableHead>
                            <TableHead>Ende</TableHead>
                            <TableHead>Typ</TableHead>
                            <TableHead>Aktiv</TableHead>
                            <TableHead>Bemerkungen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lstMeisterschaften.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                    Keine Meisterschaften vorhanden
                                </TableCell>
                            </TableRow>
                        ) : (
                            lstMeisterschaften.map((meisterschaft) => (
                                <TableRow key={meisterschaft.ID}
                                          className={`cursor-pointer ${selectedId === meisterschaft.ID ? 'bg-muted' : ''}`}
                                          onClick={() => handleRowClick(meisterschaft)}
                                >
                                    <TableCell>{meisterschaft.Bezeichnung}</TableCell>
                                    <TableCell>{formatDate(meisterschaft.Beginn)}</TableCell>
                                    <TableCell>{formatDate(meisterschaft.Ende)}</TableCell>
                                    <TableCell>{meisterschaft.tblMeisterschaftstyp?.Meisterschaftstyp || "-"}</TableCell>
                                    <TableCell>
                                        <Checkbox
                                            checked={meisterschaft.Aktiv === 1}
                                            disabled
                                            className="cursor-default"
                                        />
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate" title={meisterschaft.Bemerkungen || ""}>
                                        {meisterschaft.Bemerkungen || "-"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}