const express = require('express')
const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const { generateToken, authMiddleware } = require('../middleware/auth')

const router = express.Router()

// ============================================
// Admin Login
// POST /api/auth/admin/login
// ============================================
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    })

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      })
    }

    const token = generateToken({
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: 'admin',
    })

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: 'admin',
        },
      },
    })
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Admin Register
// POST /api/auth/admin/register
// ============================================
// Verify email exists (for forgot password)
router.post('/admin/verify-email', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập email'
      })
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      })
    }

    res.json({
      success: true,
      message: 'Email hợp lệ',
      data: {
        email: admin.email,
        fullName: admin.fullName
      }
    })
  } catch (error) {
    console.error('Verify email error:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    })
  }
})

// Reset password
router.post('/admin/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body

    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      })
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống'
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.admin.update({
      where: { email },
      data: { password: hashedPassword }
    })

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    })
  }
})

router.post('/admin/register', async (req, res) => {
  try {
    const { email, password, fullName } = req.body

    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required',
      })
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    })

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được đăng ký',
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
      },
    })

    // Generate token
    const token = generateToken({
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: 'admin',
    })

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        token,
        user: {
          id: admin.id,
          email: admin.email,
          fullName: admin.fullName,
          role: 'admin',
        },
      },
    })
  } catch (error) {
    console.error('Admin register error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

// ============================================
// Get Current User
// GET /api/auth/me
// ============================================
router.get('/me', authMiddleware, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    })
  }
})

module.exports = router
