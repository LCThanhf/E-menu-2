"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { UtensilsCrossed, Bell, DollarSign, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { StaffCallModal } from "@/components/staff-call-modal"
import { PaymentCallModal } from "@/components/payment-call-modal"
import { StaffCallConfirmModal } from "@/components/staff-call-confirm-modal"
import { PaymentCallConfirmModal } from "@/components/payment-call-confirm-modal"
import { createStaffCall, createPaymentRequest } from "@/lib/api"

interface RoleSelectionProps {
  tableNumber: string
  tableSlug: string
}

export function RoleSelection({ tableNumber, tableSlug }: RoleSelectionProps) {
  const [customerName, setCustomerName] = useState("")
  const [showRequired, setShowRequired] = useState(false)
  const [isStaffCallOpen, setIsStaffCallOpen] = useState(false)
  const [isPaymentCallOpen, setIsPaymentCallOpen] = useState(false)
  const [isStaffConfirmOpen, setIsStaffConfirmOpen] = useState(false)
  const [isPaymentConfirmOpen, setIsPaymentConfirmOpen] = useState(false)

  // Load customer name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem("customerName")
    if (savedName) {
      setCustomerName(savedName)
    }
  }, [])

  // Save customer name to localStorage whenever it changes
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setCustomerName(newName)
    localStorage.setItem("customerName", newName)
    if (newName.trim()) {
      setShowRequired(false)
    }
  }

  const handleCallStaff = () => {
    if (!customerName.trim()) {
      setShowRequired(true)
      return
    }
    setIsStaffCallOpen(true)
  }

  const handleStaffCallSubmit = async (reason: string) => {
    try {
      const result = await createStaffCall({
        tableNumber,
        customerName,
        reason,
      })
      
      if (result.success) {
        console.log("Staff call created:", result.data)
        setIsStaffConfirmOpen(true)
      } else {
        console.error("Failed to create staff call:", result.message)
        alert(result.message || "Có lỗi xảy ra, vui lòng thử lại")
      }
    } catch (error) {
      console.error("Error creating staff call:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const handleCallPayment = () => {
    if (!customerName.trim()) {
      setShowRequired(true)
      return
    }
    setIsPaymentCallOpen(true)
  }

  const handlePaymentCallSubmit = async (paymentMethod: string) => {
    try {
      const result = await createPaymentRequest({
        tableNumber,
        customerName,
        paymentMethod,
      })
      
      if (result.success) {
        console.log("Payment request created:", result.data)
        setIsPaymentConfirmOpen(true)
      } else {
        console.error("Failed to create payment request:", result.message)
        alert(result.message || "Có lỗi xảy ra, vui lòng thử lại")
      }
    } catch (error) {
      console.error("Error creating payment request:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    if (!customerName.trim()) {
      e.preventDefault()
      setShowRequired(true)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      {/* Logo and Header */}
      <div className="mb-18 text-center">
        <div className="mb-4 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <UtensilsCrossed className="h-8 w-8 text-primary-foreground" />
          </div>
        </div>
        <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          E-Menu
        </h1>
        <p className="mt-3 text-muted-foreground">
          Chào mừng bạn đến với hệ thống thực đơn điện tử
        </p>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md space-y-6">
        {/* Customer Name Input */}
        <div className="space-y-2">
          <Label htmlFor="customerName" className="text-base pl-1">
            Bàn số {tableNumber}
          </Label>
          <Input
            id="customerName"
            type="text"
            placeholder="Tên của bạn"
            value={customerName}
            onChange={handleNameChange}
            className="h-12 text-base"
            required
          />
          {showRequired && !customerName.trim() && (
            <p className="text-sm text-red-500">Vui lòng nhập tên của bạn</p>
          )}
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          {/* Call Staff and Payment Buttons - Side by Side */}
          <div className="grid grid-cols-2 gap-4">
            {/* Call Staff Button */}
            <button
              onClick={handleCallStaff}
              className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-accent hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 transition-colors group-hover:bg-accent">
                <Bell className="h-5 w-5 text-accent transition-colors group-hover:text-accent-foreground" />
              </div>
              <div className="text-center">
                <h2 className="text-sm font-semibold text-foreground">
                  Gọi nhân viên
                </h2>
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </button>

            {/* Call Payment Button */}
            <button
              onClick={handleCallPayment}
              className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-green-500 hover:shadow-lg"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10 transition-colors group-hover:bg-green-500">
                <DollarSign className="h-5 w-5 text-green-600 transition-colors group-hover:text-white" />
              </div>
              <div className="text-center">
                <h2 className="text-sm font-semibold text-foreground">
                  Gọi thanh toán
                </h2>
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-green-500 transition-all duration-300 group-hover:w-full" />
            </button>
          </div>

          {/* Menu Card - Full Width */}
          <Link
            href={`/${tableSlug}/menu`}
            onClick={handleMenuClick}
            className="group relative flex flex-col items-center gap-3 overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-primary hover:shadow-lg"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary">
              <UtensilsCrossed className="h-5 w-5 text-primary transition-colors group-hover:text-primary-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-sm font-semibold text-foreground">
                Thực đơn & gọi món
              </h2>
            </div>
            <div className="absolute bottom-0 left-0 h-1 w-0 bg-primary transition-all duration-300 group-hover:w-full" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Vui lòng nhập tên và chọn dịch vụ để tiếp tục
      </p>

      {/* Staff Call Modal */}
      <StaffCallModal
        isOpen={isStaffCallOpen}
        onClose={() => setIsStaffCallOpen(false)}
        onSubmit={handleStaffCallSubmit}
      />

      {/* Payment Call Modal */}
      <PaymentCallModal
        isOpen={isPaymentCallOpen}
        onClose={() => setIsPaymentCallOpen(false)}
        onSubmit={handlePaymentCallSubmit}
      />

      {/* Staff Call Confirmation Modal */}
      <StaffCallConfirmModal
        isOpen={isStaffConfirmOpen}
        onClose={() => setIsStaffConfirmOpen(false)}
        tableNumber={tableNumber}
      />

      {/* Payment Call Confirmation Modal */}
      <PaymentCallConfirmModal
        isOpen={isPaymentConfirmOpen}
        onClose={() => setIsPaymentConfirmOpen(false)}
        tableNumber={tableNumber}
      />
    </div>
  )
}
