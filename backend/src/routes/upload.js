const express = require('express')
const multer = require('multer')
const cloudinary = require('../lib/cloudinary')

const router = express.Router()

// Configure multer to use memory storage (buffer) instead of disk
// This avoids writing temp files on ephemeral filesystems like Render
const storage = multer.memoryStorage()

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false)
  }
}

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
})

// ============================================
// Upload Image to Cloudinary
// POST /api/upload/image
// ============================================
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      })
    }

    // Upload buffer to Cloudinary using a stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'emenu/menu-items',
          resource_type: 'image',
          // Auto-optimize: serve best format & quality
          transformation: [
            { quality: 'auto', fetch_format: 'auto' }
          ],
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      // Pipe the buffer into the upload stream
      uploadStream.end(req.file.buffer)
    })

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: req.file.originalname,
        size: req.file.size,
        width: result.width,
        height: result.height,
      },
    })
  } catch (error) {
    console.error('Upload image error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    })
  }
})

// ============================================
// Delete Image from Cloudinary
// DELETE /api/upload/image
// ============================================
router.delete('/image', async (req, res) => {
  try {
    const { publicId } = req.body

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: 'Public ID is required',
      })
    }

    await cloudinary.uploader.destroy(publicId)

    res.json({
      success: true,
      message: 'Image deleted successfully',
    })
  } catch (error) {
    console.error('Delete image error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
    })
  }
})

// Error handling for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB',
      })
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }
  
  if (err.message) {
    return res.status(400).json({
      success: false,
      message: err.message,
    })
  }
  
  next(err)
})

module.exports = router
