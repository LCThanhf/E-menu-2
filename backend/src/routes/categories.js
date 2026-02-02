const express = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')

const router = express.Router()

// ============================================
// Get All Categories (Public)
// GET /api/categories
// ============================================
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    })

    res.json({
      success: true,
      data: categories,
    })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Get Category by ID (Public)
// GET /api/categories/:id
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        menuItems: {
          where: { isActive: true, isAvailable: true },
        },
      },
    })

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      })
    }

    res.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error('Get category error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Create Category (Admin only)
// POST /api/categories
// ============================================
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { slug, name, sortOrder } = req.body

    if (!slug || !name) {
      return res.status(400).json({
        success: false,
        message: 'Slug and name are required',
      })
    }

    const category = await prisma.category.create({
      data: {
        slug,
        name,
        sortOrder: sortOrder || 0,
      },
    })

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    })
  } catch (error) {
    console.error('Create category error:', error)
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Category slug already exists',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Update Category (Admin only)
// PUT /api/categories/:id
// ============================================
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { slug, name, sortOrder, isActive } = req.body

    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        ...(slug && { slug }),
        ...(name && { name }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    })
  } catch (error) {
    console.error('Update category error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Delete Category (Admin only)
// DELETE /api/categories/:id
// ============================================
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    await prisma.category.delete({
      where: { id: parseInt(id) },
    })

    res.json({
      success: true,
      message: 'Category deleted successfully',
    })
  } catch (error) {
    console.error('Delete category error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

module.exports = router
