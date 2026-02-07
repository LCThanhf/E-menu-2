"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const BACKEND_URL = API_URL.replace("/api", "")

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: string | { slug: string; name: string }
  image: string
}

interface MenuCardProps {
  item: MenuItem
  onAddToCart: () => void
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)
}

export function MenuCard({ item, onAddToCart }: MenuCardProps) {
  // Build the full image URL
  const imageUrl = item.image 
    ? (item.image.startsWith("http") ? item.image : `${BACKEND_URL}${item.image}`)
    : null

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-300 hover:shadow-lg">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="text-2xl">🍽️</span>
              </div>
              <span className="text-xs text-muted-foreground">Hình ảnh món ăn</span>
            </div>
          </div>
        )}
      </div>

      {/* Separator Line */}
      <div className="h-px bg-black/20 dark:bg-white/20" />

      {/* Content */}
      <div className="flex flex-col flex-grow p-4">
        <h3 className="font-semibold text-foreground">{item.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {item.description}
        </p>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-bold text-accent">{formatPrice(item.price)}</span>
          <Button
            onClick={onAddToCart}
            size="sm"
            variant="outline"
            className="gap-1 text-xs bg-transparent"
          >
            <Plus className="h-3 w-3" />
            Thêm
          </Button>
        </div>
      </div>
    </div>
  )
}
