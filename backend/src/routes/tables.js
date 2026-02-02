const express = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware, staffMiddleware, adminMiddleware } = require('../middleware/auth')

const router = express.Router()

// ============================================
// Get All Tables (Staff/Admin)
// GET /api/tables
// ============================================
router.get('/', async (req, res) => {
  try {
    const { status } = req.query

    const tables = await prisma.table.findMany({
      where: {
        ...(status && { status }),
      },
      orderBy: { tableNumber: 'asc' },
    })

    res.json({
      success: true,
      data: tables,
    })
  } catch (error) {
    console.error('Get tables error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Get Table by Number (Public - for customer access)
// GET /api/tables/number/:tableNumber
// ============================================
router.get('/number/:tableNumber', async (req, res) => {
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

    res.json({
      success: true,
      data: table,
    })
  } catch (error) {
    console.error('Get table error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Get Table by ID
// GET /api/tables/:id
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const table = await prisma.table.findUnique({
      where: { id: parseInt(id) },
      include: {
        orders: {
          where: {
            status: { notIn: ['COMPLETED', 'CANCELLED'] },
          },
          include: {
            orderItems: {
              include: {
                menuItem: true,
              },
            },
          },
        },
        staffCalls: {
          where: { status: 'PENDING' },
        },
        paymentRequests: {
          where: { status: 'PENDING' },
        },
      },
    })

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      })
    }

    res.json({
      success: true,
      data: table,
    })
  } catch (error) {
    console.error('Get table error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Update Table Status (Staff/Admin)
// PUT /api/tables/:id
// ============================================
router.put('/:id', authMiddleware, staffMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { status, tableName } = req.body

    const table = await prisma.table.update({
      where: { id: parseInt(id) },
      data: {
        ...(status && { status }),
        ...(tableName && { tableName }),
      },
    })

    res.json({
      success: true,
      message: 'Table updated successfully',
      data: table,
    })
  } catch (error) {
    console.error('Update table error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Create Table (Admin only)
// POST /api/tables
// ============================================
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { tableNumber, tableName } = req.body

    if (!tableNumber || !tableName) {
      return res.status(400).json({
        success: false,
        message: 'Table number and name are required',
      })
    }

    const table = await prisma.table.create({
      data: {
        tableNumber,
        tableName,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: table,
    })
  } catch (error) {
    console.error('Create table error:', error)
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Delete Table (Admin only)
// DELETE /api/tables/:id
// ============================================
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    await prisma.table.delete({
      where: { id: parseInt(id) },
    })

    res.json({
      success: true,
      message: 'Table deleted successfully',
    })
  } catch (error) {
    console.error('Delete table error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

module.exports = router
