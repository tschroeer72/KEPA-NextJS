"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  filterPlaceholder?: string
  alternateRowsBy?: keyof TData
  showColumnFilters?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filterPlaceholder = "Filtern...",
  alternateRowsBy,
  showColumnFilters = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
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
  })

  return (
    <div className="space-y-4">
      {!showColumnFilters && filterColumn && (
        <div className="flex items-center relative max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={filterPlaceholder}
            value={(table.getColumn(filterColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(filterColumn)?.setFilterValue(event.target.value)
            }
            className="pl-8 pr-8 h-9"
          />
          {(table.getColumn(filterColumn)?.getFilterValue() as string) && (
             <Button
                variant="ghost"
                size="icon-xs"
                className="absolute right-1 top-1.5 h-6 w-6"
                onClick={() => table.getColumn(filterColumn)?.setFilterValue("")}
             >
                <X className="h-3 w-3" />
             </Button>
          )}
        </div>
      )}
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <React.Fragment key={headerGroup.id}>
                <TableRow>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn(
                              header.column.getCanSort()
                                ? "flex items-center gap-2 cursor-pointer select-none hover:text-foreground transition-colors"
                                : ""
                            )}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {header.column.getCanSort() && (
                              <ArrowUpDown className={cn(
                                  "h-4 w-4 shrink-0 transition-colors",
                                  header.column.getIsSorted() ? "text-primary" : "text-muted-foreground/50"
                              )} />
                            )}
                          </div>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
                {showColumnFilters && (
                  <TableRow className="bg-muted/30 border-b">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={`${header.id}-filter`} className="py-1 px-2 h-auto">
                          {header.column.getCanFilter() ? (
                            <div className="relative">
                              <Input
                                placeholder={`${flexRender(header.column.columnDef.header, header.getContext())} filtern...`}
                                value={(header.column.getFilterValue() as string) ?? ""}
                                onChange={(event) =>
                                  header.column.setFilterValue(event.target.value)
                                }
                                className="h-7 text-xs px-2 pr-6 bg-background/50"
                              />
                              {(header.column.getFilterValue() as string) && (
                                <Button
                                  variant="ghost"
                                  size="icon-xs"
                                  className="absolute right-0.5 top-0.5 h-6 w-6"
                                  onClick={() => header.column.setFilterValue("")}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ) : null}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              (() => {
                let lastGroupValue: any = null
                let isOdd = false
                
                return table.getRowModel().rows.map((row) => {
                  if (alternateRowsBy) {
                    const currentGroupValue = row.original[alternateRowsBy]
                    if (currentGroupValue !== lastGroupValue) {
                      isOdd = !isOdd
                      lastGroupValue = currentGroupValue
                    }
                  } else {
                    isOdd = !row.getIsSelected() // Placeholder for standard zebra stripping if needed, but we use index-based usually
                  }

                  return (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className={alternateRowsBy ? (isOdd ? "bg-muted/50" : "") : ""}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })
              })()
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Keine Ergebnisse.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
