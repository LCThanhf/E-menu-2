"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Search, ShoppingCart, UtensilsCrossed } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MenuCard } from "@/components/menu-card"
import { CartModal } from "@/components/cart-modal"
import { OrderConfirmModal } from "@/components/order-confirm-modal"
import { getMenuItems, getCategories, createOrder } from "@/lib/api"

interface MenuPageProps {
  tableNumber: string
  tableSlug: string
}

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  category: { slug: string; name: string }
  image: string
}

const defaultCategories = [
  { id: "all", name: "Tất cả" },
  { id: "appetizer", name: "Khai vị" },
  { id: "main", name: "Món chính" },
  { id: "drink", name: "Đồ uống" },
  { id: "dessert", name: "Tráng miệng" },
]

export function MenuPage({ tableNumber, tableSlug }: MenuPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isOrderConfirmOpen, setIsOrderConfirmOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState(defaultCategories)
  const [cartItems, setCartItems] = useState<
    Array<{
      id: number
      name: string
      price: number
      quantity: number
      image: string
    }>
  >([])

  // Fetch menu items and categories from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [menuResult, categoryResult] = await Promise.all([
          getMenuItems(),
          getCategories(),
        ])

        if (menuResult.success && menuResult.data) {
          setMenuItems(menuResult.data)
        }

        if (categoryResult.success && categoryResult.data) {
          setCategories([
            { id: "all", name: "Tất cả" },
            ...categoryResult.data.map((cat: any) => ({
              id: cat.slug,
              name: cat.name,
            })),
          ])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  const filteredItems = menuItems.filter((item) => {
    const categorySlug = typeof item.category === 'object' ? item.category.slug : item.category
    const matchesCategory =
      selectedCategory === "all" || categorySlug === selectedCategory
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleAddToCart = (item: {
    id: number
    name: string
    price: number
    image: string
  }) => {
    setCartItems((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id)
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
  }

  const handleUpdateQuantity = (id: number, change: number) => {
    setCartItems((prev) => {
      const updatedItems = prev
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + change } : item
        )
        .filter((item) => item.quantity > 0)
      return updatedItems
    })
  }

  const handlePlaceOrder = async () => {
    // Get customer name from localStorage
    const customerName = localStorage.getItem("customerName") || "Khách hàng"
    
    try {
      const result = await createOrder({
        tableNumber,
        customerName,
        items: cartItems.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
      })

      if (result.success) {
        console.log("Order created:", result.data)
        setCartItems([])
        setIsCartOpen(false)
        setIsOrderConfirmOpen(true)
      } else {
        console.error("Failed to create order:", result.message)
        alert(result.message || "Có lỗi xảy ra, vui lòng thử lại")
      }
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Không thể kết nối đến server")
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href={`/${tableSlug}`}
            className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="hidden text-sm font-medium sm:inline">
              Quay lại
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">E-Menu</span>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="relative gap-2 bg-transparent"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Giỏ hàng</span>
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                {cartCount}
              </span>
            )}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-primary px-4 py-8 text-primary-foreground">
        <div className="mx-auto max-w-7xl text-center">
          <h1 className="text-balance text-3xl font-bold md:text-4xl">
            Thực đơn
          </h1>
          <p className="mt-2 text-primary-foreground/80">
            Khám phá các món ăn tuyệt vời của chúng tôi
          </p>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto max-w-7xl space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 bg-background pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Grid */}
      <section className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          {filteredItems.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <MenuCard
                  key={item.id}
                  item={item}
                  onAddToCart={() => handleAddToCart(item)}
                />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                Không tìm thấy món ăn nào
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-6">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>Hệ thống thực đơn điện tử © 2026</p>
        </div>
      </footer>

      {/* Cart Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onPlaceOrder={handlePlaceOrder}
      />

      {/* Order Confirmation Modal */}
      <OrderConfirmModal
        isOpen={isOrderConfirmOpen}
        onClose={() => setIsOrderConfirmOpen(false)}
        tableNumber={tableNumber}
      />
    </div>
  )
}
