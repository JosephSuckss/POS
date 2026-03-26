"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export interface Table {
  id: number
  table_number: number
  capacity: number
  status: "available" | "occupied" | "reserved"
  current_order_id: number | null
  created_at: string
  updated_at: string
  reserved_from: string | null
  reserved_to: string | null
  reserved_by_staff_id?: number
  reserved_for_customer_name?: string
  reserved_for_customer_phone?: string
  reserved_notes?: string
  reserved_at?: string
}

export interface ReservationDetails {
  type: "simple" | "timed"
  from?: Date
  to?: Date
  customerName?: string
  customerPhone?: string
  notes?: string
}

interface TableContextType {
  currentTableId: number | null
  tables: Table[]
  loading: boolean
  tableStatusPending: Set<number>
  selectTable: (tableId: number) => void
  deselectTable: () => void
  fetchTables: () => Promise<void>
  updateTableStatus: (
    tableId: number,
    status: "available" | "occupied" | "reserved",
    orderId?: number
  ) => Promise<void>
  markTableOccupied: (tableId: number, orderId?: number) => Promise<void>
  markTableAvailable: (tableId: number) => Promise<void>
  reserveTable: (tableId: number, reservationDetails: ReservationDetails) => Promise<void>
  unreserveTable: (tableId: number) => Promise<void>
  extendReservation: (tableId: number, newEndTime: Date) => Promise<void>
}

const TableContext = createContext<TableContextType | undefined>(undefined)

export function TableProvider({ children }: { children: React.ReactNode }) {
  const [currentTableId, setCurrentTableId] = useState<number | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)
  const [tableStatusPending, setTableStatusPending] = useState<Set<number>>(new Set())

  // Load selected table from localStorage on mount
  useEffect(() => {
    const savedTableId = localStorage.getItem("selectedTableId")
    if (savedTableId) {
      setCurrentTableId(parseInt(savedTableId, 10))
    }
    setIsHydrated(true)
  }, [])

  // Fetch tables on mount
  useEffect(() => {
    if (isHydrated) {
      fetchTables()
    }
  }, [isHydrated])

  // Poll for table status updates every 10 seconds
  useEffect(() => {
    if (!isHydrated) return

    const interval = setInterval(() => {
      fetchTables()
    }, 10000)

    return () => clearInterval(interval)
  }, [isHydrated])

  // Auto-release expired reservations every 2 minutes
  useEffect(() => {
    if (!isHydrated) return

    const interval = setInterval(() => {
      setTables((prev) =>
        prev.map((table) => {
          if (table.status === "reserved" && table.reserved_to) {
            const endTime = new Date(table.reserved_to)
            if (endTime < new Date()) {
              // Auto-release expired reservation
              console.log(`Auto-releasing expired reservation for Table ${table.table_number}`)
              return {
                ...table,
                status: "available",
                reserved_from: null,
                reserved_to: null,
              }
            }
          }
          return table
        })
      )
    }, 120000) // Check every 2 minutes

    return () => clearInterval(interval)
  }, [isHydrated])

  const fetchTables = async () => {
    try {
      const response = await fetch("/api/tables", {
        credentials: "include",
      })
      if (response.ok) {
        const data = await response.json()
        setTables(data)
      } else if (response.status !== 404) {
        console.error("Failed to fetch tables:", response.status)
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateTableStatus = async (
    tableId: number,
    status: "available" | "occupied" | "reserved",
    orderId?: number
  ) => {
    // Mark as pending to show loading state
    setTableStatusPending((prev) => new Set(prev).add(tableId))

    try {
      // Optimistic update - update UI immediately
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
                ...table,
                status,
                current_order_id: orderId || null,
              }
            : table
        )
      )

      // Persist to backend
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          current_order_id: orderId || null,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        console.error(`Failed to update table ${tableId} status:`, response.status)
        // Revert optimistic update on error
        await fetchTables()
        throw new Error(`Failed to update table status: ${response.status}`)
      }

      const updatedTable = await response.json()
      // Update with server response to ensure consistency
      setTables((prev) =>
        prev.map((table) => (table.id === tableId ? updatedTable : table))
      )
    } catch (error) {
      console.error(`Error updating table ${tableId} status:`, error)
      // Revert optimistic update
      await fetchTables()
      throw error
    } finally {
      // Mark as no longer pending
      setTableStatusPending((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tableId)
        return newSet
      })
    }
  }

  const markTableOccupied = async (tableId: number, orderId?: number) => {
    await updateTableStatus(tableId, "occupied", orderId)
  }

  const markTableAvailable = async (tableId: number) => {
    await updateTableStatus(tableId, "available")
  }

  const reserveTable = async (tableId: number, reservationDetails: ReservationDetails) => {
    setTableStatusPending((prev) => new Set(prev).add(tableId))

    try {
      // Optimistic update
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
                ...table,
                status: "reserved",
                reserved_from: reservationDetails.from?.toISOString() || null,
                reserved_to: reservationDetails.to?.toISOString() || null,
              }
            : table
        )
      )

      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reserve",
          type: reservationDetails.type,
          from: reservationDetails.from?.toISOString(),
          to: reservationDetails.to?.toISOString(),
          customerName: reservationDetails.customerName,
          customerPhone: reservationDetails.customerPhone,
          notes: reservationDetails.notes,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        console.error(`Failed to reserve table ${tableId}:`, response.status)
        await fetchTables()
        throw new Error(`Failed to reserve table: ${response.status}`)
      }

      const updatedTable = await response.json()
      setTables((prev) =>
        prev.map((table) => (table.id === tableId ? updatedTable : table))
      )
    } catch (error) {
      console.error(`Error reserving table ${tableId}:`, error)
      await fetchTables()
      throw error
    } finally {
      setTableStatusPending((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tableId)
        return newSet
      })
    }
  }

  const unreserveTable = async (tableId: number) => {
    setTableStatusPending((prev) => new Set(prev).add(tableId))

    try {
      // Optimistic update
      setTables((prev) =>
        prev.map((table) =>
          table.id === tableId
            ? {
                ...table,
                status: "available",
                reserved_from: null,
                reserved_to: null,
              }
            : table
        )
      )

      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "unreserve",
        }),
        credentials: "include",
      })

      if (!response.ok) {
        console.error(`Failed to unreserve table ${tableId}:`, response.status)
        await fetchTables()
        throw new Error(`Failed to unreserve table: ${response.status}`)
      }

      const updatedTable = await response.json()
      setTables((prev) =>
        prev.map((table) => (table.id === tableId ? updatedTable : table))
      )
    } catch (error) {
      console.error(`Error unreserving table ${tableId}:`, error)
      await fetchTables()
      throw error
    } finally {
      setTableStatusPending((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tableId)
        return newSet
      })
    }
  }

  const extendReservation = async (tableId: number, newEndTime: Date) => {
    setTableStatusPending((prev) => new Set(prev).add(tableId))

    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "extend",
          to: newEndTime.toISOString(),
        }),
        credentials: "include",
      })

      if (!response.ok) {
        console.error(`Failed to extend reservation for table ${tableId}:`, response.status)
        await fetchTables()
        throw new Error(`Failed to extend reservation: ${response.status}`)
      }

      const updatedTable = await response.json()
      setTables((prev) =>
        prev.map((table) => (table.id === tableId ? updatedTable : table))
      )
    } catch (error) {
      console.error(`Error extending reservation for table ${tableId}:`, error)
      await fetchTables()
      throw error
    } finally {
      setTableStatusPending((prev) => {
        const newSet = new Set(prev)
        newSet.delete(tableId)
        return newSet
      })
    }
  }

  const selectTable = (tableId: number) => {
    setCurrentTableId(tableId)
    localStorage.setItem("selectedTableId", tableId.toString())
  }

  const deselectTable = () => {
    setCurrentTableId(null)
    localStorage.removeItem("selectedTableId")
  }

  return (
    <TableContext.Provider
      value={{
        currentTableId,
        tables,
        loading,
        tableStatusPending,
        selectTable,
        deselectTable,
        fetchTables,
        updateTableStatus,
        markTableOccupied,
        markTableAvailable,
        reserveTable,
        unreserveTable,
        extendReservation,
      }}
    >
      {children}
    </TableContext.Provider>
  )
}

export function useTable() {
  const context = useContext(TableContext)
  if (context === undefined) {
    throw new Error("useTable must be used within a TableProvider")
  }
  return context
}
