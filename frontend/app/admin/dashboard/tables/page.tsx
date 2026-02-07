"use client"

import React, { useEffect, useState } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Table {
  id: number
  tableNumber: string
  tableName: string
  status: "AVAILABLE" | "OCCUPIED"
  createdAt: string
  updatedAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [deletingTable, setDeletingTable] = useState<Table | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    tableNumber: "",
    tableName: "",
    status: "AVAILABLE" as "AVAILABLE" | "OCCUPIED",
  })

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch(`${API_URL}/tables`)
      const data = await response.json()
      if (data.success) {
        setTables(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenModal = (table?: Table) => {
    if (table) {
      setEditingTable(table)
      setFormData({
        tableNumber: table.tableNumber,
        tableName: table.tableName,
        status: table.status,
      })
    } else {
      setEditingTable(null)
      const nextNumber = (tables.length + 1).toString().padStart(2, "0")
      setFormData({
        tableNumber: nextNumber,
        tableName: `Bàn ${tables.length + 1}`,
        status: "AVAILABLE",
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingTable(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingTable
        ? `${API_URL}/tables/${editingTable.id}`
        : `${API_URL}/tables`

      const response = await fetch(url, {
        method: editingTable ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        fetchTables()
        handleCloseModal()
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to save table:", error)
      alert("Không thể kết nối đến server")
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async (table: Table) => {
    try {
      const newStatus = table.status === "AVAILABLE" ? "OCCUPIED" : "AVAILABLE"
      const response = await fetch(`${API_URL}/tables/${table.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      const data = await response.json()
      if (data.success) {
        fetchTables()
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to update table status:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const handleDelete = async () => {
    if (!deletingTable) return

    try {
      const response = await fetch(`${API_URL}/tables/${deletingTable.id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (data.success) {
        fetchTables()
        setIsDeleteModalOpen(false)
        setDeletingTable(null)
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to delete table:", error)
      alert("Không thể kết nối đến server")
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý bàn</h1>
          <p className="text-muted-foreground">Quản lý các bàn trong nhà hàng</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTables}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button onClick={() => handleOpenModal()} className="gap-2">
            <Plus className="h-4 w-4" />
            Thêm bàn
          </Button>
        </div>
      </div>

      {/* Tables Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tables.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">Chưa có bàn nào. Hãy thêm bàn mới!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {table.tableName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Số bàn: {table.tableNumber}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenModal(table)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => {
                      setDeletingTable(table)
                      setIsDeleteModalOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status Button */}
              <div className="mt-4">
                <button
                  onClick={() => handleToggleStatus(table)}
                  className={`w-full rounded-lg py-2 px-4 text-sm font-medium transition-colors ${
                    table.status === "AVAILABLE"
                      ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                      : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                  }`}
                >
                  {table.status === "AVAILABLE" ? "🟢 Bàn trống" : "🔴 Đang có khách"}
                </button>
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Nhấn để đổi trạng thái
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTable ? "Chỉnh sửa bàn" : "Thêm bàn mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableNumber">Số bàn *</Label>
              <Input
                id="tableNumber"
                value={formData.tableNumber}
                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                placeholder="01, 02, 03..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tableName">Tên bàn *</Label>
              <Input
                id="tableName"
                value={formData.tableName}
                onChange={(e) => setFormData({ ...formData, tableName: e.target.value })}
                placeholder="Bàn 1, Bàn VIP..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "AVAILABLE" | "OCCUPIED") => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">🟢 Bàn trống</SelectItem>
                  <SelectItem value="OCCUPIED">🔴 Đang có khách</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : editingTable ? (
                  "Cập nhật"
                ) : (
                  "Thêm mới"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Bạn có chắc chắn muốn xóa <strong>{deletingTable?.tableName}</strong>? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
