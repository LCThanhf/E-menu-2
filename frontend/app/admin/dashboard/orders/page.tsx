"use client"

import React, { useEffect, useState } from "react"
import {
  Loader2,
  RefreshCw,
  Eye,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
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

interface OrderItem {
  id: number
  quantity: number
  unitPrice: number
  itemName: string | null
  notes: string | null
  menuItem: {
    id: number
    name: string
    price: number
  }
}

interface Order {
  id: number
  orderNumber: string
  customerName: string
  status: string
  totalAmount: number
  notes: string | null
  createdAt: string
  table: {
    tableNumber: string
    tableName: string
  }
  orderItems: OrderItem[]
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

const statusLabels: Record<string, string> = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set())
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`)
      const data = await response.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      if (data.success) {
        fetchOrders()
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to update order:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return

    try {
      const response = await fetch(`${API_URL}/orders/${deletingOrder.id}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        fetchOrders()
        setIsDeleteModalOpen(false)
        setDeletingOrder(null)
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to delete order:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const openDeleteModal = (order: Order) => {
    setDeletingOrder(order)
    setIsDeleteModalOpen(true)
  }

  const openCancelModal = (order: Order) => {
    setCancellingOrder(order)
    setIsCancelModalOpen(true)
  }

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return

    try {
      const response = await fetch(`${API_URL}/orders/${cancellingOrder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })

      const data = await response.json()
      if (data.success) {
        fetchOrders()
        setIsCancelModalOpen(false)
        setCancellingOrder(null)
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to cancel order:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const toggleExpanded = (orderId: number) => {
    const newExpanded = new Set(expandedOrders)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedOrders(newExpanded)
  }

  const filteredOrders = orders.filter((order) => {
    if (selectedStatus === "all") return true
    return order.status === selectedStatus
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN")
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Đơn hàng</h1>
          <p className="text-muted-foreground">Quản lý các đơn hàng từ khách hàng</p>
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
          <Button variant="outline" onClick={fetchOrders}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Không có đơn hàng nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Order Header */}
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleExpanded(order.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {expandedOrders.has(order.id) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        #{order.orderNumber}
                      </h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.table.tableName} • {order.customerName} • {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-accent">
                    {formatPrice(order.totalAmount)}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteModal(order)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  {order.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Xác nhận
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => openCancelModal(order)}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Hủy
                      </Button>
                    </>
                  )}
                  {order.status === "CONFIRMED" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(order.id, "COMPLETED")}
                    >
                      Hoàn thành
                    </Button>
                  )}
                </div>
              </div>

              {/* Order Items (Expanded) */}
              {expandedOrders.has(order.id) && (
                <div className="border-t border-border bg-muted/30 p-4">
                  <div className="space-y-2">
                    {order.orderItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-lg bg-card p-3"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {item.itemName || item.menuItem.name}
                          </p>
                          {item.notes && (
                            <p className="text-sm text-muted-foreground">
                              Ghi chú: {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            x{item.quantity}
                          </p>
                          <p className="font-medium text-accent">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {order.notes && (
                    <div className="mt-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        <strong>Ghi chú:</strong> {order.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn hàng #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Bàn</p>
                  <p className="font-medium">{selectedOrder.table.tableName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Khách hàng</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Thời gian</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trạng thái</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[selectedOrder.status]}`}>
                    {statusLabels[selectedOrder.status]}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h4 className="mb-2 font-medium">Món ăn</h4>
                <div className="space-y-2">
                  {selectedOrder.orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.itemName || item.menuItem.name} x{item.quantity}
                      </span>
                      <span className="font-medium">
                        {formatPrice(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Tổng cộng</span>
                  <span className="text-accent">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Bạn có chắc chắn muốn xóa đơn hàng <strong>#{deletingOrder?.orderNumber}</strong>? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Không
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrder}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận hủy</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Bạn có chắc chắn muốn hủy đơn hàng <strong>#{cancellingOrder?.orderNumber}</strong>? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>
              Không
            </Button>
            <Button variant="destructive" onClick={handleCancelOrder}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
