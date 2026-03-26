"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useTable, ReservationDetails } from "@/app/context/table-context"

interface ReserveTableModalProps {
  isOpen: boolean
  onClose: () => void
  tableId?: number
  tableName?: string
}

export default function ReserveTableModal({ isOpen, onClose, tableId, tableName }: ReserveTableModalProps) {
  const { reserveTable, tableStatusPending } = useTable()
  const [reservationType, setReservationType] = useState<"simple" | "timed">("simple")
  const [fromTime, setFromTime] = useState("")
  const [toTime, setToTime] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && reservationType === "timed") {
      const now = new Date()
      const from = new Date(now.getTime() + 30 * 60000)
      const to = new Date(from.getTime() + 120 * 60000)
      setFromTime(formatTimeForInput(from))
      setToTime(formatTimeForInput(to))
    }
  }, [isOpen, reservationType])

  const formatTimeForInput = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${hours}:${minutes}`
  }

  const parseDateTime = (dateStr: string, timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number)
    const date = new Date(dateStr)
    date.setHours(hours, minutes, 0, 0)
    return date
  }

  const getTodayDateString = () => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!tableId) {
      setError("Table ID is missing")
      return
    }

    if (reservationType === "timed") {
      if (!fromTime || !toTime) {
        setError("Please select both start and end times")
        return
      }

      const today = getTodayDateString()
      const from = parseDateTime(today, fromTime)
      const to = parseDateTime(today, toTime)
      const now = new Date()

      if (from < now) {
        setError("Start time cannot be in the past")
        return
      }

      if (from >= to) {
        setError("Start time must be before end time")
        return
      }

      const durationMinutes = (to.getTime() - from.getTime()) / (1000 * 60)
      if (durationMinutes < 30) {
        setError("Reservation must be at least 30 minutes")
        return
      }

      const reservationDetails: ReservationDetails = {
        type: "timed",
        from,
        to,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
      }

      await performReservation(reservationDetails)
    } else {
      const reservationDetails: ReservationDetails = {
        type: "simple",
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
      }

      await performReservation(reservationDetails)
    }
  }

  const performReservation = async (details: ReservationDetails) => {
    if (!tableId) return

    setIsSubmitting(true)
    try {
      await reserveTable(tableId, details)
      setCustomerName("")
      setCustomerPhone("")
      setNotes("")
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reserve table"
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPending = tableId ? tableStatusPending.has(tableId) : false

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-lg">
        <SheetHeader className="mb-4">
          <SheetTitle>Reserve Table {tableName || tableId}</SheetTitle>
          <SheetDescription>
            {reservationType === "simple"
              ? "Reserve this table until manually released"
              : "Reserve this table for a specific time window"}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert className="border-red-300 bg-red-50 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-sm text-red-800 dark:text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold">Reservation Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReservationType("simple")}
                className={`flex-1 rounded-lg border-2 px-4 py-2 font-medium transition-all ${
                  reservationType === "simple"
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                }`}
              >
                Simple (Until Released)
              </button>
              <button
                type="button"
                onClick={() => setReservationType("timed")}
                className={`flex-1 rounded-lg border-2 px-4 py-2 font-medium transition-all ${
                  reservationType === "timed"
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-300"
                }`}
              >
                Timed (Specific Hours)
              </button>
            </div>
          </div>

          {reservationType === "timed" && (
            <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="from-time" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    From
                  </label>
                  <input
                    id="from-time"
                    type="time"
                    value={fromTime}
                    onChange={(e) => setFromTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="to-time" className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    To
                  </label>
                  <input
                    id="to-time"
                    type="time"
                    value={toTime}
                    onChange={(e) => setToTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Customer Details (Optional)</h3>
            <div>
              <label htmlFor="customer-name" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Name
              </label>
              <input
                id="customer-name"
                type="text"
                placeholder="John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="customer-phone" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Phone
              </label>
              <input
                id="customer-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                Notes
              </label>
              <textarea
                id="notes"
                placeholder="VIP party of 8, window seating"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting || isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reserving...
                </>
              ) : (
                "✓ Reserve Table"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isPending}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
