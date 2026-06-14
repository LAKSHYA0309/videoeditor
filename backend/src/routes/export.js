import express from 'express'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import { v2 as cloudinary } from 'cloudinary'
import path from 'path'
import fs from 'fs'
import axios from 'axios'
import { nanoid } from 'nanoid'

// Set FFmpeg binary path
ffmpeg.setFfmpegPath(ffmpegStatic)

let isDrawtextSupported = false
ffmpeg.getAvailableFilters((err, filters) => {
  if (!err && filters && filters.drawtext) {
    isDrawtextSupported = true
    console.log('[Export Pipeline] drawtext filter is supported.')
  } else {
    console.warn('[Export Pipeline] drawtext filter is NOT supported by the active FFmpeg binary. Text clips will be skipped.')
  }
})

const router = express.Router()

// Directories
const tempDir = path.join(process.cwd(), 'uploads', 'temp')
const exportsDir = path.join(process.cwd(), 'uploads', 'exports')

// Ensure directories exist
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true })
}
if (!fs.existsSync(exportsDir)) {
  fs.mkdirSync(exportsDir, { recursive: true })
}

// Serve exports locally as static files
router.use('/downloads', express.static(exportsDir))

// Initialize Cloudinary if credentials exist
let isCloudinaryConfigured = false
if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  })
  isCloudinaryConfigured = true
  console.log('[Export Pipeline] Cloudinary configured successfully.')
} else {
  console.log('[Export Pipeline] Cloudinary not configured. Falling back to local file serving.')
}

// In-memory task tracker
const exportTasks = new Map()

// Helper: check if file has an audio stream
function checkAudioStream(filePath) {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error(`[Probe Error] Failed to probe ${filePath}:`, err.message)
        resolve(false)
        return
      }
      const hasAudio = metadata?.streams?.some(stream => stream.codec_type === 'audio')
      resolve(!!hasAudio)
    })
  })
}

// Helper: download external URL to local temp file
async function downloadFile(url, destPath) {
  const writer = fs.createWriteStream(destPath)
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  })
  response.data.pipe(writer)
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

// Helper: resolve local vs external path
async function resolveAsset(url, tempFiles) {
  if (!url) return null

  // If local static path
  if (url.startsWith('/api/uploads/')) {
    const filename = url.replace('/api/uploads/', '')
    const localPath = path.join(process.cwd(), 'uploads', filename)
    if (fs.existsSync(localPath)) {
      return localPath
    }
  }

  if (url.startsWith('http://localhost:5000/api/uploads/')) {
    const filename = url.replace('http://localhost:5000/api/uploads/', '')
    const localPath = path.join(process.cwd(), 'uploads', filename)
    if (fs.existsSync(localPath)) {
      return localPath
    }
  }

  // If already absolute local path
  if (fs.existsSync(url)) {
    return url
  }

  // Otherwise download external URL
  try {
    const ext = path.extname(new URL(url).pathname) || '.mp4'
    const tempPath = path.join(tempDir, `download-${nanoid()}${ext}`)
    console.log(`[Export Pipeline] Downloading remote asset: ${url} -> ${tempPath}`)
    await downloadFile(url, tempPath)
    tempFiles.push(tempPath)
    return tempPath
  } catch (error) {
    console.error(`[Export Pipeline] Failed to download remote asset ${url}:`, error.message)
    return null
  }
}

// Helper: find available TTF font on Linux
function getFontFile() {
  const paths = [
    '/usr/share/fonts/ubuntu/Ubuntu-R.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
    '/usr/share/fonts/liberation/LiberationSans-Regular.ttf'
  ]
  for (const p of paths) {
    if (fs.existsSync(p)) return p
  }
  // Fallback to searching any ttf in common fonts directory
  try {
    const fontDir = '/usr/share/fonts'
    if (fs.existsSync(fontDir)) {
      const findTtf = (dir) => {
        const files = fs.readdirSync(dir)
        for (const file of files) {
          const fullPath = path.join(dir, file)
          const stat = fs.statSync(fullPath)
          if (stat.isDirectory()) {
            const found = findTtf(fullPath)
            if (found) return found
          } else if (file.endsWith('.ttf')) {
            return fullPath
          }
        }
        return null
      }
      return findTtf(fontDir)
    }
  } catch (e) {
    console.error('[Export Pipeline] Error scanning fonts directory:', e.message)
  }
  return null
}

// Helper: escape text for drawtext filter
function escapeDrawText(text) {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "'\\''")
    .replace(/:/g, '\\:')
    .replace(/%/g, '\\%')
}

// Target resolution mapper
function getResolution(aspectRatio) {
  switch (aspectRatio) {
    case '9:16':
      return { width: 720, height: 1280 }
    case '1:1':
      return { width: 720, height: 720 }
    case '16:9':
    default:
      return { width: 1280, height: 720 }
  }
}

// POST: Trigger export
router.post('/video', async (req, res) => {
  const { projectId, clips, aspectRatio, duration, projectTitle } = req.body

  if (!clips || !Array.isArray(clips)) {
    return res.status(400).json({ error: 'Missing or invalid timeline clips.' })
  }

  const taskId = `export-${Date.now()}`
  exportTasks.set(taskId, {
    id: taskId,
    status: 'processing',
    progress: 0,
    url: null,
    error: null
  })

  // Start background processing
  runExportPipeline(taskId, { projectId, clips, aspectRatio, duration, projectTitle })

  res.json({
    id: taskId,
    status: 'processing',
    progress: 0
  })
})

// GET: Check status
router.get('/:id/status', (req, res) => {
  const task = exportTasks.get(req.params.id)
  if (!task) {
    return res.status(404).json({ error: 'Export task not found.' })
  }
  res.json(task)
})

// Background processing core
async function runExportPipeline(taskId, payload) {
  const { clips, aspectRatio, duration, projectTitle } = payload
  const totalDuration = Math.max(1, duration || 1)
  const resSpec = getResolution(aspectRatio)
  const tempFiles = []
  const outputFileName = `${(projectTitle || 'export').toLowerCase().replace(/[^a-z0-9]/g, '_')}-${Date.now()}.mp4`
  const localOutputPath = path.join(exportsDir, outputFileName)

  try {
    console.log(`[Export Pipeline] Starting job ${taskId} (Duration: ${totalDuration}s, Resolution: ${resSpec.width}x${resSpec.height})`)

    // Step 1: Resolve all inputs
    const visualClips = []
    const audioClips = []
    const textClips = []

    for (const cl of clips) {
      if (cl.type === 'video' || cl.type === 'image') {
        const resolvedPath = await resolveAsset(cl.url, tempFiles)
        if (resolvedPath) {
          visualClips.push({ ...cl, resolvedPath })
        } else {
          console.warn(`[Export Pipeline] Skipping clip ${cl.name || cl.id} due to unresolved path.`)
        }
      } else if (cl.type === 'audio') {
        const resolvedPath = await resolveAsset(cl.url, tempFiles)
        if (resolvedPath) {
          audioClips.push({ ...cl, resolvedPath })
        } else {
          console.warn(`[Export Pipeline] Skipping audio ${cl.name || cl.id} due to unresolved path.`)
        }
      } else if (cl.type === 'text') {
        textClips.push(cl)
      }
    }

    // Sort clips sequentially by startTime
    visualClips.sort((a, b) => a.startTime - b.startTime)
    audioClips.sort((a, b) => a.startTime - b.startTime)

    // Initialize command
    const cmd = ffmpeg()

    // Add clip inputs dynamically (indices start at 0)
    const clipInputIndexMap = new Map()
    let currentInputIndex = 0

    // Probes for audio streams in video inputs
    const hasAudioMap = new Map()

    // Add visual clip inputs
    for (const cl of visualClips) {
      cmd.input(cl.resolvedPath)
      clipInputIndexMap.set(cl.id, currentInputIndex)

      const isVideo = cl.type === 'video'
      if (isVideo) {
        cmd.inputOptions([
          `-ss ${cl.trimStart || 0}`,
          `-t ${cl.duration}`
        ])
        const hasAudio = await checkAudioStream(cl.resolvedPath)
        hasAudioMap.set(cl.id, hasAudio)
      } else {
        cmd.inputOptions([
          '-loop 1',
          `-t ${cl.duration}`
        ])
      }
      currentInputIndex++
    }

    // Add audio clip inputs
    for (const cl of audioClips) {
      cmd.input(cl.resolvedPath)
      clipInputIndexMap.set(cl.id, currentInputIndex)
      cmd.inputOptions([
        `-ss ${cl.trimStart || 0}`,
        `-t ${cl.duration}`
      ])
      currentInputIndex++
    }

    // Step 2: Build Filtergraphs
    const filterGraph = []

    // Base tracks generated purely in-graph to avoid multi-lavfi input issues
    filterGraph.push({
      filter: 'color',
      options: { c: 'black', s: `${resSpec.width}x${resSpec.height}`, d: totalDuration.toString(), r: '30' },
      outputs: 'base_v'
    })

    filterGraph.push({
      filter: 'anullsrc',
      options: { r: '44100', cl: 'stereo', d: totalDuration.toString() },
      outputs: 'base_a'
    })
    
    // VISUAL GRAPH CHAIN
    let currentVisualLabel = 'base_v'
    let filterIndex = 0

    for (const cl of visualClips) {
      const idx = clipInputIndexMap.get(cl.id)
      const inputLabel = `${idx}:v`
      const outputLabel = `v_scaled_${filterIndex}`
      const overlayLabel = `v_overlay_${filterIndex}`

      // Scale and reset PTS
      filterGraph.push({
        inputs: inputLabel,
        filter: 'scale',
        options: { w: resSpec.width, h: resSpec.height, force_original_aspect_ratio: 'decrease' },
        outputs: `v_raw_scaled_${filterIndex}`
      })

      filterGraph.push({
        inputs: `v_raw_scaled_${filterIndex}`,
        filter: 'pad',
        options: { w: resSpec.width, h: resSpec.height, x: `(ow-iw)/2`, y: `(oh-ih)/2`, color: 'black' },
        outputs: `v_padded_${filterIndex}`
      })

      filterGraph.push({
        inputs: `v_padded_${filterIndex}`,
        filter: 'setpts',
        options: 'PTS-STARTPTS',
        outputs: outputLabel
      })

      // Overlay on current visual chain
      filterGraph.push({
        inputs: [currentVisualLabel, outputLabel],
        filter: 'overlay',
        options: {
          x: 0,
          y: 0,
          enable: `between(t,${cl.startTime},${cl.endTime || cl.startTime + cl.duration})`
        },
        outputs: overlayLabel
      })

      currentVisualLabel = overlayLabel
      filterIndex++
    }

    // TEXT OVERLAYS
    const fontFile = getFontFile()
    if (textClips.length > 0 && fontFile && isDrawtextSupported) {
      console.log(`[Export Pipeline] Font path resolved for drawtext: ${fontFile}`)
      for (const cl of textClips) {
        const textEscaped = escapeDrawText(cl.textContent || 'Text')
        const fontSizeVal = cl.fontSize || 24
        const textColorVal = cl.textColor || '#ffffff'
        const outputLabel = `v_text_${filterIndex}`

        const posXVal = cl.posX || 0
        const posYVal = cl.posY || 0
        
        filterGraph.push({
          inputs: currentVisualLabel,
          filter: 'drawtext',
          options: {
            fontfile: fontFile,
            text: textEscaped,
            fontsize: fontSizeVal,
            fontcolor: textColorVal,
            x: `(w-text_w)/2 + ${posXVal}`,
            y: `(h-text_h)/2 + ${posYVal}`,
            enable: `between(t,${cl.startTime},${cl.endTime || cl.startTime + cl.duration})`
          },
          outputs: outputLabel
        })

        currentVisualLabel = outputLabel
        filterIndex++
      }
    } else if (textClips.length > 0) {
      if (!isDrawtextSupported) {
        console.warn('[Export Pipeline] Text clips were present, but the active FFmpeg binary does not support drawtext. Skipping text rendering.')
      } else {
        console.warn('[Export Pipeline] Text clips were present, but no system TTF fonts were detected. Skipping text rendering.')
      }
    }

    // AUDIO GRAPH MIXING
    const delayedAudioLabels = []

    // 1. Collect video clip audio streams
    for (const cl of visualClips) {
      if (cl.type === 'video' && hasAudioMap.get(cl.id)) {
        const idx = clipInputIndexMap.get(cl.id)
        const volumeVal = (cl.volume !== undefined ? cl.volume : 100) / 100
        const delayMs = Math.round(cl.startTime * 1000)
        const audioLabel = `a_trimmed_${idx}`
        const delayLabel = `a_delayed_${idx}`

        filterGraph.push({
          inputs: `${idx}:a`,
          filter: 'volume',
          options: volumeVal.toString(),
          outputs: audioLabel
        })

        filterGraph.push({
          inputs: audioLabel,
          filter: 'adelay',
          options: `${delayMs}|${delayMs}`,
          outputs: delayLabel
        })

        delayedAudioLabels.push(delayLabel)
      }
    }

    // 2. Collect audio track clips
    for (const cl of audioClips) {
      const idx = clipInputIndexMap.get(cl.id)
      const volumeVal = (cl.volume !== undefined ? cl.volume : 100) / 100
      const delayMs = Math.round(cl.startTime * 1000)
      const audioLabel = `a_trimmed_${idx}`
      const delayLabel = `a_delayed_${idx}`

      filterGraph.push({
        inputs: `${idx}:a`,
        filter: 'volume',
        options: volumeVal.toString(),
        outputs: audioLabel
      })

      filterGraph.push({
        inputs: audioLabel,
        filter: 'adelay',
        options: `${delayMs}|${delayMs}`,
        outputs: delayLabel
      })

      delayedAudioLabels.push(delayLabel)
    }

    // 3. Mix audio streams with base audio (base_a)
    let finalAudioLabel = 'base_a'
    if (delayedAudioLabels.length > 0) {
      finalAudioLabel = 'a_mixed'
      filterGraph.push({
        inputs: ['base_a', ...delayedAudioLabels],
        filter: 'amix',
        options: {
          inputs: delayedAudioLabels.length + 1,
          duration: 'first',
          dropout_transition: 0
        },
        outputs: finalAudioLabel
      })
    }

    // Apply Filtergraph
    cmd.complexFilter(filterGraph)

    // Map outputs
    cmd.map(currentVisualLabel)
    cmd.map(finalAudioLabel)

    // Output settings
    cmd.output(localOutputPath)
    cmd.outputOptions([
      '-c:v libx264',
      '-pix_fmt yuv420p',
      '-preset fast',
      '-crf 23',
      '-c:a aac',
      '-b:a 192k',
      '-y' // overwrite
    ])

    // Log the exact FFmpeg command line on start
    cmd.on('start', (commandLine) => {
      console.log(`[Export Pipeline] Spawned FFmpeg command: ${commandLine}`)
    })

    // Progress updates
    cmd.on('progress', (progress) => {
      if (progress.percent !== undefined) {
        const pct = Math.min(99, Math.round(progress.percent))
        console.log(`[Export Pipeline] Progress for job ${taskId}: ${pct}%`)
        const task = exportTasks.get(taskId)
        if (task) {
          task.progress = pct
          exportTasks.set(taskId, task)
        }
      } else if (progress.timemark) {
        const parts = progress.timemark.split(':')
        const secs = (parseFloat(parts[0]) * 3600) + (parseFloat(parts[1]) * 60) + parseFloat(parts[2])
        const pct = Math.min(99, Math.round((secs / totalDuration) * 100))
        console.log(`[Export Pipeline] Progress for job ${taskId} (calculated): ${pct}%`)
        const task = exportTasks.get(taskId)
        if (task) {
          task.progress = pct
          exportTasks.set(taskId, task)
        }
      }
    })

    // Execute compilation
    await new Promise((resolve, reject) => {
      cmd.on('end', resolve)
      cmd.on('error', reject)
      cmd.run()
    })

    console.log(`[Export Pipeline] Video rendering complete for job ${taskId}`)

    // Step 3: Handle file uploads
    let downloadUrl = `/api/export/downloads/${outputFileName}`

    if (isCloudinaryConfigured) {
      try {
        console.log(`[Export Pipeline] Uploading to Cloudinary for job ${taskId}...`)
        const result = await cloudinary.uploader.upload(localOutputPath, {
          resource_type: 'video',
          folder: 'exports'
        })
        console.log(`[Export Pipeline] Cloudinary upload successful: ${result.secure_url}`)
        downloadUrl = result.secure_url

        try {
          fs.unlinkSync(localOutputPath)
        } catch (e) {
          console.error('[Export Pipeline] Error deleting local output file:', e.message)
        }
      } catch (err) {
        console.error('[Export Pipeline] Cloudinary upload failed. Falling back to local static URL:', err.message)
      }
    }

    // Set task to complete
    exportTasks.set(taskId, {
      id: taskId,
      status: 'complete',
      progress: 100,
      url: downloadUrl,
      error: null
    })

  } catch (error) {
    console.error(`[Export Pipeline] Critical error in job ${taskId}:`, error.message)
    exportTasks.set(taskId, {
      id: taskId,
      status: 'failed',
      progress: 0,
      url: null,
      error: error.message || 'Error occurred during export rendering'
    })
  } finally {
    console.log(`[Export Pipeline] Cleaning up temporary files for job ${taskId}...`)
    for (const f of tempFiles) {
      try {
        if (fs.existsSync(f)) {
          fs.unlinkSync(f)
        }
      } catch (e) {
        console.error(`[Export Pipeline] Failed to delete temp file ${f}:`, e.message)
      }
    }
  }
}

export default router
