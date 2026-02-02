const express = require('express')
const prisma = require('../lib/prisma')
const { authMiddleware, adminMiddleware } = require('../middleware/auth')

const router = express.Router()

// ============================================
// Get All Menu Items (Public)
// GET /api/menu-items
// ============================================
router.get('/', async (req, res) => {
  try {
    const { category, search, available } = req.query

    const where = {
      isActive: true,
      ...(available !== 'false' && { isAvailable: true }),
      ...(category && { category: { slug: category } }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: { id: true, slug: true, name: true },
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { name: 'asc' },
      ],
    })

    res.json({
      success: true,
      data: menuItems,
    })
  } catch (error) {
    console.error('Get menu items error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Get Menu Item by ID (Public)
// GET /api/menu-items/:id
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const menuItem = await prisma.menuItem.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: {
          select: { id: true, slug: true, name: true },
        },
      },
    })

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      })
    }

    res.json({
      success: true,
      data: menuItem,
    })
  } catch (error) {
    console.error('Get menu item error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Create Menu Item (Admin only)
// POST /api/menu-items
// ============================================
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, price, image, categoryId, isAvailable } = req.body

    if (!name || !price || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Name, price, and categoryId are required',
      })
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        name,
        description,
        price: parseInt(price),
        image,
        categoryId: parseInt(categoryId),
        isAvailable: isAvailable !== false,
      },
      include: {
        category: {
          select: { id: true, slug: true, name: true },
        },
      },
    })

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: menuItem,
    })
  } catch (error) {
    console.error('Create menu item error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Update Menu Item (Admin only)
// PUT /api/menu-items/:id
// ============================================
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, image, categoryId, isActive, isAvailable } = req.body

    const menuItem = await prisma.menuItem.update({
      where: { id: parseInt(id) },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseInt(price) }),
        ...(image !== undefined && { image }),
        ...(categoryId && { categoryId: parseInt(categoryId) }),
        ...(isActive !== undefined && { isActive }),
        ...(isAvailable !== undefined && { isAvailable }),
      },
      include: {
        category: {
          select: { id: true, slug: true, name: true },
        },
      },
    })

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem,
    })
  } catch (error) {
    console.error('Update menu item error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Delete Menu Item (Admin only)
// DELETE /api/menu-items/:id
// ============================================
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params

    await prisma.menuItem.delete({
      where: { id: parseInt(id) },
    })

    res.json({
      success: true,
      message: 'Menu item deleted successfully',
    })
  } catch (error) {
    console.error('Delete menu item error:', error)
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      })
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

module.exports = router
