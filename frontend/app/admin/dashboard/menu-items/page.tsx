"use client"

import React, { useEffect, useState, useRef } from "react"
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
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
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image: string | null
  isActive: boolean
  isAvailable: boolean
  categoryId: number
  category: {
    id: number
    name: string
    slug: string
  }
}

interface Category {
  id: number
  name: string
  slug: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const BACKEND_URL = API_URL.replace("/api", "")

export default function MenuItemsPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    isActive: true,
    isAvailable: true,
    image: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchMenuItems()
    fetchCategories()
  }, [])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`${API_URL}/menu-items?available=false`)
      const data = await response.json()
      if (data.success) {
        setMenuItems(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch menu items:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        categoryId: item.categoryId.toString(),
        isActive: item.isActive,
        isAvailable: item.isAvailable,
        image: item.image || "",
      })
      if (item.image) {
        setImagePreview(item.image.startsWith("http") ? item.image : `${BACKEND_URL}${item.image}`)
      }
    } else {
      setEditingItem(null)
      setFormData({
        name: "",
        description: "",
        price: "",
        categoryId: categories[0]?.id.toString() || "",
        isActive: true,
        isAvailable: true,
        image: "",
      })
      setImagePreview(null)
    }
    setImageFile(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setFormData({ ...formData, image: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image || null

    const formDataUpload = new FormData()
    formDataUpload.append("image", imageFile)

    try {
      const response = await fetch(`${API_URL}/upload/image`, {
        method: "POST",
        body: formDataUpload,
      })
      const data = await response.json()
      if (data.success) {
        return data.data.url
      }
    } catch (error) {
      console.error("Failed to upload image:", error)
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // Upload image first if there's a new one
      let imageUrl = formData.image
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        categoryId: parseInt(formData.categoryId),
        isActive: formData.isActive,
        isAvailable: formData.isAvailable,
        image: imageUrl,
      }

      const url = editingItem
        ? `${API_URL}/menu-items/${editingItem.id}`
        : `${API_URL}/menu-items`
      
      const response = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (data.success) {
        fetchMenuItems()
        handleCloseModal()
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to save menu item:", error)
      alert("Không thể kết nối đến server")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    try {
      const response = await fetch(`${API_URL}/menu-items/${deletingItem.id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (data.success) {
        fetchMenuItems()
        setIsDeleteModalOpen(false)
        setDeletingItem(null)
      } else {
        alert(data.message || "Có lỗi xảy ra")
      }
    } catch (error) {
      console.error("Failed to delete menu item:", error)
      alert("Không thể kết nối đến server")
    }
  }

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category.slug === selectedCategory
    return matchesSearch && matchesCategory
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Đang tải dữ liệu, vui lòng đợi trong giây lát...
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý món ăn</h1>
          <p className="text-muted-foreground">Thêm, sửa, xóa các món ăn trong thực đơn</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm món mới
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm món ăn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.slug}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Menu Items Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Hình ảnh</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Tên món</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Danh mục</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Giá</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">Trạng thái</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.length === 0 ? (
                  <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Không tìm thấy món ăn nào
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden border border-black/30 dark:border-white/30">
                        {item.image ? (
                          <img
                            src={item.image.startsWith("http") ? item.image : `${BACKEND_URL}${item.image}`}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-lg">🍽️</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">{item.category.name}</td>
                    <td className="px-4 py-3 text-sm font-medium text-accent">
                      {formatPrice(item.price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        item.isAvailable ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {item.isAvailable ? "Còn hàng" : "Hết hàng"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-500 hover:text-white hover:border-red-500 dark:text-red-400 dark:hover:bg-red-600 dark:hover:text-white dark:hover:border-red-600"
                          onClick={() => {
                            setDeletingItem(item)
                            setIsDeleteModalOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Chỉnh sửa món ăn" : "Thêm món ăn mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Hình ảnh</Label>
              <div className="flex items-start gap-4">
                <div className="h-24 w-24 rounded-lg border border-dashed border-border bg-muted overflow-hidden flex-shrink-0">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                    aria-label="Tải ảnh món ăn"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Tải ảnh lên
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="text-red-600"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Xóa ảnh
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">
                    JPG, PNG, WebP. Tối đa 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Tên món ăn *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nhập tên món ăn"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Mô tả món ăn"
                rows={3}
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label htmlFor="price">Giá (VND) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="Nhập giá"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Danh mục *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Switch */}
            <div className="flex items-center gap-2">
              <Switch
                id="isAvailable"
                checked={formData.isAvailable}
                onCheckedChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
              />
              <Label htmlFor="isAvailable">Còn hàng</Label>
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
                ) : editingItem ? (
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
            Bạn có chắc chắn muốn xóa món <strong>{deletingItem?.name}</strong>? Hành động này không thể hoàn tác.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" className="hover:brightness-110 transition-all" onClick={handleDelete}>
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
