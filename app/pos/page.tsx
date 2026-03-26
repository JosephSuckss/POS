"use client"

import { CartSidebar } from "@/app/components/cart-sidebar"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Menu } from "lucide-react"
import { useCart } from "@/app/context/cart-context"
import { POS_GRID } from "@/lib/constants"
import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MenuButton } from "@/app/components/menu-button"
import { TableSidebar } from "@/app/components/table-sidebar"

const CATEGORIES = [
  { id: "all", name: "All Items", icon: "📋" },
  { id: "appetizers", name: "Appetizers", icon: "🥢" },
  { id: "mains", name: "Mains", icon: "🍗" },
  { id: "sides", name: "Sides", icon: "🍟" },
  { id: "drinks", name: "Drinks", icon: "🥤" },
  { id: "desserts", name: "Desserts", icon: "🍰" },
  { id: "condiments", name: "Condiments", icon: "🧂" },
]

export default function POSPage() {
  const [showCart, setShowCart] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const { cart } = useCart()
  const searchParams = useSearchParams()
  const router = useRouter()

  const reasonMessage = useMemo(() => {
    return searchParams.get("reason") === "forbidden"
      ? "You do not have permission to access the admin area."
      : ""
  }, [searchParams])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background md:flex-row">
      <Sheet open={showCart} onOpenChange={setShowCart}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:w-96">
          <div className="sr-only">
            <h2>Cart</h2>
          </div>
          <CartSidebar />
        </SheetContent>
      </Sheet>

      <aside className="hidden flex-col border-r bg-card/50 md:flex md:w-56 lg:w-64">
        <div className="border-b p-6">
          <h2 className="text-lg font-bold tracking-tight">Categories</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-2 p-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <span className="mr-3 text-xl">{cat.icon}</span>
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
        <TableSidebar />
      </aside>

      {/* Mobile Table Selector */}
      <div className="md:hidden border-b bg-card/50 p-3">
        <TableSidebar />
      </div>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur-sm">
          <div className="space-y-3 px-4 py-3 md:px-6 md:py-4">
            {reasonMessage && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{reasonMessage}</AlertDescription>
              </Alert>
            )}
            <div className="flex items-center justify-between gap-4">
              <h1 className="text-2xl font-bold tracking-tight">Menu</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCart(true)}
                  className="relative flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
                >
                  <span className="text-lg">🛒</span>
                  <span className="font-medium">
                    Cart {cart.length > 0 && `(${cart.length})`}
                  </span>
                  {cart.length > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                      {cart.length}
                    </span>
                  )}
                </button>
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="space-y-6 p-4 md:px-6 md:py-4">
              {CATEGORIES.map((cat) => {
                if (selectedCategory !== "all" && selectedCategory !== cat.id)
                  return null

                const categoryItems = POS_GRID.filter(
                  (item) => item.category === cat.id
                )

                if (categoryItems.length === 0) return null

                return (
                  <div key={cat.id}>
                    <h2 className="mb-3 text-lg font-semibold text-foreground">
                      {cat.name}
                    </h2>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                      {categoryItems.map((item) => (
                        <MenuButton key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  )
}
