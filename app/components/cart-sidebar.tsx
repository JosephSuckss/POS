"use client"

import { useRouter } from "next/navigation"
import { Minus, Plus, ShoppingCart, Trash2, User, Tag, LogOut, AlertCircle } from "lucide-react"
import { useState, useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { IMAGE_PLACEHOLDER } from "@/lib/image-placeholder"
import { useCart } from "../context/cart-context"
import { useTable } from "../context/table-context"
import CustomerModal from "./customer-modal"
import DiscountModal from "./discount-modal"

export default function CartSidebar() {
  const router = useRouter()
  const { cart, removeFromCart, updateQuantity, cartTotal, itemCount, customer, appliedDiscount, discountAmount } =
    useCart()
  const { currentTableId, tables, markTableOccupied, tableStatusPending } = useTable()
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [tableOccupiedStatus, setTableOccupiedStatus] = useState<Set<number>>(new Set())
  const prevCartLengthRef = useRef(0)

  const selectedTable = tables.find((t) => t.id === currentTableId)

  // Track when first item is added and mark table as occupied
  useEffect(() => {
    if (!currentTableId) {
      prevCartLengthRef.current = 0
      setTableOccupiedStatus(new Set())
      return
    }

    const wasEmpty = prevCartLengthRef.current === 0
    const isNowEmpty = cart.length === 0
    const hasItems = cart.length > 0

    // First item added to cart
    if (wasEmpty && hasItems && !tableOccupiedStatus.has(currentTableId)) {
      prevCartLengthRef.current = cart.length
      
      markTableOccupied(currentTableId).catch((error) => {
        console.error("Failed to mark table as occupied:", error)
      })

      setTableOccupiedStatus((prev) => new Set(prev).add(currentTableId))
    } else if (isNowEmpty && tableOccupiedStatus.has(currentTableId)) {
      // Cart emptied, reset the flag
      setTableOccupiedStatus((prev) => {
        const newSet = new Set(prev)
        newSet.delete(currentTableId)
        return newSet
      })
      prevCartLengthRef.current = 0
    } else {
      prevCartLengthRef.current = cart.length
    }
  }, [cart.length, currentTableId, tableOccupiedStatus, markTableOccupied])

  const handleCheckout = () => {
    router.push("/checkout")
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("[auth] Logout failed:", error)
    } finally {
      router.push("/")
      router.refresh()
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center border-b px-4 py-3.5">
        <h2 className="flex items-center text-lg font-semibold">
          <ShoppingCart className="mr-2 h-5 w-5" />
          <span>Cart</span>
          <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
            {itemCount}
          </span>
        </h2>
      </div>

      {selectedTable && (
        <div className={`border-b p-3 ${
          tableStatusPending.has(selectedTable.id)
            ? "bg-blue-100 dark:bg-blue-900 animate-pulse"
            : "bg-blue-50 dark:bg-blue-950"
        }`}>
          <p className="text-xs font-medium text-blue-900 dark:text-blue-100">
            📍 Table {selectedTable.table_number} ({selectedTable.capacity} seats)
            {selectedTable.status === "occupied" && <span className="ml-2">🔴 Occupied</span>}
          </p>
        </div>
      )}

      <div className="border-b p-4">
        <Button
          variant="outline"
          className="w-full justify-start bg-transparent"
          onClick={() => setShowCustomerModal(true)}
        >
          <User className="mr-2 h-4 w-4" />
          {customer ? customer.name : "Select Customer"}
        </Button>
      </div>

      <div className="border-b p-4">
        <Button
          variant="outline"
          className="w-full justify-start bg-transparent"
          onClick={() => setShowDiscountModal(true)}
        >
          <Tag className="mr-2 h-4 w-4" />
          {appliedDiscount ? appliedDiscount.description : "Apply Discount"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {cart.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <ShoppingCart className="mb-2 h-12 w-12 text-muted-foreground" />
            <h3 className="font-medium">Your cart is empty</h3>
            <p className="text-sm text-muted-foreground">Add items to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border">
                  <img
                    src={item.image || IMAGE_PLACEHOLDER}
                    alt={item.name}
                    className="h-full w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = IMAGE_PLACEHOLDER
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex justify-between">
                    <h3 className="line-clamp-1 font-medium">{item.name}</h3>
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-transparent"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-transparent"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t p-4">
        <div className="mb-4 space-y-2">
          <div className="flex justify-between">
            <p>Subtotal</p>
            <p>${cartTotal.toFixed(2)}</p>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-green-600">
              <p>Discount</p>
              <p>-${discountAmount.toFixed(2)}</p>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <p>Total</p>
            <p>${(cartTotal - discountAmount).toFixed(2)}</p>
          </div>
        </div>
        {cart.length > 0 && !selectedTable && (
          <Alert className="mb-2 border-yellow-300 bg-yellow-50 dark:bg-yellow-950">
            <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-200">
              Please select a table to proceed with checkout
            </AlertDescription>
          </Alert>
        )}
        <Button
          className="w-full"
          size="lg"
          disabled={cart.length === 0 || !selectedTable}
          onClick={handleCheckout}
        >
          Checkout
        </Button>
        <Button variant="outline" className="w-full" onClick={handleLogout} disabled={isLoggingOut}>
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
      <CustomerModal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} />
      <DiscountModal isOpen={showDiscountModal} onClose={() => setShowDiscountModal(false)} />
    </div>
  )
}