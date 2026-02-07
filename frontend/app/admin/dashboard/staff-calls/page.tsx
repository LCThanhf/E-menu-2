"use client"

import React, { useEffect, useState } from "react"
import {
  Loader2,
  RefreshCw,
  Check,
  Bell,
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

interface StaffCall {
  id: number
  customerName: string
  reason: string
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
  ACKNOWLEDGED: "Đã nhận",
  COMPLETED: "Hoàn thành",
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  ACKNOWLEDGED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
}

export default function StaffCallsPage() {
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingCall, setDeletingCall] = useState<StaffCall | null>(null)

  useEffect(() => {
    fetchStaffCalls()
    
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchStaffCalls, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStaffCalls = async () => {
    try {
      const response = await fetch(`${API_URL}/staff-calls`)
      const data = await response.json()
      if (data.success) {
        setStaffCalls(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch staff calls:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/staff-calls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      if (data.success) {
        fetchStaffCalls()
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to update staff call:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const openDeleteModal = (call: StaffCall) => {
    setDeletingCall(call)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteCall = async () => {
    if (!deletingCall) return

    try {
      const response = await fetch(`${API_URL}/staff-calls/${deletingCall.id}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        fetchStaffCalls()
        setIsDeleteModalOpen(false)
        setDeletingCall(null)
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to delete staff call:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const filteredCalls = staffCalls.filter((call) => {
    if (selectedStatus === "all") return true
    return call.status === selectedStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN")
  }

  const pendingCount = staffCalls.filter((c) => c.status === "PENDING").length

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Gọi nhân viên</h1>
            {pendingCount > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                {pendingCount}
              </span>
            )}
          </div>
          <p className="text-muted-foreground">Xem và xử lý yêu cầu gọi nhân viên từ khách hàng</p>
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
          <Button variant="outline" onClick={fetchStaffCalls}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Staff Calls List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredCalls.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Không có yêu cầu gọi nhân viên nào</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCalls.map((call) => (
            <div
              key={call.id}
              className={`rounded-xl border bg-card p-4 shadow-sm transition-all ${
                call.status === "PENDING" ? "border-yellow-400 dark:border-yellow-600" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {call.table.tableName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {call.customerName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[call.status]}`}>
                    {statusLabels[call.status]}
                  </span>
                  <button
                    onClick={() => openDeleteModal(call)}
                    title="Xóa"
                    className="rounded-full p-1 text-muted-foreground hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-muted p-3">
                <p className="text-sm text-foreground">
                  <strong>Lý do:</strong> {call.reason}
                </p>
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                {formatDate(call.createdAt)}
              </p>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-2">
                {call.status === "PENDING" && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUpdateStatus(call.id, "ACKNOWLEDGED")}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Đã nhận
                  </Button>
                )}
                {call.status === "ACKNOWLEDGED" && (
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleUpdateStatus(call.id, "COMPLETED")}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    Hoàn thành
                  </Button>
                )}
                {call.status === "COMPLETED" && (
                  <div className="flex-1 text-center text-sm text-green-600 dark:text-green-400">
                    ✓ Đã hoàn thành
                  </div>
                )}
              </div>
            </div>
          ))}n        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Bạn có chắc chắn muốn xóa yêu cầu gọi nhân viên từ <strong>{deletingCall?.table.tableName}</strong>? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Không
            </Button>
            <Button variant="destructive" onClick={handleDeleteCall}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
