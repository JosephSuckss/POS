import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { CartProvider } from "./context/cart-context"
import { TableProvider } from "./context/table-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "POS System",
  description: "Point of Sale System",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50`}>
        <TableProvider>
          <CartProvider>{children}</CartProvider>
        </TableProvider>
      </body>
    </html>
  )
}
