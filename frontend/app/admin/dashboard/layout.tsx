"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  UtensilsCrossed,
  Table2,
  ClipboardList,
  Bell,
  CreditCard,
  QrCode,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Tổng quan",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/admin/dashboard/menu-items",
    label: "Quản lý món ăn",
    icon: <UtensilsCrossed className="h-5 w-5" />,
  },
  {
    href: "/admin/dashboard/tables",
    label: "Quản lý bàn",
    icon: <Table2 className="h-5 w-5" />,
  },
  {
    href: "/admin/dashboard/orders",
    label: "Đơn hàng",
    icon: <ClipboardList className="h-5 w-5" />,
  },
  {
    href: "/admin/dashboard/staff-calls",
    label: "Gọi nhân viên",
    icon: <Bell className="h-5 w-5" />,
  },
  {
    href: "/admin/dashboard/payment-requests",
    label: "Yêu cầu thanh toán",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    href: "/admin/dashboard/qr-codes",
    label: "Mã QR",
    icon: <QrCode className="h-5 w-5" />,
  },
]

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [adminUser, setAdminUser] = useState<{ fullName: string; email: string } | null>(null)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("adminToken")
    const user = localStorage.getItem("adminUser")
    
    if (!token) {
      router.push("/admin")
      return
    }

    if (user) {
      setAdminUser(JSON.parse(user))
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("adminToken")
    localStorage.removeItem("adminUser")
    router.push("/admin")
  }

  const isActive = (href: string) => {
    if (href === "/admin/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card border-r border-border transition-transform duration-300 lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">E-Menu Admin</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-foreground"
              aria-label="Đóng menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                    {isActive(item.href) && (
                      <ChevronRight className="ml-auto h-4 w-4" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* User Info & Logout */}
          <div className="border-t border-border p-4">
            {adminUser && (
              <div className="mb-3 rounded-lg bg-muted p-3">
                <p className="text-sm font-medium text-foreground">{adminUser.fullName}</p>
                <p className="text-xs text-muted-foreground">{adminUser.email}</p>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Mở menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-semibold text-foreground">E-Menu Admin</span>
          <div className="w-6" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
