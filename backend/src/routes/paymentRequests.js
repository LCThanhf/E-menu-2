const express = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware, staffMiddleware } = require('../middleware/auth')

const router = express.Router()

// ============================================
// Get All Payment Requests (Staff/Admin)
// GET /api/payment-requests
// ============================================
router.get('/', authMiddleware, staffMiddleware, async (req, res) => {
  try {
    const { status, tableId } = req.query

    const paymentRequests = await prisma.paymentRequest.findMany({
      where: {
        ...(status && { status }),
        ...(tableId && { tableId: parseInt(tableId) }),
      },
      include: {
        table: {
          select: { id: true, tableNumber: true, tableName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      success: true,
      data: paymentRequests,
    })
  } catch (error) {
    console.error('Get payment requests error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Get Pending Payment Requests (Staff/Admin)
// GET /api/payment-requests/pending
// ============================================
router.get('/pending', authMiddleware, staffMiddleware, async (req, res) => {
  try {
    const paymentRequests = await prisma.paymentRequest.findMany({
      where: { status: 'PENDING' },
      include: {
        table: {
          select: { id: true, tableNumber: true, tableName: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    res.json({
      success: true,
      data: paymentRequests,
    })
  } catch (error) {
    console.error('Get pending payment requests error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Create Payment Request (Customer)
// POST /api/payment-requests
// ============================================
router.post('/', async (req, res) => {
  try {
    const { tableNumber, customerName, paymentMethod } = req.body

    if (!tableNumber || !customerName || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Table number, customer name, and payment method are required',
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

    const paymentRequest = await prisma.paymentRequest.create({
      data: {
        tableId: table.id,
        customerName,
        paymentMethod,
      },
      include: {
        table: {
          select: { id: true, tableNumber: true, tableName: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      message: 'Payment request submitted successfully',
      data: paymentRequest,
    })
  } catch (error) {
    console.error('Create payment request error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Update Payment Request Status (Staff/Admin)
// PUT /api/payment-requests/:id
// ============================================
router.put('/:id', authMiddleware, staffMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
      })
    }

    const paymentRequest = await prisma.paymentRequest.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        table: {
          select: { id: true, tableNumber: true, tableName: true },
        },
      },
    })

    // If payment is completed, update table status to AVAILABLE
    if (status === 'COMPLETED') {
      await prisma.table.update({
        where: { id: paymentRequest.tableId },
        data: { status: 'AVAILABLE' },
      })
    }

    res.json({
      success: true,
      message: 'Payment request updated successfully',
      data: paymentRequest,
    })
  } catch (error) {
    console.error('Update payment request error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Delete Payment Request (Admin only)
// DELETE /api/payment-requests/:id
// ============================================
router.delete('/:id', authMiddleware, staffMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    await prisma.paymentRequest.delete({
      where: { id: parseInt(id) },
    })

    res.json({
      success: true,
      message: 'Payment request deleted successfully',
    })
  } catch (error) {
    console.error('Delete payment request error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Payment request not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

module.exports = router
