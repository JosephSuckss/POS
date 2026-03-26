"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Clock, Calendar, User, Phone, MessageSquare, Loader2 } from "lucide-react"
import { useTable } from "@/app/context/table-context"

interface ReservationDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  table?: {
    id: number
    table_number: number
    reserved_for_customer_name?: string
    reserved_for_customer_phone?: string
    reserved_notes?: string
    reserved_at?: string
    reserved_from?: string
    reserved_to?: string
  }
}

export default function ReservationDetailsModal({ isOpen, onClose, table }: ReservationDetailsModalProps) {
  const { unreserveTable, tableStatusPending } = useTable()
  const [countdown, setCountdown] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update countdown timer every second
  useEffect(() => {
    if (!table?.reserved_to) return

    const interval = setInterval(() => {
      const now = new Date()
      const endTime = new Date(table.reserved_to!)
      const diffMs = endTime.getTime() - now.getTime()

      if (diffMs > 0) {
        const hours = Math.floor(diffMs / (1000 * 60 * 60))
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)
        setCountdown(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setCountdown("Expired")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [table?.reserved_to])

  const handleCancel = async () => {
    if (!table?.id) return

    setError(null)
    setIsSubmitting(true)
    try {
      await unreserveTable(table.id)
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to cancel reservation"
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  const formatFullDateTime = (dateStr?: string) => {
    if (!dateStr) return "-"
    const date = new Date(dateStr)
    return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
  }

  const isPending = table?.id ? tableStatusPending.has(table.id) : false

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-lg">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl">Table {table?.table_number} - Reservation Details</SheetTitle>
          <SheetDescription>Reserved table information and management</SheetDescription>
        </SheetHeader>

        {error && (
          <Alert className="mb-4 border-red-300 bg-red-50 dark:bg-red-950">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-sm text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Time Remaining */}
          {table?.reserved_to && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/30">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                    Time Remaining
                  </div>
                  <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{countdown || "Calculating..."}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-amber-700 dark:text-amber-300">
                Expires at: <span className="font-semibold">{formatFullDateTime(table.reserved_to)}</span>
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Customer Information</h3>

            {table?.reserved_for_customer_name && (
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                <User className="mt-0.5 h-4 w-4 text-blue-500 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Name</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{table.reserved_for_customer_name}</div>
                </div>
              </div>
            )}

            {table?.reserved_for_customer_phone && (
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                <Phone className="mt-0.5 h-4 w-4 text-green-500 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Phone</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{table.reserved_for_customer_phone}</div>
                </div>
              </div>
            )}

            {table?.reserved_notes && (
              <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                <MessageSquare className="mt-0.5 h-4 w-4 text-purple-500 flex-shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-gray-600 dark:text-gray-400">Notes</div>
                  <div className="text-sm text-gray-900 dark:text-gray-100">{table.reserved_notes}</div>
                </div>
              </div>
            )}

            {!table?.reserved_for_customer_name && !table?.reserved_for_customer_phone && !table?.reserved_notes && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
                No customer information provided
              </div>
            )}
          </div>

          {/* Reservation Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Reservation Timeline</h3>

            <div className="space-y-2">
              {table?.reserved_from && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">From</span>
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDateTime(table.reserved_from)}
                  </span>
                </div>
              )}

              {table?.reserved_to && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Until</span>
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatDateTime(table.reserved_to)}
                  </span>
                </div>
              )}

              {table?.reserved_from && table?.reserved_to && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/30">
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Duration</span>
                  <span className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                    {calculateDuration(table.reserved_from, table.reserved_to)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCancel}
              disabled={isSubmitting || isPending}
              variant="destructive"
              className="flex-1"
            >
              {isSubmitting || isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "✗ Cancel Reservation"
              )}
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>

          {/* Info Message */}
          <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
            💡 <strong>Note:</strong> This reservation will automatically expire at the scheduled time and the table will become available.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function calculateDuration(fromStr: string, toStr: string): string {
  const from = new Date(fromStr)
  const to = new Date(toStr)
  const diffMs = to.getTime() - from.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  if (hours === 0) {
    return `${minutes}m`
  }
  return `${hours}h ${minutes}m`
}
