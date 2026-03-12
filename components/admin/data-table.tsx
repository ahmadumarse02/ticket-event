"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  header: string
  cell: (item: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchPlaceholder?: string
  searchKey?: keyof T
  pageSize?: number
  emptyMessage?: string
  onRowClick?: (item: T) => void
  isLoading?: boolean
}

export function DataTable<T extends { _id?: string }>({
  columns,
  data,
  searchPlaceholder = "Search...",
  searchKey,
  pageSize: initialPageSize = 10,
  emptyMessage = "No data found.",
  onRowClick,
  isLoading,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Filter
  let filteredData = [...data]
  if (search && searchKey) {
    filteredData = filteredData.filter((item) => {
      const value = item[searchKey]
      return typeof value === "string"
        ? value.toLowerCase().includes(search.toLowerCase())
        : false
    })
  }

  // Sort
  if (sortKey) {
    filteredData.sort((a, b) => {
      const aVal = (a as any)[sortKey]
      const bVal = (b as any)[sortKey]
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }

  // Paginate
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card">
        <div className="space-y-2 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">

      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        {searchKey ? (
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              className="h-8 pl-9 text-sm bg-secondary/60 border-border-strong focus-visible:ring-1 focus-visible:ring-primary/40 placeholder:text-muted-foreground/60"
            />
          </div>
        ) : <div />}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1) }}
          >
            <SelectTrigger className="h-8 w-16 border-border-strong bg-secondary/60 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["5", "10", "20", "50"].map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>rows</span>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={cn(
                  "text-xs font-semibold tracking-wider uppercase text-muted-foreground/70 py-3",
                  column.sortable && "cursor-pointer select-none hover:text-foreground transition-colors",
                  column.className
                )}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center gap-1.5">
                  {column.header}
                  {column.sortable && (
                    <ArrowUpDown className={cn(
                      "h-3 w-3 transition-colors",
                      sortKey === column.key ? "text-primary" : "text-muted-foreground/40"
                    )} />
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-32 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((item, index) => (
              <TableRow
                key={item._id || index}
                className={cn(
                  "border-border transition-colors",
                  onRowClick && "cursor-pointer hover:bg-white/[0.025]",
                  !onRowClick && "hover:bg-white/[0.015]"
                )}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={cn("py-3 text-sm", column.className)}>
                    {column.cell(item)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{startIndex + 1}–{Math.min(startIndex + pageSize, filteredData.length)}</span>
            {" "}of{" "}
            <span className="font-medium text-foreground">{filteredData.length}</span>
            {" "}results
          </p>
          <div className="flex items-center gap-0.5">
            {[
              { icon: ChevronsLeft,  onClick: () => setCurrentPage(1),              disabled: currentPage === 1 },
              { icon: ChevronLeft,   onClick: () => setCurrentPage(currentPage - 1), disabled: currentPage === 1 },
              { icon: ChevronRight,  onClick: () => setCurrentPage(currentPage + 1), disabled: currentPage === totalPages },
              { icon: ChevronsRight, onClick: () => setCurrentPage(totalPages),      disabled: currentPage === totalPages },
            ].map(({ icon: Ico, onClick, disabled }, i) => (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                onClick={onClick}
                disabled={disabled}
                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-30"
              >
                <Ico className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
