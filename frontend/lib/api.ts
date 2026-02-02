const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Generic fetch wrapper with error handling
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const result = await response.json()
    
    if (!response.ok) {
      return {
        success: false,
        message: result.message || 'Something went wrong',
      }
    }

    return result
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      message: 'Không thể kết nối đến server',
    }
  }
}

// ============================================
// Categories API
// ============================================
export async function getCategories() {
  return fetchAPI<any[]>('/categories')
}

// ============================================
// Menu Items API
// ============================================
export async function getMenuItems(category?: string, search?: string) {
  const params = new URLSearchParams()
  if (category && category !== 'all') params.append('category', category)
  if (search) params.append('search', search)
  
  const query = params.toString() ? `?${params.toString()}` : ''
  return fetchAPI<any[]>(`/menu-items${query}`)
}

export async function getMenuItem(id: number) {
  return fetchAPI<any>(`/menu-items/${id}`)
}

// ============================================
// Tables API
// ============================================
export async function getTableByNumber(tableNumber: string) {
  return fetchAPI<any>(`/tables/number/${tableNumber}`)
}

// ============================================
// Orders API
// ============================================
export interface OrderItem {
  menuItemId: number
  quantity: number
  notes?: string
}

export interface CreateOrderData {
  tableNumber: string
  customerName: string
  items: OrderItem[]
  notes?: string
}

export async function createOrder(data: CreateOrderData) {
  return fetchAPI<any>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getOrdersByTable(tableNumber: string) {
  return fetchAPI<any[]>(`/orders/table/${tableNumber}`)
}

// ============================================
// Staff Calls API
// ============================================
export interface CreateStaffCallData {
  tableNumber: string
  customerName: string
  reason: string
}

export async function createStaffCall(data: CreateStaffCallData) {
  return fetchAPI<any>('/staff-calls', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ============================================
// Payment Requests API
// ============================================
export interface CreatePaymentRequestData {
  tableNumber: string
  customerName: string
  paymentMethod: string
}

export async function createPaymentRequest(data: CreatePaymentRequestData) {
  return fetchAPI<any>('/payment-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ============================================
// Auth API
// ============================================
export interface LoginData {
  email: string
  password: string
}

export async function loginAdmin(data: LoginData) {
  return fetchAPI<{ token: string; user: any }>('/auth/admin/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function verifyAdminEmail(email: string) {
  return fetchAPI<{ email: string; fullName: string }>('/auth/admin/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function resetAdminPassword(email: string, newPassword: string) {
  return fetchAPI<void>('/auth/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, newPassword }),
  })
}

export async function registerAdmin(data: LoginData & { fullName: string }) {
  return fetchAPI<{ token: string; user: any }>('/auth/admin/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function loginStaff(data: LoginData) {
  return fetchAPI<{ token: string; user: any }>('/auth/staff/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function registerStaff(data: LoginData & { fullName: string }) {
  return fetchAPI<{ token: string; user: any }>('/auth/staff/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
