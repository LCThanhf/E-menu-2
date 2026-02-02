"use client"

import { Bell, Banknote, QrCode, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"

interface PaymentCallModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (method: string) => void
}

const paymentMethods = ["Tiền mặt", "Chuyển khoản"]

export function PaymentCallModal({
  isOpen,
  onClose,
  onSubmit,
}: PaymentCallModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("")

  const handleMethodSelect = (method: string) => {
    setSelectedMethod(method)
  }

  const handleClose = () => {
    setSelectedMethod("")
    onClose()
  }

  const handleSubmit = () => {
    if (selectedMethod) {
      onSubmit(selectedMethod)
      setSelectedMethod("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold">Gọi thanh toán</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Chọn phương thức thanh toán
            </Label>
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => handleMethodSelect("Tiền mặt")}
                className={`w-full h-12 text-sm justify-start gap-3 ${
                  selectedMethod === "Tiền mặt"
                    ? "border-accent bg-accent/10"
                    : ""
                }`}
              >
                <Banknote className="h-5 w-5" />
                Tiền mặt
              </Button>
              <Button
                variant="outline"
                onClick={() => handleMethodSelect("Chuyển khoản")}
                className={`w-full h-12 text-sm justify-start gap-3 ${
                  selectedMethod === "Chuyển khoản"
                    ? "border-accent bg-accent/10"
                    : ""
                }`}
              >
                <QrCode className="h-5 w-5" />
                Chuyển khoản
              </Button>
              <Button
                variant="outline"
                onClick={() => handleMethodSelect("Thẻ ATM")}
                className={`w-full h-12 text-sm justify-start gap-3 ${
                  selectedMethod === "Thẻ ATM"
                    ? "border-accent bg-accent/10"
                    : ""
                }`}
              >
                <CreditCard className="h-5 w-5" />
                Thẻ ATM
              </Button>
            </div>
          </div>
        </div>

        {/* Footer with Submit Button */}
        <div className="border-t border-border px-6 py-4 bg-muted/30">
          <Button
            onClick={handleSubmit}
            disabled={!selectedMethod}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white gap-2 text-base"
          >
            <Bell className="h-5 w-5" />
            Gửi yêu cầu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
