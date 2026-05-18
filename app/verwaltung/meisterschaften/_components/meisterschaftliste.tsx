"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatLocalDate } from "@/lib/date-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useMemo, useState } from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    useReactTable,
    SortingState,
    ColumnFiltersState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MeisterschaftlisteProps {
    lstMeisterschaften: Meisterschaftliste[];
    onMeisterschaftSelect?: (id: number) => void;
}

export default function Meisterschaftliste({ lstMeisterschaften, onMeisterschaftSelect }: MeisterschaftlisteProps) {
    const [selectedId, setSelectedId] = useState<number>(-1);
    const [sorting, setSorting] = useState<SortingState>([{ id: 'Bezeichnung', desc: false }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

    const handleRowClick = (id: number) => {
        setSelectedId(id);
        onMeisterschaftSelect?.(id);
    };

    const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return "-";
        return formatLocalDate(date);
    };

    const columns = useMemo<ColumnDef<Meisterschaftliste>[]>(() => [
        {
            accessorKey: "Bezeichnung",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 h-8"
                    >
                        Bezeichnung
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => row.getValue("Bezeichnung"),
        },
        {
            accessorKey: "Beginn",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 h-8"
                    >
                        Beginn
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => formatDate(row.getValue("Beginn")),
            sortingFn: "datetime",
        },
        {
            accessorKey: "Ende",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 h-8"
                    >
                        Ende
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                )
            },
            cell: ({ row }) => formatDate(row.getValue("Ende")),
            sortingFn: "datetime",
        },
        {
            id: "Typ",
            accessorFn: (row) => row.tblMeisterschaftstyp?.Meisterschaftstyp || "-",
            header: "Typ",
        },
        {
            accessorKey: "Aktiv",
            header: "Aktiv",
            cell: ({ row }) => (
                <Checkbox
                    checked={row.getValue("Aktiv") === 1}
                    disabled
                    className="cursor-default"
                />
            ),
        },
        {
            accessorKey: "Bemerkungen",
            header: "Bemerkungen",
            cell: ({ row }) => (
                <div className="max-w-xs truncate" title={row.getValue("Bemerkungen") || ""}>
                    {row.getValue("Bemerkungen") || "-"}
                </div>
            ),
        },
    ], []);

    const table = useReactTable({
        data: lstMeisterschaften,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle>Meisterschaftenliste</CardTitle>
                <div className="flex items-center relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Bezeichnung filtern..."
                        value={(table.getColumn("Bezeichnung")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("Bezeichnung")?.setFilterValue(event.target.value)
                        }
                        className="pl-8 pr-8 h-9"
                    />
                    {(table.getColumn("Bezeichnung")?.getFilterValue() as string) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1.5 h-6 w-6"
                            onClick={() => table.getColumn("Bezeichnung")?.setFilterValue("")}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className={`cursor-pointer ${selectedId === row.original.ID ? 'bg-muted' : ''}`}
                                        onClick={() => handleRowClick(row.original.ID)}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                                        Keine Meisterschaften vorhanden
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}