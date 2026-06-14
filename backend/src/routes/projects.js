import express from 'express'
import { nanoid } from 'nanoid'
import { Project, Clip } from '../db/models.js'
import { getSession } from './auth.js'

const router = express.Router()

// Middleware to require auth
async function requireAuth(req, res, next) {
  const sess = await getSession(req)
  if (!sess?.user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  req.user = sess.user
  next()
}

// Get all projects for user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userProjects = await Project.find({ userId: req.user.id })
    res.json(userProjects)
  } catch (error) {
    console.error('[v0] Get projects error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single project
router.get('/:projectId', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({
      id: req.params.projectId,
      userId: req.user.id
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Get clips for this project
    const projectClips = await Clip.find({ projectId: req.params.projectId })

    res.json({
      ...project.toObject(),
      clips: projectClips
    })
  } catch (error) {
    console.error('[v0] Get project error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create project
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, description } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title required' })
    }

    const projectId = nanoid()
    const now = new Date()

    const newProject = await Project.create({
      id: projectId,
      userId: req.user.id,
      title,
      description: description || null,
      thumbnail: null,
      duration: 0,
      createdAt: now,
      updatedAt: now,
    })

    res.status(201).json(newProject)
  } catch (error) {
    console.error('[v0] Create project error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update project
router.put('/:projectId', requireAuth, async (req, res) => {
  try {
    const { title, description, thumbnail, duration } = req.body

    // Check ownership
    const project = await Project.findOne({
      id: req.params.projectId,
      userId: req.user.id
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (title !== undefined) project.title = title
    if (description !== undefined) project.description = description
    if (thumbnail !== undefined) project.thumbnail = thumbnail
    if (duration !== undefined) project.duration = duration
    project.updatedAt = new Date()

    await project.save()
    res.json(project)
  } catch (error) {
    console.error('[v0] Update project error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete project
router.delete('/:projectId', requireAuth, async (req, res) => {
  try {
    // Check ownership
    const project = await Project.findOne({
      id: req.params.projectId,
      userId: req.user.id
    })

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    // Delete associated clips
    await Clip.deleteMany({ projectId: req.params.projectId })

    // Delete project
    await Project.deleteOne({ id: req.params.projectId })

    res.json({ success: true })
  } catch (error) {
    console.error('[v0] Delete project error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
