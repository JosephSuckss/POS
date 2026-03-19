"use client"

import Image from "next/image"
import { PlusCircle } from "lucide-react"
import { useEffect, useState } from "react"
import useSWR from "swr"

import { Card, CardContent } from "@/components/ui/card"
import { useCart } from "../context/cart-context"
import type { Product } from "../context/cart-context"

interface ProductGridProps {
  category: string
  searchQuery: string
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
})

export default function ProductGrid({ category, searchQuery }: ProductGridProps) {
  const { addToCart } = useCart()
  const { data: allProducts = [], error, isLoading } = useSWR<Product[]>('/api/products', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 60000,
  })

  useEffect(() => {
    if (error) console.error('[v0] Product fetch error:', error)
    if (allProducts.length > 0) console.log('[v0] Products loaded:', allProducts.length)
  }, [error, allProducts.length])

  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory = category === "all" || product.category?.toLowerCase() === category.toLowerCase()
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  }).map(product => ({
    ...product,
    price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
  }))

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
      {isLoading ? (
        <div className="col-span-full py-12 text-center text-muted-foreground">
          Loading products...
        </div>
      ) : error ? (
        <div className="col-span-full py-12 text-center">
          <p className="text-red-500 font-medium">Failed to load products</p>
          <p className="text-sm text-muted-foreground mt-2">Please refresh the page or contact support</p>
        </div>
      ) : allProducts.length === 0 ? (
        <div className="col-span-full py-12 text-center">
          <p className="text-muted-foreground">No products found in database</p>
          <p className="text-xs text-muted-foreground mt-1">Database may need to be seeded with product data</p>
        </div>
      ) : (
        <>
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden transition-all duration-200 hover:scale-105 hover:shadow-md cursor-pointer group"
              onClick={() => addToCart(product)}
            >
              <div className="relative aspect-square bg-gray-200">
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 z-10">
                  <PlusCircle className="h-10 w-10 text-white" />
                </div>

                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      console.log('[v0] Image failed:', product.image)
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                    }}
                  />
                ) : (
                  <Image
                    src="/placeholder.svg"
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <CardContent className="p-3">
                <div>
                  <h3 className="font-medium line-clamp-1">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredProducts.length === 0 && allProducts.length > 0 && (
            <div className="col-span-full py-12 text-center">
              <p className="text-muted-foreground">No products match your search</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
