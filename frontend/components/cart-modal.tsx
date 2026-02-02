"use client"

import { Minus, Plus, ShoppingBag, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
}

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  onUpdateQuantity: (id: number, change: number) => void
  onPlaceOrder: () => void
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price)
}

export function CartModal({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onPlaceOrder,
}: CartModalProps) {
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const totalQuantity = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-lg font-bold">
            Đã chọn ({totalQuantity})
          </DialogTitle>
        </DialogHeader>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">
              Giỏ hàng của bạn đang trống
            </p>
          </div>
        ) : (
          <>
            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded-lg border border-border bg-card"
                >
                  {/* Image */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <span className="text-xl">🍽️</span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col justify-end min-w-0">
                    <h3 className="font-semibold text-foreground mb-2 truncate text-sm">
                      {item.name}
                    </h3>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-semibold text-foreground w-6 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 rounded-full"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className="flex flex-col items-end justify-between flex-shrink-0 ml-auto">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => onUpdateQuantity(item.id, -item.quantity)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <p className="font-bold text-foreground text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer with Total and Order Button */}
            <div className="border-t border-border px-6 py-4 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-semibold text-foreground">
                  Tổng cộng:
                </span>
                <span className="text-lg font-bold text-accent">
                  {formatPrice(totalPrice)}
                </span>
              </div>
              <Button
                onClick={onPlaceOrder}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white gap-2 text-base"
              >
                <ShoppingBag className="h-5 w-5" />
                Gọi món
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
