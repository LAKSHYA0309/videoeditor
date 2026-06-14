import express from 'express'
import { nanoid } from 'nanoid'
import crypto from 'crypto'
import { User, Session as SessionTable } from '../db/models.js'

const router = express.Router()

// Hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Generate session token
function generateSessionToken() {
  return nanoid(32)
}

// Middleware to get session
export async function getSession(req) {
  const token = req.cookies?.sessionToken || req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null

  const session = await SessionTable.findOne({ id: token })

  if (!session || new Date(session.expiresAt) < new Date()) {
    return null
  }

  const userData = await User.findOne({ id: session.userId })

  return {
    user: userData,
    sessionToken: token
  }
}

// Sign up
router.post('/sign-up', async (req, res) => {
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Check if user exists
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Create user
    const userId = nanoid()
    const hashedPassword = hashPassword(password)

    const newUser = await User.create({
      id: userId,
      email,
      name: name || '',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Create session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await SessionTable.create({
      id: sessionToken,
      userId,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.json({
      user: { id: userId, email, name: name || '' },
      sessionToken
    })
  } catch (error) {
    console.error('[v0] Sign up error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Sign in
router.post('/sign-in', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' })
    }

    // Find user
    const userData = await User.findOne({ email })

    if (!userData) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Create session
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    await SessionTable.create({
      id: sessionToken,
      userId: userData.id,
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name
      },
      sessionToken
    })
  } catch (error) {
    console.error('[v0] Sign in error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get session
router.get('/session', async (req, res) => {
  try {
    const sess = await getSession(req)
    if (!sess) {
      return res.json({ user: null })
    }
    res.json(sess)
  } catch (error) {
    console.error('[v0] Get session error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Sign out
router.post('/sign-out', async (req, res) => {
  try {
    const token = req.cookies?.sessionToken || req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      // Delete session from DB
      await SessionTable.deleteOne({ id: token })
    }
    res.json({ success: true })
  } catch (error) {
    console.error('[v0] Sign out error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
