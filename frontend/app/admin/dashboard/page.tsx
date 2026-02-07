"use client"

import React, { useEffect, useState } from "react"
import {
  UtensilsCrossed,
  Table2,
  ClipboardList,
  Bell,
  CreditCard,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardStats {
  totalMenuItems: number
  totalTables: number
  totalOrders: number
  pendingOrders: number
  pendingStaffCalls: number
  pendingPaymentRequests: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMenuItems: 0,
    totalTables: 0,
    totalOrders: 0,
    pendingOrders: 0,
    pendingStaffCalls: 0,
    pendingPaymentRequests: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [menuRes, tablesRes, ordersRes, staffCallsRes, paymentRes] = await Promise.all([
        fetch(`${API_URL}/menu-items`),
        fetch(`${API_URL}/tables`),
        fetch(`${API_URL}/orders`),
        fetch(`${API_URL}/staff-calls`),
        fetch(`${API_URL}/payment-requests`),
      ])

      const [menuData, tablesData, ordersData, staffCallsData, paymentData] = await Promise.all([
        menuRes.json(),
        tablesRes.json(),
        ordersRes.json(),
        staffCallsRes.json(),
        paymentRes.json(),
      ])

      setStats({
        totalMenuItems: menuData.data?.length || 0,
        totalTables: tablesData.data?.length || 0,
        totalOrders: ordersData.data?.length || 0,
        pendingOrders: ordersData.data?.filter((o: any) => o.status === "PENDING").length || 0,
        pendingStaffCalls: staffCallsData.data?.filter((s: any) => s.status === "PENDING").length || 0,
        pendingPaymentRequests: paymentData.data?.filter((p: any) => p.status === "PENDING").length || 0,
      })
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const statCards = [
    {
      title: "Tổng món ăn",
      value: stats.totalMenuItems,
      icon: <UtensilsCrossed className="h-5 w-5" />,
      color: "bg-blue-500",
    },
    {
      title: "Tổng số bàn",
      value: stats.totalTables,
      icon: <Table2 className="h-5 w-5" />,
      color: "bg-green-500",
    },
    {
      title: "Tổng đơn hàng",
      value: stats.totalOrders,
      icon: <ClipboardList className="h-5 w-5" />,
      color: "bg-purple-500",
    },
    {
      title: "Đơn chờ xử lý",
      value: stats.pendingOrders,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "bg-orange-500",
    },
    {
      title: "Gọi nhân viên chờ",
      value: stats.pendingStaffCalls,
      icon: <Bell className="h-5 w-5" />,
      color: "bg-yellow-500",
    },
    {
      title: "Thanh toán chờ",
      value: stats.pendingPaymentRequests,
      icon: <CreditCard className="h-5 w-5" />,
      color: "bg-red-500",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tổng quan</h1>
        <p className="text-muted-foreground">Chào mừng bạn đến với bảng điều khiển E-Menu</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`rounded-full p-2 text-white ${card.color}`}>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {isLoading ? "..." : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hành động nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/admin/dashboard/menu-items"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <UtensilsCrossed className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Thêm món mới</span>
            </a>
            <a
              href="/admin/dashboard/tables"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <Table2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Quản lý bàn</span>
            </a>
            <a
              href="/admin/dashboard/orders"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Xem đơn hàng</span>
            </a>
            <a
              href="/admin/dashboard/qr-codes"
              className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
            >
              <QrCode className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Tạo mã QR</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { QrCode } from "lucide-react"
