"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, CreditCard, Wallet, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCart } from "../context/cart-context"
import { useTable } from "../context/table-context"

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, cartTotal, clearCart, customer, discountAmount } = useCart()
  const { currentTableId, markTableAvailable } = useTable()
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isHydrated, setIsHydrated] = useState(false)
  
  console.log('Checkout page render - cart length:', cart.length, 'customer:', customer?.name)
  
  // Wait for cart to be populated before rendering checkout
  useEffect(() => {
    // If cart is already populated, show immediately
    if (cart.length > 0) {
      console.log('Cart already populated, showing checkout')
      setIsHydrated(true)
      return
    }
    
    // Otherwise wait up to 500ms for cart to load
    const timer = setTimeout(() => {
      console.log('Hydration timeout - cart length:', cart.length)
      setIsHydrated(true)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  const tax = cartTotal * 0.1
  const grandTotal = cartTotal - discountAmount + tax

  const handlePayment = async () => {
    try {
      console.log('Starting checkout with cart:', cart.length, 'items, customer:', customer?.name, 'discount:', discountAmount)

      const transaction = {
        customerId: customer?.id || null,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })),
        subtotal: cartTotal,
        tax: tax,
        discount: discountAmount,
        total: grandTotal,
        paymentMethod: paymentMethod,
      }

      console.log('Sending transaction to API:', transaction)

      // Save transaction via API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process payment')
      }

      const result = await response.json()
      console.log('Payment successful, order ID:', result.orderId)
      
      // Build success URL with order info - BEFORE clearing cart
      const successParams = new URLSearchParams({
        orderId: result.orderId.toString(),
        total: grandTotal.toFixed(2),
        subtotal: cartTotal.toFixed(2),
        tax: tax.toFixed(2),
        discount: discountAmount.toFixed(2),
        paymentMethod: paymentMethod,
        items: JSON.stringify(cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })))
      })
      
      const successUrl = `/success?${successParams.toString()}`
      console.log('Redirecting to success page:', successUrl)
      
      // Mark table as available after successful checkout
      if (currentTableId) {
        try {
          await markTableAvailable(currentTableId)
          console.log('Table marked as available')
        } catch (error) {
          console.error('Failed to mark table as available:', error)
          // Don't block the checkout flow on this error
        }
      }
      
      // Clear cart first
      clearCart()
      
      // Then redirect immediately using router.push (faster than window.location)
      router.push(successUrl)
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to process payment. Please try again.')
    }
  }