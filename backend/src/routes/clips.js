import express from 'express'
import { nanoid } from 'nanoid'
import { Clip } from '../db/models.js'
import { getSession } from './auth.js'

const router = express.Router()

async function requireAuth(req, res, next) {
  const sess = await getSession(req)
  if (!sess?.user) return res.status(401).json({ error: 'Unauthorized' })
  req.user = sess.user
  next()
}

// Get clips for project
router.get('/project/:projectId', requireAuth, async (req, res) => {
  try {
    const projectClips = await Clip.find({
      projectId: req.params.projectId,
      userId: req.user.id
    })

    res.json(projectClips)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Sync clips for project (delete old, save new)
router.post('/project/:projectId/sync', requireAuth, async (req, res) => {
  try {
    const { projectId } = req.params
    const { clips } = req.body

    // Delete existing clips for this project
    await Clip.deleteMany({ projectId, userId: req.user.id })

    // Create new clips
    const createdClips = []
    for (const cl of clips) {
      const clipId = (cl.id && cl.id.startsWith('clip-')) ? nanoid() : (cl.id || nanoid())
      const newClip = await Clip.create({
        id: clipId,
        projectId,
        userId: req.user.id,
        name: cl.name,
        type: cl.type,
        url: cl.url || null,
        startTime: cl.startTime !== undefined ? cl.startTime : 0,
        trimStart: cl.trimStart !== undefined ? cl.trimStart : 0,
        endTime: cl.endTime !== undefined ? cl.endTime : (cl.duration || 0),
        duration: cl.duration || 0,
        width: cl.width || null,
        height: cl.height || null,
        position: cl.position !== undefined ? cl.position : 0,
        trackId: cl.trackId || null,
        posX: cl.posX !== undefined ? cl.posX : 0,
        posY: cl.posY !== undefined ? cl.posY : 0,
        scale: cl.scale !== undefined ? cl.scale : 100,
        rotation: cl.rotation !== undefined ? cl.rotation : 0,
        opacity: cl.opacity !== undefined ? cl.opacity : 100,
        textColor: cl.textColor || '#ffffff',
        fontSize: cl.fontSize !== undefined ? cl.fontSize : 24,
        textContent: cl.textContent || '',
        volume: cl.volume !== undefined ? cl.volume : 100,
        fadeIn: cl.fadeIn !== undefined ? cl.fadeIn : 0,
        fadeOut: cl.fadeOut !== undefined ? cl.fadeOut : 0,
        fontFamily: cl.fontFamily || 'Geist',
        align: cl.align || 'center',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      createdClips.push(newClip)
    }

    res.json(createdClips)
  } catch (error) {
    console.error('Error syncing clips:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create clip
router.post('/', requireAuth, async (req, res) => {
  try {
    const { 
      projectId, 
      name, 
      type, 
      url, 
      duration, 
      width, 
      height, 
      startTime, 
      trimStart,
      endTime, 
      position, 
      trackId,
      posX,
      posY,
      scale,
      rotation,
      opacity,
      textColor,
      fontSize,
      textContent,
      volume,
      fadeIn,
      fadeOut,
      fontFamily,
      align
    } = req.body

    const clipId = nanoid()
    const newClip = await Clip.create({
      id: clipId,
      projectId,
      userId: req.user.id,
      name,
      type,
      url: url || null,
      startTime: startTime !== undefined ? startTime : 0,
      trimStart: trimStart !== undefined ? trimStart : 0,
      endTime: endTime !== undefined ? endTime : (duration || 0),
      duration: duration || 0,
      width: width || null,
      height: height || null,
      position: position !== undefined ? position : 0,
      trackId: trackId || null,
      posX: posX !== undefined ? posX : 0,
      posY: posY !== undefined ? posY : 0,
      scale: scale !== undefined ? scale : 100,
      rotation: rotation !== undefined ? rotation : 0,
      opacity: opacity !== undefined ? opacity : 100,
      textColor: textColor || '#ffffff',
      fontSize: fontSize !== undefined ? fontSize : 24,
      textContent: textContent || '',
      volume: volume !== undefined ? volume : 100,
      fadeIn: fadeIn !== undefined ? fadeIn : 0,
      fadeOut: fadeOut !== undefined ? fadeOut : 0,
      fontFamily: fontFamily || 'Geist',
      align: align || 'center',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    res.status(201).json(newClip)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update clip
router.put('/:clipId', requireAuth, async (req, res) => {
  try {
    const { 
      startTime, 
      trimStart,
      endTime, 
      position, 
      trackId, 
      name,
      posX,
      posY,
      scale,
      rotation,
      opacity,
      textColor,
      fontSize,
      textContent,
      volume,
      fadeIn,
      fadeOut,
      fontFamily,
      align
    } = req.body

    const clip = await Clip.findOne({
      id: req.params.clipId,
      userId: req.user.id
    })

    if (!clip) return res.status(404).json({ error: 'Clip not found' })

    if (startTime !== undefined) clip.startTime = startTime
    if (trimStart !== undefined) clip.trimStart = trimStart
    if (endTime !== undefined) clip.endTime = endTime
    if (position !== undefined) clip.position = position
    if (trackId !== undefined) clip.trackId = trackId
    if (name !== undefined) clip.name = name
    if (posX !== undefined) clip.posX = posX
    if (posY !== undefined) clip.posY = posY
    if (scale !== undefined) clip.scale = scale
    if (rotation !== undefined) clip.rotation = rotation
    if (opacity !== undefined) clip.opacity = opacity
    if (textColor !== undefined) clip.textColor = textColor
    if (fontSize !== undefined) clip.fontSize = fontSize
    if (textContent !== undefined) clip.textContent = textContent
    if (volume !== undefined) clip.volume = volume
    if (fadeIn !== undefined) clip.fadeIn = fadeIn
    if (fadeOut !== undefined) clip.fadeOut = fadeOut
    if (fontFamily !== undefined) clip.fontFamily = fontFamily
    if (align !== undefined) clip.align = align
    clip.updatedAt = new Date()

    await clip.save()
    res.json(clip)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete clip
router.delete('/:clipId', requireAuth, async (req, res) => {
  try {
    const clip = await Clip.findOne({
      id: req.params.clipId,
      userId: req.user.id
    })

    if (!clip) return res.status(404).json({ error: 'Clip not found' })

    await Clip.deleteOne({ id: req.params.clipId })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
