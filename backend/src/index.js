import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'path'
import authRoutes from './routes/auth.js'
import projectRoutes from './routes/projects.js'
import clipRoutes from './routes/clips.js'
import mediaRoutes from './routes/media.js'
import effectsRoutes from './routes/effects.js'
import exportRoutes from './routes/export.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/api/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Database setup
const mongoURI = process.env.DATABASE_URL
if (!mongoURI) {
  console.error('[v0] Error: DATABASE_URL is not defined in .env file')
  process.exit(1)
}

mongoose.connect(mongoURI)
  .then(() => console.log('[v0] Connected to MongoDB successfully'))
  .catch((err) => {
    console.error('[v0] MongoDB connection error:', err)
    process.exit(1)
  })

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/clips', clipRoutes)
app.use('/api/media', mediaRoutes)
app.use('/api/effects', effectsRoutes)
app.use('/api/export', exportRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[v0] Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  })
})

app.listen(PORT, () => {
  console.log(`[v0] Backend server running on http://localhost:${PORT}`)
})
