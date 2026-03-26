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
}

interface TableContextType {
  currentTableId: number | null
  tables: Table[]
  loading: boolean
  selectTable: (tableId: number) => void
  deselectTable: () => void
  fetchTables: () => Promise<void>
}

const TableContext = createContext<TableContextType | undefined>(undefined)

export function TableProvider({ children }: { children: React.ReactNode }) {
  const [currentTableId, setCurrentTableId] = useState<number | null>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [isHydrated, setIsHydrated] = useState(false)

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
        selectTable,
        deselectTable,
        fetchTables,
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
