const express = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware, staffMiddleware } = require('../middleware/auth')

const router = express.Router()

// ============================================
// Get All Staff Calls (Staff/Admin)
// GET /api/staff-calls
// ============================================
router.get('/', authMiddleware, staffMiddleware, async (req, res) => {
  try {
    const { status, tableId } = req.query

    const staffCalls = await prisma.staffCall.findMany({
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
      data: staffCalls,
    })
  } catch (error) {
    console.error('Get staff calls error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Get Pending Staff Calls (Staff/Admin)
// GET /api/staff-calls/pending
// ============================================
router.get('/pending', authMiddleware, staffMiddleware, async (req, res) => {
  try {
    const staffCalls = await prisma.staffCall.findMany({
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
      data: staffCalls,
    })
  } catch (error) {
    console.error('Get pending staff calls error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Create Staff Call (Customer)
// POST /api/staff-calls
// ============================================
router.post('/', async (req, res) => {
  try {
    const { tableNumber, customerName, reason } = req.body

    if (!tableNumber || !customerName || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Table number, customer name, and reason are required',
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

    const staffCall = await prisma.staffCall.create({
      data: {
        tableId: table.id,
        customerName,
        reason,
      },
      include: {
        table: {
          select: { id: true, tableNumber: true, tableName: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      message: 'Staff call submitted successfully',
      data: staffCall,
    })
  } catch (error) {
    console.error('Create staff call error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Update Staff Call Status (Staff/Admin)
// PUT /api/staff-calls/:id
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

    const staffCall = await prisma.staffCall.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        table: {
          select: { id: true, tableNumber: true, tableName: true },
        },
      },
    })

    res.json({
      success: true,
      message: 'Staff call updated successfully',
      data: staffCall,
    })
  } catch (error) {
    console.error('Update staff call error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Staff call not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Delete Staff Call (Admin only)
// DELETE /api/staff-calls/:id
// ============================================
router.delete('/:id', authMiddleware, staffMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    await prisma.staffCall.delete({
      where: { id: parseInt(id) },
    })

    res.json({
      success: true,
      message: 'Staff call deleted successfully',
    })
  } catch (error) {
    console.error('Delete staff call error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Staff call not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

module.exports = router
