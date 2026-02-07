const express = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware, staffMiddleware } = require('../middleware/auth')

const router = express.Router()

// Generate unique order number
const generateOrderNumber = () => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `ORD-${dateStr}-${random}`
}

// ============================================
// Get All Orders (Staff/Admin)
// GET /api/orders
// ============================================
router.get('/', async (req, res) => {
  try {
    const { status, tableId, date } = req.query

    const where = {
      ...(status && { status }),
      ...(tableId && { tableId: parseInt(tableId) }),
      ...(date && {
        createdAt: {
          gte: new Date(date),
          lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
        },
      }),
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: {
          select: { id: true, tableNumber: true, tableName: true },
        },
        orderItems: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Get Orders by Table Number (For Customer)
// GET /api/orders/table/:tableNumber
// ============================================
router.get('/table/:tableNumber', async (req, res) => {
  try {
    const { tableNumber } = req.params

    const table = await prisma.table.findUnique({
      where: { tableNumber },
    })

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      })
    }

    const orders = await prisma.order.findMany({
      where: {
        tableId: table.id,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
      include: {
        orderItems: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    console.error('Get table orders error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Get Order by ID
// GET /api/orders/:id
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        table: {
          select: { id: true, tableNumber: true, tableName: true },
        },
        orderItems: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true, image: true, category: true },
            },
          },
        },
      },
    })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    res.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Create Order (Customer)
// POST /api/orders
// ============================================
router.post('/', async (req, res) => {
  try {
    const { tableNumber, customerName, items, notes } = req.body

    if (!tableNumber || !customerName || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Table number, customer name, and items are required',
      })
    }

    // Find table
    const table = await prisma.table.findUnique({
      where: { tableNumber },
    })

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      })
    }

    // Get menu items to calculate prices
    const menuItemIds = items.map((item) => item.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
    })

    const menuItemMap = new Map(menuItems.map((item) => [item.id, item]))

    // Calculate total and prepare order items
    let totalAmount = 0
    const orderItemsData = items.map((item) => {
      const menuItem = menuItemMap.get(item.menuItemId)
      if (!menuItem) {
        throw new Error(`Menu item ${item.menuItemId} not found`)
      }
      const subtotal = menuItem.price * item.quantity
      totalAmount += subtotal
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        itemName: menuItem.name, // Store item name at time of order
        notes: item.notes,
      }
    })

    // Create order with order items
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        tableId: table.id,
        customerName,
        totalAmount,
        notes,
        orderItems: {
          create: orderItemsData,
        },
      },
      include: {
        table: {
          select: { id: true, tableNumber: true, tableName: true },
        },
        orderItems: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true, image: true },
            },
          },
        },
      },
    })

    // Update table status to OCCUPIED
    await prisma.table.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED' },
    })

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    })
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
})

// ============================================
// Update Order Status (Staff/Admin)
// PUT /api/orders/:id
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        table: {
          select: { id: true, tableNumber: true, tableName: true },
        },
        orderItems: {
          include: {
            menuItem: {
              select: { id: true, name: true, price: true, image: true },
            },
          },
        },
      },
    })

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    })
  } catch (error) {
    console.error('Update order error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Delete Order
// DELETE /api/orders/:id
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Delete the order (order items will be deleted automatically due to onDelete: Cascade)
    await prisma.order.delete({
      where: { id: parseInt(id) },
    })

    res.json({
      success: true,
      message: 'Order deleted successfully',
    })
  } catch (error) {
    console.error('Delete order error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

module.exports = router
