"use client"

import { useTable } from "@/app/context/table-context"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

export default function TableSidebar() {
  const { currentTableId, tables, loading, selectTable, deselectTable } = useTable()
  const [showMobileSheet, setShowMobileSheet] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-800/60"
      case "occupied":
        return "bg-red-100 hover:bg-red-200 opacity-60 cursor-not-allowed dark:bg-red-900/40 dark:hover:bg-red-800/60"
      case "reserved":
        return "bg-amber-100 hover:bg-amber-200 opacity-70 cursor-not-allowed dark:bg-amber-900/40 dark:hover:bg-amber-800/60"
      default:
        return "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800/40 dark:hover:bg-gray-700/60"
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500 hover:bg-emerald-600"
      case "occupied":
        return "bg-red-500 hover:bg-red-600"
      case "reserved":
        return "bg-amber-500 hover:bg-amber-600"
      default:
        return "bg-gray-500 hover:bg-gray-600"
    }
  }

  const TableGrid = () => (
    <div className="grid grid-cols-4 gap-1.5">
      {tables.map((table) => (
        <button
          key={table.id}
          onClick={() => {
            if (table.status === "available") {
              if (currentTableId === table.id) {
                deselectTable()
              } else {
                selectTable(table.id)
              }
            }
            setShowMobileSheet(false)
          }}
          disabled={table.status !== "available"}
          className={`h-12 flex flex-col items-center justify-center rounded-lg border-2 border-transparent transition-all duration-200 font-semibold text-sm ${getStatusColor(
            table.status
          )} ${
            table.status === "available" ? "hover:scale-105" : ""
          } ${
            currentTableId === table.id
              ? "border-blue-500 ring-2 ring-blue-400 shadow-md"
              : ""
          }`}
        >
          <span className="text-base font-bold leading-tight">T{table.table_number}</span>
          <Badge
            className={`mt-0.5 text-xs px-1.5 py-0 h-auto leading-tight ${getStatusBadgeColor(
              table.status
            )} text-white`}
          >
            {table.status.charAt(0).toUpperCase()}
          </Badge>
        </button>
      ))}
    </div>
  )

  if (loading && tables.length === 0) {
    return (
      <>
        {/* Desktop */}
        <div className="hidden md:block border-gray-200 dark:border-gray-700 px-3 py-2">
          <h3 className="font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400 mb-2">Tables</h3>
          <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
            Loading tables...
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden px-3">
          <Button
            onClick={() => setShowMobileSheet(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {currentTableId ? `📍 Table ${tables.find((t) => t.id === currentTableId)?.table_number}` : "📍 Select Table"}
          </Button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:block border-gray-200 dark:border-gray-700">
        <h3 className="px-3 py-2 font-semibold text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">Tables</h3>
        {tables.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-xs text-muted-foreground px-3">
            No tables available
          </div>
        ) : (
          <>
            <div className="overflow-y-auto max-h-56 px-2.5 py-2">
              <TableGrid />
            </div>
            {currentTableId && tables.length > 0 && (
              <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30">
                ✓ Table {tables.find((t) => t.id === currentTableId)?.table_number} selected
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Version - Button + Sheet */}
      <div className="md:hidden px-3">
        <Button
          onClick={() => setShowMobileSheet(true)}
          className={`w-full ${
            currentTableId
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          } text-white`}
        >
          {currentTableId
            ? `✓ Table ${tables.find((t) => t.id === currentTableId)?.table_number} Selected`
            : "📍 Select Table"}
        </Button>
      </div>

      {/* Mobile Sheet Modal */}
      <Sheet open={showMobileSheet} onOpenChange={setShowMobileSheet}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-lg">
          <SheetHeader className="mb-4">
            <SheetTitle>Select a Table</SheetTitle>
          </SheetHeader>
          {tables.length === 0 ? (
            <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">
              No tables available
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-4 gap-2 pb-4">
                {tables.map((table) => (
                  <button
                    key={table.id}
                    onClick={() => {
                      if (table.status === "available") {
                        if (currentTableId === table.id) {
                          deselectTable()
                        } else {
                          selectTable(table.id)
                        }
                      }
                      setShowMobileSheet(false)
                    }}
                    disabled={table.status !== "available"}
                    className={`h-16 flex flex-col items-center justify-center rounded-lg border-2 border-transparent transition-all duration-200 font-semibold text-sm ${getStatusColor(
                      table.status
                    )} ${
                      table.status === "available" ? "hover:scale-105" : ""
                    } ${
                      currentTableId === table.id
                        ? "border-blue-500 ring-2 ring-blue-400 shadow-md"
                        : ""
                    }`}
                  >
                    <span className="text-lg font-bold leading-tight">T{table.table_number}</span>
                    <Badge
                      className={`mt-1 text-xs px-1.5 py-0 h-auto leading-tight ${getStatusBadgeColor(
                        table.status
                      )} text-white`}
                    >
                      {table.status.charAt(0).toUpperCase()}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
