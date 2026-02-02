"use client"

import { CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface StaffCallConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  tableNumber: string
}

export function StaffCallConfirmModal({
  isOpen,
  onClose,
  tableNumber,
}: StaffCallConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm flex flex-col p-0">
        <VisuallyHidden>
          <DialogTitle>Xác nhận gọi nhân viên</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col items-center justify-center py-8 px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 mb-4">
            <CheckCircle className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">
            Đã gửi yêu cầu thành công!
          </h2>
          <p className="text-muted-foreground text-center">
            Bàn số {tableNumber}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
