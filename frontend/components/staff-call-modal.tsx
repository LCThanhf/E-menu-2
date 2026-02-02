"use client"

import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react"

interface StaffCallModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
}

const quickOptions = [
  "Thêm bát",
  "Thêm đũa",
]

export function StaffCallModal({
  isOpen,
  onClose,
  onSubmit,
}: StaffCallModalProps) {
  const [reason, setReason] = useState("")
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const handleQuickOption = (option: string) => {
    setSelectedOptions((prev) => {
      if (prev.includes(option)) {
        // Remove option if already selected
        return prev.filter((opt) => opt !== option)
      } else {
        // Add option if not selected
        return [...prev, option]
      }
    })
  }

  const handleSubmit = () => {
    const parts: string[] = []
    
    // Add input text if exists
    if (reason.trim()) {
      parts.push(reason.trim())
    }
    
    // Add selected options
    if (selectedOptions.length > 0) {
      parts.push(...selectedOptions)
    }
    
    // Combine with comma
    const fullReason = parts.join(", ")
    
    if (fullReason) {
      onSubmit(fullReason)
      setReason("")
      setSelectedOptions([])
      onClose()
    }
  }

  const canSubmit = reason.trim() || selectedOptions.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-md flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-bold">Gọi nhân viên</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-base font-semibold">
              Lý do gọi nhân viên
            </Label>
            <Input
              id="reason"
              type="text"
              placeholder="Nhập lý do..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="h-12 text-base border-border"
              autoFocus={false}
            />
          </div>

          {/* Quick Options */}
          <div className="space-y-2">
            <p className="text-base font-semibold">Chọn nhanh:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickOptions.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  onClick={() => handleQuickOption(option)}
                  className={`h-auto py-2 text-sm ${
                    selectedOptions.includes(option) ? "border-accent bg-accent/10" : ""
                  }`}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Submit Button */}
        <div className="border-t border-border px-6 py-4 bg-muted/30">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
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
