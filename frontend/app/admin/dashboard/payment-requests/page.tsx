"use client"

import React, { useEffect, useState } from "react"
import {
  Loader2,
  RefreshCw,
  Check,
  CreditCard,
  Banknote,
  Building2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface PaymentRequest {
  id: number
  customerName: string
  paymentMethod: string
  status: string
  createdAt: string
  table: {
    tableNumber: string
    tableName: string
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang xử lý",
  COMPLETED: "Hoàn thành",
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  PROCESSING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

const paymentMethodIcons: Record<string, React.ReactNode> = {
  "Tiền mặt": <Banknote className="h-5 w-5" />,
  "Chuyển khoản": <Building2 className="h-5 w-5" />,
  "Thẻ ATM": <CreditCard className="h-5 w-5" />,
}

export default function PaymentRequestsPage() {
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingRequest, setDeletingRequest] = useState<PaymentRequest | null>(null)

  useEffect(() => {
    fetchPaymentRequests()
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchPaymentRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPaymentRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/payment-requests`)
      const data = await response.json()
      if (data.success) {
        setPaymentRequests(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch payment requests:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/payment-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      if (data.success) {
        fetchPaymentRequests()
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to update payment request:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const openDeleteModal = (request: PaymentRequest) => {
    setDeletingRequest(request)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteRequest = async () => {
    if (!deletingRequest) return

    try {
      const response = await fetch(`${API_URL}/payment-requests/${deletingRequest.id}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        fetchPaymentRequests()
        setIsDeleteModalOpen(false)
        setDeletingRequest(null)
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to delete payment request:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const filteredRequests = paymentRequests.filter((request) => {
    if (selectedStatus === "all") return true
    return request.status === selectedStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN")
  }

  const pendingCount = paymentRequests.filter((p) => p.status === "PENDING").length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Yêu cầu thanh toán</h1>
            {pendingCount > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">Xem và xử lý yêu cầu thanh toán từ khách hàng</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Object.entries(statusLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchPaymentRequests}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Payment Requests List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Không có yêu cầu thanh toán nào</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className={`rounded-xl border bg-card p-4 shadow-sm transition-all ${
                request.status === "PENDING" ? "border-green-400 dark:border-green-600" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {request.table.tableName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {request.customerName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[request.status]}`}>
                    {statusLabels[request.status]}
                  </span>
                  <button
                    onClick={() => openDeleteModal(request)}
                    title="Xóa"
                    className="rounded-full p-1 text-muted-foreground hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted p-3">
                {paymentMethodIcons[request.paymentMethod] || <CreditCard className="h-5 w-5" />}
                <span className="text-sm font-medium text-foreground">
                  {request.paymentMethod}
                </span>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(request.createdAt)}
              </p>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                {request.status === "PENDING" && (
                  <Button
                    size="sm"
                    className="flex-1 justify-center"
                    onClick={() => handleUpdateStatus(request.id, "PROCESSING")}
                  >
                    Đang xử lý
                  </Button>
                )}
                {request.status === "PROCESSING" && (
                  <Button
                    size="sm"
                    className="flex-1 justify-center"
                    onClick={() => handleUpdateStatus(request.id, "COMPLETED")}
                  >
                    Hoàn thành
                  </Button>
                )}
                {request.status === "COMPLETED" && (
                  <div className="flex-1 text-center text-sm text-green-600 dark:text-green-400">
                    ✓ Đã thanh toán
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Bạn có chắc chắn muốn xóa yêu cầu thanh toán từ <strong>{deletingRequest?.table.tableName}</strong>? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Không
            </Button>
            <Button variant="destructive" onClick={handleDeleteRequest}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
