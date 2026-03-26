"use client"

import { useTable } from "@/app/context/table-context"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import ReserveTableModal from "./reserve-table-modal"
import ReservationDetailsModal from "./reservation-details-modal"
import { Clock, X } from "lucide-react"

export default function TableSidebar() {
  const { currentTableId, tables, loading, selectTable, deselectTable, unreserveTable } = useTable()
  const [showMobileSheet, setShowMobileSheet] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ tableId: number; x: number; y: number } | null>(null)
  const [reserveModalOpen, setReserveModalOpen] = useState(false)
  const [selectedTableForReserve, setSelectedTableForReserve] = useState<{ id: number; name: string } | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedTableForDetails, setSelectedTableForDetails] = useState<number | null>(null)
  const [countdowns, setCountdowns] = useState<Record<number, string>>({})

  // Update countdown timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const newCountdowns: Record<number, string> = {}
      tables.forEach((table) => {
        if (table.status === "reserved" && table.reserved_to) {
          const now = new Date()
          const endTime = new Date(table.reserved_to)
          const diffMs = endTime.getTime() - now.getTime()

          if (diffMs > 0) {
            const hours = Math.floor(diffMs / (1000 * 60 * 60))
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
            newCountdowns[table.id] = `${hours}h ${minutes}m`
          }
        }
      })
      setCountdowns(newCountdowns)
    }, 1000)

    return () => clearInterval(interval)
  }, [tables])

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

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
        <div key={table.id} className="relative">
          <button
            onClick={() => {
              if (table.status === "available") {
                if (currentTableId === table.id) {
                  deselectTable()
                } else {
                  selectTable(table.id)
                }
              } else if (table.status === "reserved") {
                setSelectedTableForDetails(table.id)
                setDetailsModalOpen(true)
              }
              setShowMobileSheet(false)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              setContextMenu({ tableId: table.id, x: e.clientX, y: e.clientY })
            }}
            disabled={table.status === "occupied"}
            className={`h-12 flex flex-col items-center justify-center rounded-lg border-2 border-transparent transition-all duration-200 font-semibold text-sm relative ${getStatusColor(
              table.status
            )} ${
              table.status === "available" ? "hover:scale-105" : ""
            } ${
              currentTableId === table.id
                ? "border-blue-500 ring-2 ring-blue-400 shadow-md"
                : ""
            }`}
            title={
              table.status === "reserved"
                ? `Reserved${table.reserved_for_customer_name ? ` by ${table.reserved_for_customer_name}` : ""}`
                : undefined
            }
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

          {/* Reservation Info Overlay */}
          {table.status === "reserved" && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                {table.reserved_for_customer_name && (
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-100 bg-white/80 dark:bg-gray-900/80 px-1 rounded line-clamp-1">
                    {table.reserved_for_customer_name.substring(0, 8)}
                  </div>
                )}
                {countdowns[table.id] && (
                  <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-0.5 justify-center">
                    <Clock size={10} />
                    {countdowns[table.id]}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Context Menu (Desktop) */}
          {contextMenu?.tableId === table.id && (
            <div
              className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-max"
              style={{
                position: "fixed",
                top: `${contextMenu.y}px`,
                left: `${contextMenu.x}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {table.status === "available" && (
                <>
                  <button
                    onClick={() => {
                      selectTable(table.id)
                      setContextMenu(null)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700"
                  >
                    Select Table
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTableForReserve({ id: table.id, name: `T${table.table_number}` })
                      setReserveModalOpen(true)
                      setContextMenu(null)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-amber-50 dark:hover:bg-amber-900/30 text-gray-700 dark:text-gray-200"
                  >
                    Reserve Table
                  </button>
                </>
              )}

              {table.status === "reserved" && (
                <>
                  <button
                    onClick={() => {
                      setSelectedTableForDetails(table.id)
                      setDetailsModalOpen(true)
                      setContextMenu(null)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-b border-gray-200 dark:border-gray-700"
                  >
                    View Details
                  </button>
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Reserved{table.reserved_for_customer_name ? ` by ${table.reserved_for_customer_name}` : ""}
                    </div>
                    {table.reserved_for_customer_phone && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">{table.reserved_for_customer_phone}</div>
                    )}
                    {countdowns[table.id] && (
                      <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                        Time left: {countdowns[table.id]}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      unreserveTable(table.id)
                      setContextMenu(null)
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                  >
                    Cancel Reservation
                  </button>
                </>
              )}

              {table.status === "occupied" && (
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Table is currently occupied
                </div>
              )}
            </div>
          )}
        </div>
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
        <div className="md:hidden">
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
            <div className="px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Right-click table for options
            </div>
          </>
        )}
      </div>

      {/* Mobile Version - Button + Sheet */}
      <div className="md:hidden px-3">
        <Button
          onClick={() => setShowMobileSheet(true)}
          disabled={loading}
          className={`w-full transition-all ${
            currentTableId
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          } text-white`}
        >
          {loading ? "📍 Loading tables..." : currentTableId
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
                  <div key={table.id} className="relative">
                    <button
                      onClick={() => {
                        if (table.status === "available") {
                          if (currentTableId === table.id) {
                            deselectTable()
                          } else {
                            selectTable(table.id)
                          }
                        } else if (table.status === "reserved") {
                          setSelectedTableForDetails(table.id)
                          setDetailsModalOpen(true)
                        }
                        setShowMobileSheet(false)
                      }}
                      onLongPress={(e: any) => {
                        // Long press for mobile context menu
                        setSelectedTableForReserve({ id: table.id, name: `T${table.table_number}` })
                        setReserveModalOpen(true)
                      }}
                      disabled={table.status === "occupied"}
                      className={`h-16 flex flex-col items-center justify-center rounded-lg border-2 border-transparent transition-all duration-200 font-semibold text-sm relative ${getStatusColor(
                        table.status
                      )} ${
                        table.status === "available" ? "hover:scale-105" : ""
                      } ${
                        currentTableId === table.id
                          ? "border-blue-500 ring-2 ring-blue-400 shadow-md"
                          : ""
                      }`}
                      title={
                        table.status === "reserved"
                          ? `Reserved${table.reserved_for_customer_name ? ` by ${table.reserved_for_customer_name}` : ""}`
                          : undefined
                      }
                    >
                      <span className="text-lg font-bold leading-tight">T{table.table_number}</span>
                      <Badge
                        className={`mt-1 text-xs px-1.5 py-0 h-auto leading-tight ${getStatusBadgeColor(
                          table.status
                        )} text-white`}
                      >
                        {table.status.charAt(0).toUpperCase()}
                      </Badge>

                      {/* Reservation Info for Mobile */}
                      {table.status === "reserved" && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                            {table.reserved_for_customer_name && (
                              <div className="text-xs font-bold text-amber-900 dark:text-amber-100 bg-white/80 dark:bg-gray-900/80 px-1 rounded line-clamp-1">
                                {table.reserved_for_customer_name.substring(0, 10)}
                              </div>
                            )}
                            {countdowns[table.id] && (
                              <div className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-0.5 justify-center">
                                <Clock size={12} />
                                {countdowns[table.id]}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Mobile Quick Actions */}
                    {table.status !== "occupied" && (
                      <div className="mt-1 flex gap-1">
                        {table.status === "available" && (
                          <button
                            onClick={() => {
                              setSelectedTableForReserve({ id: table.id, name: `T${table.table_number}` })
                              setReserveModalOpen(true)
                            }}
                            className="flex-1 text-xs px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-semibold transition-colors"
                          >
                            Reserve
                          </button>
                        )}
                        {table.status === "reserved" && (
                          <button
                            onClick={() => unreserveTable(table.id)}
                            className="flex-1 text-xs px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded font-semibold transition-colors flex items-center justify-center gap-1"
                          >
                            <X size={12} />
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reserve Table Modal */}
      {selectedTableForReserve && (
        <ReserveTableModal
          isOpen={reserveModalOpen}
          onClose={() => {
            setReserveModalOpen(false)
            setSelectedTableForReserve(null)
          }}
          tableId={selectedTableForReserve.id}
          tableName={selectedTableForReserve.name}
        />
      )}

      {/* Reservation Details Modal */}
      {selectedTableForDetails && (
        <ReservationDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false)
            setSelectedTableForDetails(null)
          }}
          table={tables.find((t) => t.id === selectedTableForDetails)}
        />
      )}
    </>
  )
}
