"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { MessageCircle, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  getOrdersByTable, 
  getStaffCallsByTable, 
  getPaymentRequestsByTable,
  getTableByNumber 
} from "@/lib/api"

interface ChatMessage {
  id: string
  type: "customer" | "restaurant"
  content: string
  timestamp: string
  category: "order" | "staff-call" | "payment-call" | "system"
  relatedId?: number
  status?: string
}

interface ChatBubbleProps {
  tableNumber: string
}

const STORAGE_KEY_PREFIX = "chat_messages_"
const TABLE_STATUS_KEY_PREFIX = "table_status_"

export function ChatBubble({ tableNumber }: ChatBubbleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const previousStatusesRef = useRef<{
    orders: Record<number, string>
    staffCalls: Record<number, string>
    paymentRequests: Record<number, string>
  }>({ orders: {}, staffCalls: {}, paymentRequests: {} })
  const scrollRef = useRef<HTMLDivElement>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const storageKey = `${STORAGE_KEY_PREFIX}${tableNumber}`
  const statusStorageKey = `${TABLE_STATUS_KEY_PREFIX}${tableNumber}`

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(storageKey)
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        if (Array.isArray(parsed)) {
          setMessages(parsed)
        }
      } catch (e) {
        console.error("Error parsing saved messages:", e)
      }
    }

    const savedStatuses = localStorage.getItem(`${storageKey}_statuses`)
    if (savedStatuses) {
      try {
        const parsed = JSON.parse(savedStatuses)
        if (parsed && typeof parsed === 'object') {
          previousStatusesRef.current = parsed
        }
      } catch (e) {
        console.error("Error parsing saved statuses:", e)
      }
    }
    
    // Mark as initialized after loading
    setIsInitialized(true)
  }, [storageKey])

  // Save messages to localStorage whenever they change (only after initialization)
  useEffect(() => {
    if (!isInitialized) return
    localStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey, isInitialized])

  // Save statuses to localStorage periodically
  const saveStatusesToStorage = useCallback(() => {
    localStorage.setItem(`${storageKey}_statuses`, JSON.stringify(previousStatusesRef.current))
  }, [storageKey])

  // Scroll to bottom when messages change or chat opens
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen])

  // Generate unique message ID
  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Add message helper
  const addMessage = useCallback((
    type: "customer" | "restaurant",
    content: string,
    category: ChatMessage["category"],
    relatedId?: number,
    status?: string
  ) => {
    const newMessage: ChatMessage = {
      id: generateMessageId(),
      type,
      content,
      timestamp: new Date().toISOString(),
      category,
      relatedId,
      status
    }
    setMessages(prev => [...prev, newMessage])
  }, [])

  // Check for status changes and add appropriate messages
  const checkStatusChanges = useCallback(async () => {
    try {
      // Check table status - if changed to AVAILABLE, clear chat
      const tableResult = await getTableByNumber(tableNumber)
      if (tableResult.success && tableResult.data) {
        const savedTableStatus = localStorage.getItem(statusStorageKey)
        const currentStatus = tableResult.data.status
        
        // Only clear chat when table status changes TO "AVAILABLE" 
        // (meaning admin reset the table after payment completion)
        if (savedTableStatus && savedTableStatus !== currentStatus && currentStatus === "AVAILABLE") {
          // Table was reset - clear chat messages
          setMessages([])
          localStorage.removeItem(storageKey)
          localStorage.removeItem(`${storageKey}_statuses`)
          previousStatusesRef.current = { orders: {}, staffCalls: {}, paymentRequests: {} }
        }
        localStorage.setItem(statusStorageKey, currentStatus)
      }

      // Fetch current data
      const [ordersResult, staffCallsResult, paymentRequestsResult] = await Promise.all([
        getOrdersByTable(tableNumber),
        getStaffCallsByTable(tableNumber),
        getPaymentRequestsByTable(tableNumber)
      ])

      // Check order status changes
      if (ordersResult.success && ordersResult.data) {
        ordersResult.data.forEach((order: any) => {
          const prevStatus = previousStatusesRef.current.orders[order.id]
          const currentStatus = order.status

          if (prevStatus && prevStatus !== currentStatus) {
            // Status changed - add appropriate message
            if (currentStatus === "CONFIRMED") {
              addMessage("restaurant", "Nhà hàng đã xác nhận yêu cầu", "order", order.id, currentStatus)
            } else if (currentStatus === "CANCELLED") {
              addMessage("restaurant", "Nhà hàng đã hủy yêu cầu", "order", order.id, currentStatus)
            }
          }

          // Update previous status in ref
          previousStatusesRef.current.orders[order.id] = currentStatus
        })
      }

      // Check staff call status changes
      if (staffCallsResult.success && staffCallsResult.data) {
        staffCallsResult.data.forEach((call: any) => {
          const prevStatus = previousStatusesRef.current.staffCalls[call.id]
          const currentStatus = call.status

          if (prevStatus && prevStatus !== currentStatus) {
            if (currentStatus === "ACKNOWLEDGED") {
              addMessage("restaurant", "Nhà hàng đã xác nhận yêu cầu", "staff-call", call.id, currentStatus)
            }
          }

          previousStatusesRef.current.staffCalls[call.id] = currentStatus
        })
      }

      // Check payment request status changes
      if (paymentRequestsResult.success && paymentRequestsResult.data) {
        paymentRequestsResult.data.forEach((request: any) => {
          const prevStatus = previousStatusesRef.current.paymentRequests[request.id]
          const currentStatus = request.status

          if (prevStatus && prevStatus !== currentStatus) {
            if (currentStatus === "PROCESSING") {
              addMessage("restaurant", "Nhà hàng đã xác nhận yêu cầu", "payment-call", request.id, currentStatus)
            }
          }

          previousStatusesRef.current.paymentRequests[request.id] = currentStatus
        })
      }

      // Save statuses to localStorage after processing
      saveStatusesToStorage()
    } catch (error) {
      console.error("Error checking status changes:", error)
    }
  }, [tableNumber, addMessage, storageKey, statusStorageKey, saveStatusesToStorage])

  // Start polling for status changes (only after initialization)
  useEffect(() => {
    if (!isInitialized) return

    // Initial check
    checkStatusChanges()

    // Poll every 5 seconds
    pollingRef.current = setInterval(checkStatusChanges, 5000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [checkStatusChanges, isInitialized])

  // Public method to add customer messages (called from other components)
  const addOrderMessage = useCallback((orderItems: Array<{ name: string; quantity: number }>, orderId: number) => {
    const itemsList = orderItems.map(item => `${item.name} x${item.quantity}`).join(", ")
    addMessage("customer", `Đã gọi món: ${itemsList}`, "order", orderId, "PENDING")
    
    // Add auto-reply
    setTimeout(() => {
      addMessage("restaurant", "Nhà hàng đã nhận được yêu cầu", "order", orderId)
    }, 500)

    // Track the order status using ref
    previousStatusesRef.current.orders[orderId] = "PENDING"
    saveStatusesToStorage()
  }, [addMessage, saveStatusesToStorage])

  const addStaffCallMessage = useCallback((reason: string, callId: number) => {
    addMessage("customer", `Gọi nhân viên: ${reason}`, "staff-call", callId, "PENDING")
    
    // Add auto-reply
    setTimeout(() => {
      addMessage("restaurant", "Nhà hàng đã nhận được yêu cầu", "staff-call", callId)
    }, 500)

    // Track the staff call status using ref
    previousStatusesRef.current.staffCalls[callId] = "PENDING"
    saveStatusesToStorage()
  }, [addMessage, saveStatusesToStorage])

  const addPaymentCallMessage = useCallback((paymentMethod: string, requestId: number) => {
    addMessage("customer", `Yêu cầu thanh toán: ${paymentMethod}`, "payment-call", requestId, "PENDING")
    
    // Add auto-reply
    setTimeout(() => {
      addMessage("restaurant", "Nhà hàng đã nhận được yêu cầu", "payment-call", requestId)
    }, 500)

    // Track the payment request status using ref
    previousStatusesRef.current.paymentRequests[requestId] = "PENDING"
    saveStatusesToStorage()
  }, [addMessage, saveStatusesToStorage])

  // Expose methods globally for other components to use
  useEffect(() => {
    // Store methods on window for global access
    (window as any).__chatBubble = {
      addOrderMessage,
      addStaffCallMessage,
      addPaymentCallMessage
    }

    return () => {
      delete (window as any).__chatBubble
    }
  }, [addOrderMessage, addStaffCallMessage, addPaymentCallMessage])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  }

  const getCategoryIcon = (category: ChatMessage["category"]) => {
    switch (category) {
      case "order":
        return "🍽️"
      case "staff-call":
        return "🔔"
      case "payment-call":
        return "💳"
      default:
        return "💬"
    }
  }

  return (
    <>
      {/* Chat Bubble Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
        aria-label={isOpen ? "Đóng chat" : "Mở chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
        {!isOpen && messages.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
            {messages.length}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-112 w-80 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
              <h3 className="font-semibold text-primary-foreground">
                Tin nhắn - Bàn {tableNumber}
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              aria-label="Đóng chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Area */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Chưa có tin nhắn nào
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "customer" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 ${
                      message.type === "customer"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-sm">
                        {getCategoryIcon(message.category)}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`mt-1 text-xs ${
                            message.type === "customer"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-muted/30 px-4 py-3">
            <p className="text-center text-xs text-muted-foreground">
              Tin nhắn tự động từ nhà hàng
            </p>
          </div>
        </div>
      )}
    </>
  )
}
