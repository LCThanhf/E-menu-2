require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())

// Import routes
const categoryRoutes = require('./routes/categories')
const menuItemRoutes = require('./routes/menuItems')
const tableRoutes = require('./routes/tables')
const orderRoutes = require('./routes/orders')
const staffCallRoutes = require('./routes/staffCalls')
const paymentRequestRoutes = require('./routes/paymentRequests')
const authRoutes = require('./routes/auth')

// API Routes
app.use('/api/categories', categoryRoutes)
app.use('/api/menu-items', menuItemRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/staff-calls', staffCallRoutes)
app.use('/api/payment-requests', paymentRequestRoutes)
app.use('/api/auth', authRoutes)

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'E-Menu Backend API is running',
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`)
  console.log(`📡 API Health: http://localhost:${PORT}/api/health`)
})
