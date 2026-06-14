import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { nanoid } from 'nanoid'
import { MediaAsset } from '../db/models.js'
import { getSession } from './auth.js'

const router = express.Router()

// Ensure uploads directory exists
const uploadDir = 'uploads'
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage })

async function requireAuth(req, res, next) {
  const sess = await getSession(req)
  if (!sess?.user) return res.status(401).json({ error: 'Unauthorized' })
  req.user = sess.user
  next()
}

// Get all media assets for a project
router.get('/project/:projectId', requireAuth, async (req, res) => {
  try {
    const assets = await MediaAsset.find({
      projectId: req.params.projectId,
      userId: req.user.id
    })
    res.json(assets)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Upload media asset
router.post('/', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { projectId, type } = req.body
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const url = `/api/uploads/${req.file.filename}`
    const assetId = nanoid()

    const newAsset = await MediaAsset.create({
      id: assetId,
      userId: req.user.id,
      projectId,
      name: req.file.originalname,
      type, // 'video', 'audio', 'image'
      url,
      fileSize: req.file.size,
      duration: type === 'audio' ? 12 : type === 'video' ? 8 : 6,
    })

    res.status(201).json(newAsset)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete media asset
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const asset = await MediaAsset.findOne({
      id: req.params.id,
      userId: req.user.id
    })

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Attempt to delete physical file
    try {
      const filename = asset.url.split('/api/uploads/')[1]
      if (filename) {
        const filePath = path.join(uploadDir, filename)
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
        }
      }
    } catch (err) {
      console.error('Failed to delete physical file:', err)
    }

    await MediaAsset.deleteOne({ id: req.params.id })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
