"use client"

import React, { useEffect, useState, useRef } from "react"
import {
  Loader2,
  RefreshCw,
  Download,
  Printer,
  QrCode,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Table {
  id: number
  tableNumber: string
  tableName: string
  status: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"

// Simple QR Code component using an external API
function QRCodeDisplay({ value, size = 200 }: { value: string; size?: number }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`
  
  return (
    <img
      src={qrUrl}
      alt={`QR Code for ${value}`}
      width={size}
      height={size}
      className="mx-auto"
    />
  )
}

export default function QRCodesPage() {
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

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

  const getTableUrl = (tableNumber: string) => {
    return `${FRONTEND_URL}/${tableNumber}`
  }

  const handleDownloadQR = async (table: Table) => {
    const url = getTableUrl(table.tableNumber)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`
    
    try {
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = `qr-${table.tableName.replace(/\s+/g, "-")}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error("Failed to download QR code:", error)
      alert("Không thể tải mã QR")
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Vui lòng cho phép popup để in")
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In mã QR - ${selectedTable?.tableName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 20px;
            }
            .qr-card {
              text-align: center;
              padding: 40px;
              border: 2px solid #333;
              border-radius: 16px;
              max-width: 400px;
            }
            .qr-card h1 {
              font-size: 24px;
              margin-bottom: 8px;
            }
            .qr-card p {
              font-size: 14px;
              color: #666;
              margin-bottom: 24px;
            }
            .qr-card img {
              display: block;
              margin: 0 auto 24px;
            }
            .qr-card .url {
              font-size: 12px;
              color: #888;
              word-break: break-all;
            }
            .qr-card .footer {
              margin-top: 24px;
              font-size: 12px;
              color: #666;
            }
            @media print {
              body {
                padding: 0;
              }
              .qr-card {
                border: 2px solid #000;
              }
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <h1>${selectedTable?.tableName}</h1>
            <p>Quét mã QR để xem thực đơn</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(getTableUrl(selectedTable?.tableNumber || ""))}" alt="QR Code" />
            <p class="url">${getTableUrl(selectedTable?.tableNumber || "")}</p>
            <p class="footer">E-Menu - Thực đơn điện tử</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              }
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handlePrintAll = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      alert("Vui lòng cho phép popup để in")
      return
    }

    const qrCards = tables.map((table) => `
      <div class="qr-card">
        <h2>${table.tableName}</h2>
        <p>Quét mã QR để xem thực đơn</p>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getTableUrl(table.tableNumber))}" alt="QR Code" />
        <p class="url">${getTableUrl(table.tableNumber)}</p>
      </div>
    `).join("")

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>In tất cả mã QR</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .qr-card {
              text-align: center;
              padding: 20px;
              border: 2px solid #333;
              border-radius: 12px;
              page-break-inside: avoid;
            }
            .qr-card h2 {
              font-size: 18px;
              margin-bottom: 4px;
            }
            .qr-card p {
              font-size: 12px;
              color: #666;
              margin-bottom: 12px;
            }
            .qr-card img {
              display: block;
              margin: 0 auto 12px;
            }
            .qr-card .url {
              font-size: 10px;
              color: #888;
              word-break: break-all;
            }
            @media print {
              .grid {
                grid-template-columns: repeat(2, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${qrCards}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                }
              }, 1000);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quản lý mã QR</h1>
          <p className="text-muted-foreground">Tạo và in mã QR cho từng bàn</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTables}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button onClick={handlePrintAll} disabled={tables.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            In tất cả
          </Button>
        </div>
      </div>

      {/* Info Card */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-700 dark:text-blue-400">
          <strong>Hướng dẫn:</strong> Mỗi mã QR sẽ liên kết đến URL của bàn tương ứng. 
          Khi khách hàng quét mã QR, họ sẽ được chuyển đến trang thực đơn của bàn đó.
        </p>
      </div>

      {/* QR Codes Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : tables.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <QrCode className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Chưa có bàn nào. Hãy thêm bàn trong phần Quản lý bàn.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tables.map((table) => (
            <div
              key={table.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="text-center">
                <h3 className="font-semibold text-foreground">{table.tableName}</h3>
                <p className="text-sm text-muted-foreground">Bàn số: {table.tableNumber}</p>
              </div>

              <div className="my-4 rounded-lg bg-white p-4">
                <QRCodeDisplay value={getTableUrl(table.tableNumber)} size={150} />
              </div>

              <p className="mb-4 text-center text-xs text-muted-foreground break-all">
                {getTableUrl(table.tableNumber)}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDownloadQR(table)}
                >
                  <Download className="mr-1 h-4 w-4" />
                  Tải về
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedTable(table)
                    setIsPrintModalOpen(true)
                  }}
                >
                  <Printer className="mr-1 h-4 w-4" />
                  In
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getTableUrl(table.tableNumber), "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Print Preview Modal */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Xem trước mã QR</DialogTitle>
          </DialogHeader>
          
          {selectedTable && (
            <div ref={printRef} className="text-center py-4">
              <h2 className="text-xl font-bold text-foreground">{selectedTable.tableName}</h2>
              <p className="text-sm text-muted-foreground mb-4">Quét mã QR để xem thực đơn</p>
              
              <div className="rounded-lg bg-white p-4 inline-block">
                <QRCodeDisplay value={getTableUrl(selectedTable.tableNumber)} size={200} />
              </div>
              
              <p className="mt-4 text-xs text-muted-foreground break-all">
                {getTableUrl(selectedTable.tableNumber)}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintModalOpen(false)}>
              Đóng
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              In mã QR
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
