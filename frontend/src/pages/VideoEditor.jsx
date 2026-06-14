import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, Save, Download, Play, Pause, Plus, Trash2, 
  Film, Type, Music, Sparkles, Volume2, VolumeX,
  ZoomIn, ZoomOut, ChevronRight, Eye, 
  Lock, Unlock, EyeOff, Maximize2, 
  AlignLeft, AlignCenter, AlignRight,
  Scissors, Gift, Search, HelpCircle, Zap, Sliders, ChevronLeft,
  Undo, Redo, MoreHorizontal, Headphones, Image, Languages, Square, Settings, Home
} from 'lucide-react'

export default function VideoEditor() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { sessionToken } = useAuth()

  // Project metadata
  const [projectTitle, setProjectTitle] = useState('Untitled Project')
  const [projectDuration, setProjectDuration] = useState(30) // timeline length
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Timeline & active editor state
  const [clips, setClips] = useState([])
  const [selectedClipId, setSelectedClipId] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [timelineZoom, setTimelineZoom] = useState(12) // pixels per second
  const [aspectRatio, setAspectRatio] = useState('16:9') // '16:9' | '9:16' | '1:1'
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)

  // Track lock and mute states
  const [lockedTracks, setLockedTracks] = useState([]) 
  const [mutedTracks, setMutedTracks] = useState([]) 

  // Sidebar media categorization
  const [activeTab, setActiveTab] = useState('video') // 'ai-tools' | 'video' | 'audio' | 'image' | 'subtitles' | 'text' | 'elements'
  const [showInspector, setShowInspector] = useState(false)

  // Export states
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportComplete, setExportComplete] = useState(false)
  const [exportDownloadUrl, setExportDownloadUrl] = useState(null)
  const [exportError, setExportError] = useState(null)

  // User uploaded listings (storing local object URLs)
  const [uploadedVideos, setUploadedVideos] = useState([])
  const [uploadedAudios, setUploadedAudios] = useState([])
  const [uploadedImages, setUploadedImages] = useState([])

  // Playback timer references
  const playIntervalRef = useRef(null)
  const timelineRef = useRef(null)
  const timelineScrollContainerRef = useRef(null)

  // Fetch project details on mount
  useEffect(() => {
    loadProjectData()
    return () => stopPlayback()
  }, [projectId])

  // Playback ticker loop
  useEffect(() => {
    if (isPlaying) {
      const fps = 30
      const intervalMs = 1000 / fps
      playIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= projectDuration) {
            stopPlayback()
            return 0
          }
          return prev + (1 / fps)
        })
      }, intervalMs)
    } else {
      stopPlayback()
    }
    return () => stopPlayback()
  }, [isPlaying, projectDuration])

  // Keypress Delete listener for selected clips
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedClipId && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
          const clip = clips.find(c => c.id === selectedClipId)
          if (clip && !lockedTracks.includes(clip.trackId)) {
            deleteClip(selectedClipId)
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedClipId, clips, lockedTracks])

  const stopPlayback = () => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
  }

  const loadProjectData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      })
      if (!res.ok) throw new Error('Failed to load project')
      const data = await res.json()
      setProjectTitle(data.title)
      setProjectDuration(data.duration || 30)

      if (data.clips && data.clips.length > 0) {
        setClips(data.clips)
      } else {
        // Start with a clean timeline
        setClips([])
      }

      // Load project media library assets
      const mediaRes = await fetch(`/api/media/project/${projectId}`, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      })
      if (mediaRes.ok) {
        const mediaAssets = await mediaRes.json()
        setUploadedVideos(mediaAssets.filter(a => a.type === 'video'))
        setUploadedAudios(mediaAssets.filter(a => a.type === 'audio'))
        setUploadedImages(mediaAssets.filter(a => a.type === 'image'))
      }
    } catch (error) {
      console.error('Error loading project details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Save changes to DB
  const handleSave = async (showNotification = true) => {
    setSaving(true)
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          title: projectTitle,
          duration: projectDuration
        })
      })

      const syncRes = await fetch(`/api/clips/project/${projectId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ clips })
      })

      if (!syncRes.ok) throw new Error('Failed to sync clips')
      const savedClips = await syncRes.json()
      setClips(savedClips)

      if (showNotification) {
        alert('Workspace saved successfully!')
      }
    } catch (error) {
      console.error('Error saving workspace:', error)
      if (showNotification) {
        alert('Error saving workspace. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  // Auto-save triggers on edits
  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      handleSave(false)
    }, 15000)
    return () => clearTimeout(timer)
  }, [clips, projectTitle, projectDuration])

  const selectedClip = useMemo(() => {
    return clips.find(c => c.id === selectedClipId) || null
  }, [clips, selectedClipId])

  const updateClipProperty = (clipId, key, value) => {
    setClips(prevClips => prevClips.map(clip => {
      if (clip.id === clipId) {
        const updated = { ...clip, [key]: value }
        if (key === 'startTime') {
          updated.endTime = value + clip.duration
        }
        if (key === 'duration') {
          updated.endTime = clip.startTime + value
        }
        return updated
      }
      return clip
    }))
  }

  const deleteClip = (clipId) => {
    setClips(prev => prev.filter(c => c.id !== clipId))
    if (selectedClipId === clipId) {
      setSelectedClipId(null)
      setShowInspector(false)
    }
  }

  const selectClip = (id) => {
    setSelectedClipId(id)
    if (id) {
      setShowInspector(true)
      const clip = clips.find(c => c.id === id)
      if (clip) {
        if (clip.type === 'video' || clip.type === 'image') {
          setActiveTab(clip.type)
        } else if (clip.type === 'audio') {
          setActiveTab('audio')
        } else if (clip.type === 'text') {
          setActiveTab('text')
        }
      }
    } else {
      setShowInspector(false)
    }
  }

  const handleSplitClip = () => {
    if (!selectedClipId) {
      alert("Please select a clip on the timeline first.")
      return
    }
    const clip = clips.find(c => c.id === selectedClipId)
    if (!clip) return

    if (currentTime > clip.startTime && currentTime < clip.endTime) {
      const originalEndTime = clip.endTime
      const splitPoint = currentTime
      
      const duration1 = splitPoint - clip.startTime
      const duration2 = originalEndTime - splitPoint

      const id2 = `clip-${Date.now()}-split`
      const clip2 = {
        ...clip,
        id: id2,
        name: `${clip.name.replace(" (Part 2)", "")} (Part 2)`,
        startTime: splitPoint,
        trimStart: (clip.trimStart || 0) + duration1,
        duration: duration2,
        endTime: originalEndTime,
      }

      setClips(prev => {
        const updated = prev.map(c => {
          if (c.id === clip.id) {
            return {
              ...c,
              duration: duration1,
              endTime: splitPoint
            }
          }
          return c
        })
        return [...updated, clip2]
      })
      selectClip(id2)
    } else {
      alert("Place the playhead (red needle) inside the selected clip to split it.")
    }
  }

  const handleExportModalOpen = async () => {
    setShowExportModal(true)
    setIsExporting(true)
    setExportProgress(0)
    setExportComplete(false)
    setExportDownloadUrl(null)
    setExportError(null)

    try {
      const response = await fetch('/api/export/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          projectId,
          clips,
          aspectRatio,
          duration: projectDuration,
          projectTitle
        })
      })

      if (!response.ok) {
        throw new Error('Failed to initiate video export')
      }

      const job = await response.json()
      const jobId = job.id

      // Start polling status
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/export/${jobId}/status`)
          if (!statusRes.ok) throw new Error('Failed to check export status')
          const task = await statusRes.json()

          if (task.status === 'complete') {
            clearInterval(pollInterval)
            setIsExporting(false)
            setExportComplete(true)
            setExportDownloadUrl(task.url)
          } else if (task.status === 'failed') {
            clearInterval(pollInterval)
            setIsExporting(false)
            setExportError(task.error || 'FFmpeg rendering failed.')
          } else {
            setExportProgress(task.progress || 0)
          }
        } catch (err) {
          console.error('Error polling status:', err)
          clearInterval(pollInterval)
          setIsExporting(false)
          setExportError(err.message)
        }
      }, 1500)

      window.currentExportPoll = pollInterval
    } catch (err) {
      console.error('Error starting export:', err)
      setIsExporting(false)
      setExportError(err.message)
    }
  }

  useEffect(() => {
    return () => {
      if (window.currentExportPoll) {
        clearInterval(window.currentExportPoll)
      }
    }
  }, [])

  // Add a clip from Left Sidebar
  const addClipToTimeline = (type, params) => {
    const id = `clip-${Date.now()}`
    const start = Math.round(currentTime)
    const dur = params.duration || 6
    let newClip = {
      id,
      name: params.name || `${type.toUpperCase()} Clip`,
      type: type,
      url: params.url || '',
      startTime: start,
      duration: dur,
      endTime: start + dur,
      trackId: params.trackId || (type === 'text' ? 'text' : type === 'audio' ? 'music' : 'video'),
      posX: 0,
      posY: 0,
      scale: 100,
      rotation: 0,
      opacity: 100,
      fadeIn: 0,
      fadeOut: 0,
      fontFamily: 'Geist',
      align: 'center'
    }

    if (type === 'text') {
      newClip.textContent = params.textContent || 'New Text Layer'
      newClip.textColor = params.textColor || '#ffffff'
      newClip.fontSize = 32
    } else if (type === 'audio') {
      newClip.volume = 80
    }

    setClips([...clips, newClip])
    selectClip(id)
  }

  // File system uploads
  const handleLocalUpload = async (e, fileType) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)
    formData.append('type', fileType)

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`
        },
        body: formData
      })
      if (!res.ok) throw new Error('Failed to upload media')
      const newAsset = await res.json()

      if (fileType === 'video') {
        setUploadedVideos((prev) => [newAsset, ...prev])
      } else if (fileType === 'audio') {
        setUploadedAudios((prev) => [newAsset, ...prev])
      } else if (fileType === 'image') {
        setUploadedImages((prev) => [newAsset, ...prev])
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload media asset.')
    }
  }

  // Render visual clips on the preview canvas
  const activeVisualClips = useMemo(() => {
    return clips.filter(clip => 
      (clip.type === 'video' || clip.type === 'image' || clip.type === 'text') &&
      !mutedTracks.includes(clip.trackId) &&
      currentTime >= clip.startTime &&
      currentTime <= clip.endTime
    )
  }, [clips, currentTime, mutedTracks])

  // Active audio clips for playback
  const activeAudioClips = useMemo(() => {
    return clips.filter(clip =>
      clip.type === 'audio' &&
      !mutedTracks.includes(clip.trackId) &&
      currentTime >= clip.startTime &&
      currentTime <= clip.endTime
    )
  }, [clips, currentTime, mutedTracks])

  // Drag and Drop sidebar events
  const handleDragStart = (e, asset) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(asset))
  }

  const handleDrop = (e, trackId) => {
    e.preventDefault()
    if (lockedTracks.includes(trackId)) return // Track is locked

    try {
      const assetData = e.dataTransfer.getData('text/plain')
      if (!assetData) return
      const asset = JSON.parse(assetData)

      const rect = e.currentTarget.getBoundingClientRect()
      const dropX = e.clientX - rect.left
      const calculatedDropTime = Math.max(0, dropX / timelineZoom)

      const id = `clip-${Date.now()}`
      const duration = asset.duration || 6
      const newClip = {
        id,
        name: asset.name,
        type: asset.type,
        url: asset.url,
        startTime: Math.round(calculatedDropTime),
        duration,
        endTime: Math.round(calculatedDropTime) + duration,
        trackId: trackId,
        posX: 0,
        posY: 0,
        scale: 100,
        rotation: 0,
        opacity: 100,
        fadeIn: 0,
        fadeOut: 0,
        fontFamily: 'Geist',
        align: 'center'
      }

      if (asset.type === 'text') {
        newClip.textContent = asset.textContent || 'New Text'
        newClip.textColor = '#ffffff'
        newClip.fontSize = 28
      } else if (asset.type === 'audio') {
        newClip.volume = 80
      }

      setClips([...clips, newClip])
      selectClip(id)
    } catch (err) {
      console.error('Failed to parse drag payload:', err)
    }
  }

  // Mouse drag moving timeline clips
  const handleClipMouseDown = (e, clip) => {
    if (lockedTracks.includes(clip.trackId)) return 
    e.stopPropagation()
    selectClip(clip.id)

    if (e.target.classList.contains('trim-handle')) return

    const startX = e.clientX
    const initialStart = clip.startTime

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaTime = Math.round(deltaX / timelineZoom)
      const finalStartTime = Math.max(0, initialStart + deltaTime)
      
      updateClipProperty(clip.id, 'startTime', finalStartTime)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Mouse drag trimming clip edges
  const handleResizeMouseDown = (e, clip, edge) => {
    e.stopPropagation()
    const startX = e.clientX
    const initialStartTime = clip.startTime
    const initialDuration = clip.duration

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaTime = Math.round(deltaX / timelineZoom)

      if (edge === 'left') {
        const calculatedStart = Math.max(0, initialStartTime + deltaTime)
        const maxStart = initialStartTime + initialDuration - 1 
        const finalStartTime = Math.min(calculatedStart, maxStart)
        const finalDuration = initialStartTime + initialDuration - finalStartTime
        const trimDelta = finalStartTime - initialStartTime
        const finalTrimStart = Math.max(0, (clip.trimStart || 0) + trimDelta)

        setClips(prev => prev.map(c => {
          if (c.id === clip.id) {
            return {
              ...c,
              startTime: finalStartTime,
              trimStart: finalTrimStart,
              duration: finalDuration,
              endTime: finalStartTime + finalDuration
            }
          }
          return c
        }))
      } else {
        const finalDuration = Math.max(1, initialDuration + deltaTime)
        setClips(prev => prev.map(c => {
          if (c.id === clip.id) {
            return {
              ...c,
              duration: finalDuration,
              endTime: c.startTime + finalDuration
            }
          }
          return c
        }))
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Fullscreen Preview Toggle
  const toggleFullscreen = () => {
    const previewContainer = document.getElementById('preview-viewport')
    if (!previewContainer) return
    if (!document.fullscreenElement) {
      previewContainer.requestFullscreen().catch(err => {
        console.error('Error entering fullscreen:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  // Toggle track properties
  const toggleTrackLock = (trackId) => {
    setLockedTracks(prev => 
      prev.includes(trackId) ? prev.filter(t => t !== trackId) : [...prev, trackId]
    )
  }

  const toggleTrackMute = (trackId) => {
    setMutedTracks(prev => 
      prev.includes(trackId) ? prev.filter(t => t !== trackId) : [...prev, trackId]
    )
  }

  // Auto-scroll timeline to keep playhead visible
  useEffect(() => {
    if (!isPlaying) return
    const container = timelineScrollContainerRef.current
    if (!container) return

    const needlePosition = currentTime * timelineZoom + 96
    const containerWidth = container.clientWidth
    const scrollLeft = container.scrollLeft

    // If needle is past 80% of the visible width, scroll it into view
    if (needlePosition > scrollLeft + containerWidth * 0.8) {
      container.scrollLeft = needlePosition - containerWidth * 0.2
    } else if (needlePosition < scrollLeft) {
      container.scrollLeft = needlePosition
    }
  }, [currentTime, isPlaying, timelineZoom])

  // Timeline ruler ticks scrub
  const handleTimelineScrub = (e) => {
    if (!timelineRef.current || !timelineScrollContainerRef.current) return
    const rect = timelineRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const scrollLeft = timelineScrollContainerRef.current.scrollLeft
    const scrubTime = (clickX + scrollLeft) / timelineZoom
    setCurrentTime(Math.max(0, Math.min(projectDuration, scrubTime)))
  }

  // Drag-to-scrub timeline playhead
  const handleTimelineScrubMouseDown = (e) => {
    if (!timelineRef.current || !timelineScrollContainerRef.current) return
    e.preventDefault()

    const scrub = (moveEvent) => {
      const rect = timelineRef.current.getBoundingClientRect()
      const clickX = moveEvent.clientX - rect.left
      const scrollLeft = timelineScrollContainerRef.current.scrollLeft
      const scrubTime = (clickX + scrollLeft) / timelineZoom
      setCurrentTime(Math.max(0, Math.min(projectDuration, scrubTime)))
    }

    scrub(e)

    const handleMouseMove = (moveEvent) => {
      scrub(moveEvent)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Direct canvas selection drag
  const handleCanvasClipMouseDown = (e, clip) => {
    e.stopPropagation()
    selectClip(clip.id)

    const startX = e.clientX
    const startY = e.clientY
    const initialPosX = clip.posX || 0
    const initialPosY = clip.posY || 0

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      updateClipProperty(clip.id, 'posX', initialPosX + deltaX)
      updateClipProperty(clip.id, 'posY', initialPosY + deltaY)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Direct canvas scaling (radial scale helper)
  const handleScaleMouseDown = (e, clip) => {
    e.stopPropagation()
    e.preventDefault()

    const viewport = document.getElementById('preview-viewport')
    if (!viewport) return

    const rect = viewport.getBoundingClientRect()
    const viewportCenterX = rect.left + rect.width / 2
    const viewportCenterY = rect.top + rect.height / 2
    
    const clipCenterX = viewportCenterX + (clip.posX || 0)
    const clipCenterY = viewportCenterY + (clip.posY || 0)

    const startX = e.clientX
    const startY = e.clientY
    
    const initialDistance = Math.hypot(startX - clipCenterX, startY - clipCenterY)
    const initialScale = clip.scale || 100

    const handleMouseMove = (moveEvent) => {
      const currentDistance = Math.hypot(moveEvent.clientX - clipCenterX, moveEvent.clientY - clipCenterY)
      if (initialDistance === 0) return
      
      const newScale = Math.min(300, Math.max(10, Math.round((currentDistance / initialDistance) * initialScale)))
      updateClipProperty(clip.id, 'scale', newScale)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Direct canvas rotation angle helper
  const handleRotateMouseDown = (e, clip) => {
    e.stopPropagation()
    e.preventDefault()

    const viewport = document.getElementById('preview-viewport')
    if (!viewport) return

    const rect = viewport.getBoundingClientRect()
    const viewportCenterX = rect.left + rect.width / 2
    const viewportCenterY = rect.top + rect.height / 2
    
    const clipCenterX = viewportCenterX + (clip.posX || 0)
    const clipCenterY = viewportCenterY + (clip.posY || 0)

    const startX = e.clientX
    const startY = e.clientY
    
    const initialAngleRad = Math.atan2(startY - clipCenterY, startX - clipCenterX)
    const initialRotation = clip.rotation || 0

    const handleMouseMove = (moveEvent) => {
      const currentAngleRad = Math.atan2(moveEvent.clientY - clipCenterY, moveEvent.clientX - clipCenterX)
      const deltaAngleRad = currentAngleRad - initialAngleRad
      let deltaAngleDeg = (deltaAngleRad * 180) / Math.PI
      
      let finalRotation = Math.round(initialRotation + deltaAngleDeg)
      if (finalRotation > 180) finalRotation -= 360
      if (finalRotation < -180) finalRotation += 360
      
      updateClipProperty(clip.id, 'rotation', finalRotation)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-[#fafafa] bg-grid-pattern">
        <div className="text-center space-y-4">
          <div className="size-10 mx-auto rounded-lg border-2 border-white/20 border-t-white animate-spin"></div>
          <p className="text-xs text-neutral-400 font-mono">Opening workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a] flex flex-col font-sans overflow-hidden select-none">
      
      {/* Header bar */}
      <header className="h-14 border-b border-neutral-200 bg-white flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => navigate('/dashboard')}
            className="text-2xl font-black text-neutral-800 select-none tracking-tighter cursor-pointer hover:opacity-85"
            title="Go to Dashboard"
          >
            V
          </div>
          <div className="h-5 w-[1px] bg-neutral-200" />
          
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-600">
            <span className="text-neutral-400 font-medium">Project:</span>
            {isEditingTitle ? (
              <input
                type="text"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                className="px-2 py-1 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-800 focus:outline-none focus:border-green-500 font-semibold"
                autoFocus
              />
            ) : (
              <span
                onClick={() => setIsEditingTitle(true)}
                className="hover:text-black cursor-pointer transition-colors max-w-[150px] truncate"
                title="Click to rename"
              >
                {projectTitle}
              </span>
            )}
          </div>
        </div>

        {/* Central Switcher Pill */}
        <div className="flex bg-neutral-100 p-0.5 rounded-full border border-neutral-200 text-xs font-medium text-neutral-500 shadow-sm">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="flex items-center justify-center p-1 px-3 rounded-full hover:text-black transition-all"
            title="Home Dashboard"
          >
            <Home className="w-3.5 h-3.5" />
          </button>
          <button className="bg-white text-black font-semibold shadow-sm px-4 py-1 rounded-full border border-neutral-200/50">Edit</button>
          <button className="px-3 py-1 rounded-full hover:text-black transition-all">Record</button>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <button className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors" title="Rewards">
            <Gift className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors" title="Search">
            <Search className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors" title="Help">
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Yellow upgrade button */}
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-500 text-xs font-bold text-amber-950 shadow-sm active:scale-95 transition-all">
            <Zap className="w-3.5 h-3.5 fill-amber-950" />
            <span>Upgrade</span>
          </button>

          {/* Save button */}
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700 shadow-sm active:scale-95 transition-all disabled:opacity-50"
            title="Save changes to database"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>

          {/* Green Export button */}
          <button
            onClick={() => {
              handleSave(false)
              handleExportModalOpen()
            }}
            className="flex items-center gap-1.5 px-4.5 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
            title="Export final video file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* Main Workspace layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* LEFTMOST VERTICAL MENU BAR */}
        <div className="w-16 border-r border-neutral-200 bg-white flex flex-col items-center py-4 gap-4 shrink-0 shadow-sm z-20">
          {[
            { id: 'video', label: 'Video', icon: Film },
            { id: 'audio', label: 'Audio', icon: Music },
            { id: 'image', label: 'Image', icon: Image },
            { id: 'text', label: 'Text', icon: Type },
            { id: 'elements', label: 'Elements', icon: Square },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setShowInspector(false)
                }}
                className={`w-14 py-2 rounded-xl flex flex-col items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-neutral-100 text-black font-bold border border-neutral-200 shadow-sm' 
                    : 'text-neutral-400 hover:text-black hover:bg-neutral-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-black font-bold' : 'text-neutral-400'}`} />
                <span className="text-[9px] mt-1 tracking-tight leading-none font-semibold">{tab.label}</span>
              </button>
            )
          })}
          
          <div className="mt-auto flex flex-col gap-2">
            <button 
              onClick={() => handleSave(true)}
              disabled={saving}
              className="p-2.5 rounded-xl text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
              title="Save Project"
            >
              <Save className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* LEFT DRAWER PANEL (Properties or Library) */}
        <div className="w-[320px] bg-white border-r border-neutral-200 flex flex-col h-full overflow-hidden text-left shrink-0 z-20 shadow-sm">
          
          {showInspector && selectedClip ? (
            // 1. PROPERTIES PANEL
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="p-4 flex items-center gap-2.5 border-b border-neutral-200 h-12 shrink-0 bg-neutral-50">
                <button
                  onClick={() => {
                    setShowInspector(false)
                    setSelectedClipId(null)
                  }}
                  className="p-1 rounded-lg hover:bg-neutral-200 text-neutral-600 transition-colors"
                  title="Back to Media Library"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Edit {selectedClip.type.charAt(0).toUpperCase() + selectedClip.type.slice(1)}
                </span>
                <span className="text-[11px] text-neutral-500 font-semibold truncate flex-1 text-right max-w-[120px]">
                  {selectedClip.name}
                </span>
              </div>

              <div className="p-5 flex-1 space-y-6">
                
                {/* Video settings */}
                {selectedClip.type === 'video' && (
                  <div className="space-y-5">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => alert("Script editing is active. Use timeline text layers to write script overlays.")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 text-xs font-semibold active:scale-95 transition-all shadow-sm"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Edit with Script
                      </button>
                      <button
                        onClick={() => alert("To replace, select another video from the Media Library and drag it over this clip.")}
                        className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold active:scale-95 transition-all text-center shadow-sm"
                      >
                        Replace
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setActiveTab('elements')}
                        className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold active:scale-95 transition-all text-center shadow-sm"
                      >
                        Animations
                      </button>
                      <button
                        onClick={() => alert("Color adjustments are available under filters.")}
                        className="flex-1 py-2 px-3 rounded-lg border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold active:scale-95 transition-all text-center shadow-sm"
                      >
                        Adjust
                      </button>
                    </div>

                    {/* Speed Row */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Speed
                      </label>
                      <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 justify-between gap-0.5">
                        {[
                          { label: '0.5x', value: 0.5 },
                          { label: '1x', value: 1.0 },
                          { label: '1.5x', value: 1.5 },
                          { label: '2x', value: 2.0 },
                          { label: 'Custom', value: 'custom' },
                        ].map((sp) => {
                          const clipSpeed = selectedClip.speed || 1.0
                          const isActive = sp.value === 'custom' ? ![0.5, 1.0, 1.5, 2.0].includes(clipSpeed) : clipSpeed === sp.value
                          return (
                            <button
                              key={sp.label}
                              onClick={() => {
                                if (sp.value === 'custom') {
                                  const customSpeed = parseFloat(prompt("Enter custom speed (0.1x to 10x):", "1.0"))
                                  if (customSpeed && customSpeed > 0) {
                                    updateClipProperty(selectedClip.id, 'speed', customSpeed)
                                  }
                                } else {
                                  updateClipProperty(selectedClip.id, 'speed', sp.value)
                                }
                              }}
                              className={`flex-1 py-1 rounded-md text-center text-[10px] font-bold transition-all ${
                                isActive ? 'bg-white border border-neutral-200 text-black shadow-sm' : 'text-neutral-500 hover:text-neutral-800'
                              }`}
                            >
                              {sp.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Volume setting */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Volume
                        </label>
                        <span className="text-[11px] font-mono text-neutral-700 font-bold">{selectedClip.volume !== undefined ? selectedClip.volume : 100}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateClipProperty(selectedClip.id, 'volume', (selectedClip.volume || 100) === 0 ? 100 : 0)}
                          className="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-neutral-500"
                        >
                          {(selectedClip.volume || 100) === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={selectedClip.volume !== undefined ? selectedClip.volume : 100}
                          onChange={(e) => updateClipProperty(selectedClip.id, 'volume', Number(e.target.value))}
                          className="flex-1 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                        />
                      </div>
                    </div>

                    {/* Fade toggle */}
                    <div className="flex items-center justify-between py-2 border-t border-b border-neutral-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-neutral-800">Fade Audio In/Out</span>
                        <span className="text-[9px] text-neutral-400">Smooth transition sound</span>
                      </div>
                      <button
                        onClick={() => {
                          const currentFade = selectedClip.fadeIn || 0
                          const newFade = currentFade > 0 ? 0 : 1.5
                          updateClipProperty(selectedClip.id, 'fadeIn', newFade)
                          updateClipProperty(selectedClip.id, 'fadeOut', newFade)
                        }}
                        className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                          (selectedClip.fadeIn || 0) > 0 ? 'bg-green-500' : 'bg-neutral-200'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          (selectedClip.fadeIn || 0) > 0 ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>


                  </div>
                )}

                {/* Image settings */}
                {selectedClip.type === 'image' && (
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Image Transformations</span>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500 font-semibold">Scale</span>
                        <span className="font-mono text-neutral-700 font-bold">{selectedClip.scale || 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="250"
                        value={selectedClip.scale || 100}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'scale', Number(e.target.value))}
                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500 font-semibold">Opacity</span>
                        <span className="font-mono text-neutral-700 font-bold">{selectedClip.opacity !== undefined ? selectedClip.opacity : 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedClip.opacity !== undefined ? selectedClip.opacity : 100}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'opacity', Number(e.target.value))}
                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500 font-semibold">Rotation</span>
                        <span className="font-mono text-neutral-700 font-bold">{selectedClip.rotation || 0}°</span>
                      </div>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={selectedClip.rotation || 0}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'rotation', Number(e.target.value))}
                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500 font-semibold">Position X</span>
                        <span className="font-mono text-neutral-700 font-bold">{selectedClip.posX || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-300"
                        max="300"
                        value={selectedClip.posX || 0}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'posX', Number(e.target.value))}
                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500 font-semibold">Position Y</span>
                        <span className="font-mono text-neutral-700 font-bold">{selectedClip.posY || 0}px</span>
                      </div>
                      <input
                        type="range"
                        min="-300"
                        max="300"
                        value={selectedClip.posY || 0}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'posY', Number(e.target.value))}
                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>
                  </div>
                )}

                {/* Text settings */}
                {selectedClip.type === 'text' && (
                  <div className="space-y-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Typography Settings</span>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-500">Content Text</label>
                      <textarea
                        rows={2}
                        value={selectedClip.textContent || ''}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'textContent', e.target.value)}
                        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-500">Font Family</label>
                      <select
                        value={selectedClip.fontFamily || 'Geist'}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'fontFamily', e.target.value)}
                        className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-800 focus:outline-none focus:border-green-500"
                      >
                        <option value="Geist">Geist (Default)</option>
                        <option value="Geist Mono">Geist Mono</option>
                        <option value="Inter">Inter Sans</option>
                        <option value="Outfit">Outfit Bold</option>
                        <option value="Playfair Display">Playfair Display Serif</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-neutral-500 font-semibold">Font Size</span>
                        <span className="font-mono text-neutral-700 font-bold">{selectedClip.fontSize || 24}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="80"
                        value={selectedClip.fontSize || 24}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'fontSize', Number(e.target.value))}
                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-500">Alignment</label>
                      <div className="flex bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 justify-between gap-1">
                        {[
                          { id: 'left', icon: AlignLeft },
                          { id: 'center', icon: AlignCenter },
                          { id: 'right', icon: AlignRight },
                        ].map((al) => {
                          const AlIcon = al.icon
                          const isAlignActive = (selectedClip.align || 'center') === al.id
                          return (
                            <button
                              key={al.id}
                              type="button"
                              onClick={() => updateClipProperty(selectedClip.id, 'align', al.id)}
                              className={`flex-1 py-1 rounded flex justify-center transition-all ${
                                isAlignActive ? 'bg-white border border-neutral-200 text-black shadow-sm' : 'text-neutral-400 hover:text-black'
                              }`}
                            >
                              <AlIcon className="w-3.5 h-3.5" />
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-neutral-500">Text Color</label>
                      <div className="flex gap-2.5">
                        {['#ffffff', '#000000', '#a1a1aa', '#60a5fa', '#ec4899', '#fbbf24', '#34d399'].map((col) => (
                          <button
                            key={col}
                            onClick={() => updateClipProperty(selectedClip.id, 'textColor', col)}
                            style={{ backgroundColor: col }}
                            className={`w-6 h-6 rounded-full border shadow-sm transition-all ${
                              selectedClip.textColor === col ? 'border-neutral-800 scale-110 ring-2 ring-offset-2 ring-neutral-300' : 'border-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Audio settings */}
                {selectedClip.type === 'audio' && (
                  <div className="space-y-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Audio Settings</span>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-neutral-500">Volume</span>
                        <span className="text-xs font-mono font-bold text-neutral-800">{selectedClip.volume || 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={selectedClip.volume || 100}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'volume', Number(e.target.value))}
                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-neutral-500">Fade In</span>
                        <span className="text-xs font-mono font-bold text-neutral-800">{(selectedClip.fadeIn || 0).toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={selectedClip.fadeIn || 0}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'fadeIn', Number(e.target.value))}
                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-neutral-500">Fade Out</span>
                        <span className="text-xs font-mono font-bold text-neutral-800">{(selectedClip.fadeOut || 0).toFixed(1)}s</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={selectedClip.fadeOut || 0}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'fadeOut', Number(e.target.value))}
                        className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                    </div>
                  </div>
                )}

                {/* Timing controls */}
                <div className="pt-4 border-t border-neutral-100 space-y-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Clip Bounds</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-neutral-400">Start (s)</label>
                      <input
                        type="number"
                        min="0"
                        max={projectDuration}
                        value={selectedClip.startTime}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'startTime', Math.max(0, Number(e.target.value)))}
                        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-green-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-neutral-400">Duration (s)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={selectedClip.duration}
                        onChange={(e) => updateClipProperty(selectedClip.id, 'duration', Math.max(1, Number(e.target.value)))}
                        className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-800 focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <div className="pt-6 border-t border-neutral-100">
                  <button
                    onClick={() => deleteClip(selectedClip.id)}
                    className="w-full py-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Clip
                  </button>
                </div>

              </div>
            </div>
          ) : (
            // 2. LIBRARY TABS DRAWER
            <div className="p-5 flex flex-col h-full gap-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase font-bold tracking-wider text-neutral-400">
                  {activeTab === 'video' && 'Video Assets'}
                  {activeTab === 'audio' && 'Sound FX & Music'}
                  {activeTab === 'image' && 'Image Library'}
                  {activeTab === 'text' && 'Text Overlays'}
                  {activeTab === 'elements' && 'Elements & Filters'}
                </h3>
              </div>

              <div className="h-[1px] bg-neutral-100 shrink-0" />

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">

                {/* Video Tab */}
                {activeTab === 'video' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="w-full flex flex-col items-center justify-center border border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/50 py-5 rounded-xl cursor-pointer transition-all text-center shadow-sm">
                        <Plus className="w-4 h-4 text-neutral-500 mb-1" />
                        <span className="text-[11px] text-neutral-600 font-bold">Upload Video</span>
                        <span className="text-[9px] text-neutral-400 mt-0.5">MP4, WebM, MOV supported</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => handleLocalUpload(e, 'video')}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Project Videos</span>
                      {uploadedVideos.length === 0 ? (
                        <p className="text-[10px] text-neutral-500 italic p-3 text-center border border-dashed border-neutral-150 rounded-lg">
                          No video uploads. Add files above.
                        </p>
                      ) : (
                        uploadedVideos.map((asset, i) => (
                          <div
                            key={i}
                            draggable
                            onDragStart={(e) => handleDragStart(e, asset)}
                            onClick={() => addClipToTimeline('video', asset)}
                            className="group flex gap-2.5 p-2 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 cursor-grab active:cursor-grabbing transition-all items-center shadow-sm"
                          >
                            <div className="w-12 h-9 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden relative shrink-0">
                              <video src={asset.url} className="w-full h-full object-cover" preload="metadata" muted />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[11px] font-bold text-neutral-800 truncate leading-tight">{asset.name}</h4>
                              <p className="text-[9px] text-neutral-400 font-mono mt-0.5">{asset.duration}s clip</p>
                            </div>
                            <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-green-600 shrink-0 transition-opacity" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Audio Tab */}
                {activeTab === 'audio' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="w-full flex flex-col items-center justify-center border border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/50 py-5 rounded-xl cursor-pointer transition-all text-center shadow-sm">
                        <Plus className="w-4 h-4 text-neutral-500 mb-1" />
                        <span className="text-[11px] text-neutral-600 font-bold">Upload Audio</span>
                        <span className="text-[9px] text-neutral-400 mt-0.5">MP3, WAV, M4A supported</span>
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={(e) => handleLocalUpload(e, 'audio')}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Project Audios</span>
                      {uploadedAudios.length === 0 ? (
                        <p className="text-[10px] text-neutral-500 italic p-3 text-center border border-dashed border-neutral-150 rounded-lg">
                          No audio uploads. Add files above.
                        </p>
                      ) : (
                        uploadedAudios.map((asset, i) => (
                          <div
                            key={i}
                            draggable
                            onDragStart={(e) => handleDragStart(e, asset)}
                            onClick={() => addClipToTimeline('audio', asset)}
                            className="group flex gap-2.5 p-2.5 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 cursor-grab active:cursor-grabbing transition-all items-center shadow-sm"
                          >
                            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                              <Music className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[11px] font-bold text-neutral-800 truncate leading-tight">{asset.name}</h4>
                              <p className="text-[9px] text-neutral-400 font-mono mt-0.5">{asset.duration}s length</p>
                            </div>
                            <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-green-600 shrink-0 transition-opacity" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Image Tab */}
                {activeTab === 'image' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="w-full flex flex-col items-center justify-center border border-dashed border-neutral-300 hover:border-neutral-400 bg-neutral-50 hover:bg-neutral-100/50 py-5 rounded-xl cursor-pointer transition-all text-center shadow-sm">
                        <Plus className="w-4 h-4 text-neutral-500 mb-1" />
                        <span className="text-[11px] text-neutral-600 font-bold">Upload Image</span>
                        <span className="text-[9px] text-neutral-400 mt-0.5">PNG, JPG, SVG supported</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleLocalUpload(e, 'image')}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[9px] uppercase font-bold text-neutral-400 tracking-wider">Project Images</span>
                      {uploadedImages.length === 0 ? (
                        <p className="text-[10px] text-neutral-500 italic p-3 text-center border border-dashed border-neutral-150 rounded-lg">
                          No image uploads. Add files above.
                        </p>
                      ) : (
                        uploadedImages.map((asset, i) => (
                          <div
                            key={i}
                            draggable
                            onDragStart={(e) => handleDragStart(e, asset)}
                            onClick={() => addClipToTimeline('image', asset)}
                            className="group flex gap-2.5 p-2 rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 cursor-grab active:cursor-grabbing transition-all items-center shadow-sm"
                          >
                            <div className="w-12 h-9 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                              <img src={asset.url} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-[11px] font-bold text-neutral-800 truncate leading-tight">{asset.name}</h4>
                              <p className="text-[9px] text-neutral-400 font-mono mt-0.5">{asset.duration}s length</p>
                            </div>
                            <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-green-600 shrink-0 transition-opacity" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}



                {/* Text overlays */}
                {activeTab === 'text' && (
                  <div className="space-y-3">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Text Presets</span>
                    {[
                      { name: 'Add Title Header', textContent: 'BIG HEADER TITLE', fontSize: 44, textColor: '#000000' },
                      { name: 'Add Subtitle Layer', textContent: 'Sub-heading segment', fontSize: 28, textColor: '#3b82f6' },
                      { name: 'Add Body Text Paragraph', textContent: 'Type your paragraphs here.', fontSize: 18, textColor: '#4b5563' }
                    ].map((txt, i) => (
                      <div
                        key={i}
                        draggable
                        onDragStart={(e) => handleDragStart(e, { ...txt, type: 'text' })}
                        onClick={() => addClipToTimeline('text', txt)}
                        className="p-3 text-left rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-700 flex items-center justify-between group cursor-grab active:cursor-grabbing shadow-sm"
                      >
                        <span>{txt.name}</span>
                        <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-green-600 transition-opacity" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Elements / filters */}
                {activeTab === 'elements' && (
                  <div className="space-y-4">
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Visual Filters</span>
                    {selectedClip && (selectedClip.type === 'video' || selectedClip.type === 'image') ? (
                      <div className="space-y-2">
                        <p className="text-[11px] text-neutral-500 leading-normal">
                          Apply a filter effect to selected clip: <strong className="text-black">"{selectedClip.name}"</strong>
                        </p>
                        {[
                          { name: 'Default Normal', filter: 'none' },
                          { name: 'Warm Sunset Glow', filter: 'sepia(0.4) saturate(1.3)' },
                          { name: 'Classic Black & White', filter: 'grayscale(1)' },
                          { name: 'Neon Cyberpunk', filter: 'hue-rotate(140deg) saturate(1.5) brightness(1.1)' }
                        ].map((eff, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              updateClipProperty(selectedClip.id, 'name', `${selectedClip.name.split(' (')[0]} (${eff.name})`)
                              updateClipProperty(selectedClip.id, 'filter', eff.filter)
                            }}
                            className="w-full p-2.5 text-left rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-700 flex items-center justify-between group shadow-sm"
                          >
                            <span>{eff.name}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-green-600 transition-colors" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 text-center">
                        <p className="text-xs text-neutral-400">Select a video or image clip in the timeline/canvas to unlock filter effects.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

        {/* CENTER-RIGHT WORKSPACE (Preview Staging + Timeline) */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f1f3f5] relative">
          
          {/* Preview Viewport Staging Area */}
          <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center p-8 bg-[#f8f9fa] bg-grid-pattern relative border-b border-neutral-200">
            
            {/* Viewport Format settings */}
            <div className="absolute top-4 left-6 z-10 flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Format:</span>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="bg-white border border-neutral-200 rounded px-2.5 py-1 text-[11px] text-neutral-800 font-bold focus:outline-none shadow-sm cursor-pointer"
              >
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Portrait</option>
                <option value="1:1">1:1 Square</option>
              </select>
            </div>

            <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-green-500/[0.01] blur-[100px] pointer-events-none" />

            {/* Video Canvas Sandbox Container */}
            <div 
              id="preview-viewport"
              className={`relative bg-black border border-neutral-200 shadow-2xl overflow-hidden transition-all duration-300 flex items-center justify-center ${
                aspectRatio === '16:9' ? 'w-[720px] h-[405px]' : 
                aspectRatio === '9:16' ? 'w-[270px] h-[480px]' : 
                'w-[450px] h-[450px]'
              }`}
            >
              {/* Visual rendering of active layers */}
              {activeVisualClips.map((clip) => {
                if (clip.type === 'video') {
                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => { e.stopPropagation(); selectClip(clip.id); }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        transform: `translate(${clip.posX || 0}px, ${clip.posY || 0}px) scale(${(clip.scale || 100) / 100}) rotate(${clip.rotation || 0}deg)`,
                        opacity: (clip.opacity !== undefined ? clip.opacity : 100) / 100,
                        zIndex: clip.trackId === 'text' ? 2 : 1,
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        filter: clip.filter || 'none',
                      }}
                    >
                      {clip.url ? (
                        <VideoClipPlayer 
                          clip={clip} 
                          currentTime={currentTime} 
                          isPlaying={isPlaying} 
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-[10px] text-neutral-500">
                          Video Layer
                        </div>
                      )}
                    </div>
                  )
                }
                if (clip.type === 'image') {
                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => { e.stopPropagation(); selectClip(clip.id); }}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        transform: `translate(${clip.posX || 0}px, ${clip.posY || 0}px) scale(${(clip.scale || 100) / 100}) rotate(${clip.rotation || 0}deg)`,
                        opacity: (clip.opacity !== undefined ? clip.opacity : 100) / 100,
                        zIndex: clip.trackId === 'text' ? 2 : 1,
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        filter: clip.filter || 'none',
                      }}
                    >
                      {clip.url ? (
                        <img 
                          src={clip.url} 
                          className="w-full h-full object-cover" 
                          alt={clip.name} 
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-[10px] text-neutral-500">
                          Image Layer
                        </div>
                      )}
                    </div>
                  )
                }
                if (clip.type === 'text') {
                  return (
                    <div
                      key={clip.id}
                      onClick={(e) => { e.stopPropagation(); selectClip(clip.id); }}
                      style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: `translate(-50%, -50%) translate(${clip.posX || 0}px, ${clip.posY || 0}px) scale(${(clip.scale || 100) / 100}) rotate(${clip.rotation || 0}deg)`,
                        opacity: (clip.opacity !== undefined ? clip.opacity : 100) / 100,
                        color: clip.textColor || '#ffffff',
                        fontSize: `${clip.fontSize || 24}px`,
                        fontWeight: '850',
                        textAlign: clip.align || 'center',
                        fontFamily: clip.fontFamily === 'Geist Mono' ? 'Geist Mono, monospace' : 
                                    clip.fontFamily === 'Inter' ? 'Inter, sans-serif' : 
                                    clip.fontFamily === 'Outfit' ? 'Outfit, sans-serif' : 
                                    clip.fontFamily === 'Playfair Display' ? 'Playfair Display, serif' : 
                                    'Geist, sans-serif',
                        whiteSpace: 'nowrap',
                        zIndex: 10,
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {clip.textContent || clip.name}
                    </div>
                  )
                }
                return null
              })}

              {/* Canvas Selection Frame Overlay */}
              {selectedClip && activeVisualClips.some(c => c.id === selectedClip.id) && (
                <div
                  onMouseDown={(e) => handleCanvasClipMouseDown(e, selectedClip)}
                  style={
                    selectedClip.type === 'text'
                      ? {
                          position: 'absolute',
                          left: '50%',
                          top: '50%',
                          transform: `translate(-50%, -50%) translate(${selectedClip.posX || 0}px, ${selectedClip.posY || 0}px) scale(${(selectedClip.scale || 100) / 100}) rotate(${selectedClip.rotation || 0}deg)`,
                          width: '240px',
                          height: '60px',
                          border: '2px dashed #22c55e', // premium green bounding box
                          pointerEvents: 'auto',
                          zIndex: 50,
                          cursor: 'move',
                        }
                      : {
                          position: 'absolute',
                          inset: 0,
                          transform: `translate(${selectedClip.posX || 0}px, ${selectedClip.posY || 0}px) scale(${(selectedClip.scale || 100) / 100}) rotate(${selectedClip.rotation || 0}deg)`,
                          border: '2px dashed #22c55e', // premium green bounding box
                          pointerEvents: 'auto',
                          zIndex: 50,
                          cursor: 'move',
                        }
                  }
                >
                  {/* Corner Scale Handles */}
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, selectedClip)}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-30"
                  />
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, selectedClip)}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-30"
                  />
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, selectedClip)}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white cursor-nesw-resize shadow-md hover:scale-125 transition-transform z-30"
                  />
                  <div
                    onMouseDown={(e) => handleScaleMouseDown(e, selectedClip)}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white cursor-nwse-resize shadow-md hover:scale-125 transition-transform z-30"
                  />
                  
                  {/* Rotation Handle */}
                  <div
                    onMouseDown={(e) => handleRotateMouseDown(e, selectedClip)}
                    className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-alias z-30"
                  >
                    <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md hover:scale-125 transition-transform" />
                    <div className="w-[1.5px] h-4 bg-green-500" />
                  </div>
                </div>
              )}

              {/* Empty State */}
              {activeVisualClips.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/95">
                  <span className="text-[10px] text-neutral-500 font-mono">
                    No Media Rendering at {currentTime.toFixed(2)}s
                  </span>
                </div>
              )}
            </div>

            {/* Centered Floating Capsule Toolbar */}
            <div className="mt-6 flex bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-neutral-200/60 shadow-lg items-center gap-3.5 text-[11px] font-bold text-neutral-600 z-10">
              <button onClick={() => { if (selectedClipId) { setShowInspector(true) } else { alert("Select a clip first.") } }} className="flex items-center gap-1 hover:text-black transition-colors">
                <Sliders className="w-3.5 h-3.5" />
                <span>Animation</span>
              </button>
              <button onClick={() => alert("Transitions will trigger between clips.")} className="flex items-center gap-1 hover:text-black transition-colors">
                <Film className="w-3.5 h-3.5" />
                <span>Transitions</span>
              </button>
              <div className="w-[1px] h-3.5 bg-neutral-200" />
              <button onClick={() => setIsMuted(!isMuted)} className="hover:text-black transition-colors">
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button onClick={() => alert("Headphones preview enabled.")} className="hover:text-black transition-colors">
                <Headphones className="w-4 h-4" />
              </button>
              <button onClick={() => alert("Configure editor layout details.")} className="hover:text-black transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Above-Timeline Playback Controls row */}
          <div className="h-12 border-b border-neutral-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
            
            {/* Split & Download buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSplitClip}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700 active:scale-95 transition-all shadow-sm"
                title="Split selected clip at playhead"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Split</span>
              </button>
              
              <button
                onClick={() => handleExportModalOpen()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700 active:scale-95 transition-all shadow-sm"
                title="Export and download timeline metadata"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download (0:00 - {projectDuration}s)</span>
              </button>
            </div>

            {/* Playback Controls Center */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentTime(0)}
                className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors"
                title="Seek to Start"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-full bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-105 active:scale-95 transition-all shadow-md"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-white text-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                )}
              </button>

              <button 
                onClick={() => setCurrentTime(projectDuration)}
                className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-400 hover:text-black transition-colors"
                title="Seek to End"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Time displays */}
              <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-600 font-bold bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-200 shadow-inner">
                <span className="text-black">
                  {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
                  {Math.floor(currentTime % 60).toString().padStart(2, '0')}.
                  {Math.floor((currentTime % 1) * 10).toString()}
                </span>
                <span>/</span>
                <span className="text-neutral-400">
                  {Math.floor(projectDuration / 60).toString().padStart(2, '0')}:
                  {Math.floor(projectDuration % 60).toString().padStart(2, '0')}.0
                </span>
              </div>

              {/* Zoom Slider */}
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-lg shadow-sm">
                <ZoomOut className="w-3.5 h-3.5 text-neutral-400 cursor-pointer hover:text-black" onClick={() => setTimelineZoom(z => Math.max(4, z - 2))} />
                <input
                  type="range"
                  min="4"
                  max="24"
                  value={timelineZoom}
                  onChange={(e) => setTimelineZoom(Number(e.target.value))}
                  className="w-16 h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-800"
                />
                <ZoomIn className="w-3.5 h-3.5 text-neutral-400 cursor-pointer hover:text-black" onClick={() => setTimelineZoom(z => Math.min(24, z + 2))} />
              </div>
            </div>

            {/* Fit button */}
            <button 
              onClick={() => setTimelineZoom(12)}
              className="px-3.5 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700 shadow-sm active:scale-95 transition-all"
              title="Reset Timeline zoom"
            >
              Fit
            </button>

          </div>

          {/* Bottom Timeline Section */}
          <div className="h-56 flex flex-col bg-white relative overflow-hidden select-none z-10">
            
            {/* Scrollable tracks container */}
            <div 
              ref={timelineScrollContainerRef}
              className="flex-1 overflow-x-auto overflow-y-auto relative bg-neutral-50"
            >
              
              {/* Ruler + Lanes wrapper */}
              <div className="min-w-max flex flex-col pr-8 pt-1" style={{ width: projectDuration * timelineZoom + 96 + 100 }}>
                
                {/* Time Ticks Ruler */}
                <div className="h-6 border-b border-neutral-200 bg-white flex relative select-none z-20">
                  {/* Sticky Corner Header Spacer */}
                  <div className="w-24 shrink-0 border-r border-neutral-200 bg-white sticky left-0 z-25 h-full flex items-center px-3 select-none">
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Tracks</span>
                  </div>

                  {/* Ruler Ticks */}
                  <div 
                    ref={timelineRef}
                    onMouseDown={handleTimelineScrubMouseDown}
                    className="flex-1 h-full relative cursor-ew-resize"
                  >
                    {Array.from({ length: Math.ceil(projectDuration) + 1 }).map((_, sec) => (
                      <div 
                        key={sec} 
                        className="absolute top-0 flex flex-col justify-between h-full select-none"
                        style={{ left: sec * timelineZoom }}
                      >
                        <div className="h-1.5 w-[1px] bg-neutral-300" />
                        <span className="text-[8px] text-neutral-400 font-mono pl-1 leading-none select-none font-bold">
                          {sec}s
                        </span>
                      </div>
                    ))}

                    {/* Red Needle Playhead marker in Ruler */}
                    <div 
                      className="absolute top-0 bottom-0 w-[2px] bg-rose-500 pointer-events-none z-15"
                      style={{ left: currentTime * timelineZoom }}
                    >
                      <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 absolute -top-[5px] -left-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.15)]" />
                    </div>
                  </div>
                </div>

                {/* 1. TEXT OVERLAYS TRACK */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'text')}
                  className="h-11 border-b border-neutral-200/70 flex items-center relative hover:bg-neutral-100/30"
                >
                  <div className="w-24 shrink-0 text-[10px] uppercase font-bold text-neutral-500 px-3 select-none z-10 sticky left-0 bg-white border-r border-neutral-200 h-full flex items-center justify-between gap-1">
                    <span className="truncate pr-1">Texts</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleTrackMute('text')}
                        className={`p-0.5 rounded hover:bg-neutral-100 ${mutedTracks.includes('text') ? 'text-red-500' : 'text-neutral-400 hover:text-black'}`}
                      >
                        <EyeOff className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleTrackLock('text')}
                        className={`p-0.5 rounded hover:bg-neutral-100 ${lockedTracks.includes('text') ? 'text-green-600' : 'text-neutral-400 hover:text-black'}`}
                      >
                        {lockedTracks.includes('text') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 h-full relative">
                    {clips.filter(c => c.trackId === 'text').map((clip) => (
                      <div
                        key={clip.id}
                        onMouseDown={(e) => handleClipMouseDown(e, clip)}
                        style={{
                          left: clip.startTime * timelineZoom,
                          width: clip.duration * timelineZoom,
                        }}
                        className={`absolute top-1 bottom-1 rounded border text-[10px] font-bold flex items-center px-2.5 cursor-grab active:cursor-grabbing transition-all ${
                          selectedClipId === clip.id
                            ? 'bg-green-500/10 border-2 border-green-500 text-green-800 shadow-[0_2px_8px_rgba(34,197,94,0.15)] z-10'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-sm'
                        } ${lockedTracks.includes('text') ? 'opacity-50 !cursor-not-allowed' : ''} ${mutedTracks.includes('text') ? 'border-dashed opacity-40' : ''}`}
                      >
                        <span className="truncate">"{clip.textContent || clip.name}"</span>
                        <span className="text-[8px] opacity-65 font-mono ml-1.5 shrink-0 font-semibold">({clip.duration}s)</span>

                        {/* Trim Handles */}
                        {selectedClipId === clip.id && !lockedTracks.includes('text') && (
                          <>
                            <div 
                              onMouseDown={(e) => handleResizeMouseDown(e, clip, 'left')}
                              className="trim-handle absolute left-0 top-0 bottom-0 w-2 bg-green-500 hover:bg-green-600 cursor-ew-resize rounded-l z-20 flex items-center justify-center text-[8px] text-white font-black"
                            >
                              |
                            </div>
                            <div 
                              onMouseDown={(e) => handleResizeMouseDown(e, clip, 'right')}
                              className="trim-handle absolute right-0 top-0 bottom-0 w-2 bg-green-500 hover:bg-green-600 cursor-ew-resize rounded-r z-20 flex items-center justify-center text-[8px] text-white font-black"
                            >
                              |
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. PRIMARY VIDEO CLIPS TRACK */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'video')}
                  className="h-13 border-b border-neutral-200/70 flex items-center relative hover:bg-neutral-100/30"
                >
                  <div className="w-24 shrink-0 text-[10px] uppercase font-bold text-neutral-500 px-3 select-none z-10 sticky left-0 bg-white border-r border-neutral-200 h-full flex items-center justify-between gap-1">
                    <span className="truncate pr-1">Video</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleTrackMute('video')}
                        className={`p-0.5 rounded hover:bg-neutral-100 ${mutedTracks.includes('video') ? 'text-red-500' : 'text-neutral-400 hover:text-black'}`}
                      >
                        <EyeOff className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleTrackLock('video')}
                        className={`p-0.5 rounded hover:bg-neutral-100 ${lockedTracks.includes('video') ? 'text-green-600' : 'text-neutral-400 hover:text-black'}`}
                      >
                        {lockedTracks.includes('video') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 h-full relative">
                    {clips.filter(c => c.trackId === 'video').map((clip) => (
                      <div
                        key={clip.id}
                        onMouseDown={(e) => handleClipMouseDown(e, clip)}
                        style={{
                          left: clip.startTime * timelineZoom,
                          width: clip.duration * timelineZoom,
                        }}
                        className={`absolute top-1 bottom-1 rounded border text-[10px] font-bold flex items-center justify-between px-2.5 cursor-grab active:cursor-grabbing transition-all ${
                          selectedClipId === clip.id
                            ? 'bg-green-500/10 border-2 border-green-500 text-green-800 shadow-[0_2px_8px_rgba(34,197,94,0.15)] z-10'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-sm'
                        } ${lockedTracks.includes('video') ? 'opacity-50 !cursor-not-allowed' : ''} ${mutedTracks.includes('video') ? 'border-dashed opacity-40' : ''}`}
                      >
                        <span className="truncate pr-1">{clip.name}</span>
                        <span className="text-[8px] opacity-65 font-mono shrink-0 font-semibold">({clip.duration}s)</span>

                        {selectedClipId === clip.id && !lockedTracks.includes('video') && (
                          <>
                            <div 
                              onMouseDown={(e) => handleResizeMouseDown(e, clip, 'left')}
                              className="trim-handle absolute left-0 top-0 bottom-0 w-2 bg-green-500 hover:bg-green-600 cursor-ew-resize rounded-l z-20 flex items-center justify-center text-[8px] text-white font-black"
                            >
                              |
                            </div>
                            <div 
                              onMouseDown={(e) => handleResizeMouseDown(e, clip, 'right')}
                              className="trim-handle absolute right-0 top-0 bottom-0 w-2 bg-green-500 hover:bg-green-600 cursor-ew-resize rounded-r z-20 flex items-center justify-center text-[8px] text-white font-black"
                            >
                              |
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. MUSIC TRACK */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'music')}
                  className="h-11 border-b border-neutral-200/70 flex items-center relative hover:bg-neutral-100/30"
                >
                  <div className="w-24 shrink-0 text-[10px] uppercase font-bold text-neutral-500 px-3 select-none z-10 sticky left-0 bg-white border-r border-neutral-200 h-full flex items-center justify-between gap-1">
                    <span className="truncate pr-1">Music</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleTrackMute('music')}
                        className={`p-0.5 rounded hover:bg-neutral-100 ${mutedTracks.includes('music') ? 'text-red-500' : 'text-neutral-400 hover:text-black'}`}
                      >
                        <EyeOff className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleTrackLock('music')}
                        className={`p-0.5 rounded hover:bg-neutral-100 ${lockedTracks.includes('music') ? 'text-green-600' : 'text-neutral-400 hover:text-black'}`}
                      >
                        {lockedTracks.includes('music') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 h-full relative">
                    {clips.filter(c => c.trackId === 'music').map((clip) => (
                      <div
                        key={clip.id}
                        onMouseDown={(e) => handleClipMouseDown(e, clip)}
                        style={{
                          left: clip.startTime * timelineZoom,
                          width: clip.duration * timelineZoom,
                        }}
                        className={`absolute top-1 bottom-1 rounded border text-[10px] font-bold flex items-center justify-between px-2.5 cursor-grab active:cursor-grabbing transition-all ${
                          selectedClipId === clip.id
                            ? 'bg-green-500/10 border-2 border-green-500 text-green-800 shadow-[0_2px_8px_rgba(34,197,94,0.15)] z-10'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-sm'
                        } ${lockedTracks.includes('music') ? 'opacity-50 !cursor-not-allowed' : ''} ${mutedTracks.includes('music') ? 'border-dashed opacity-40' : ''}`}
                      >
                        <span className="truncate pr-1">{clip.name}</span>
                        <span className="text-[8px] opacity-65 font-mono shrink-0 font-semibold">({clip.duration}s)</span>

                        {selectedClipId === clip.id && !lockedTracks.includes('music') && (
                          <>
                            <div 
                              onMouseDown={(e) => handleResizeMouseDown(e, clip, 'left')}
                              className="trim-handle absolute left-0 top-0 bottom-0 w-2 bg-green-500 hover:bg-green-600 cursor-ew-resize rounded-l z-20 flex items-center justify-center text-[8px] text-white font-black"
                            >
                              |
                            </div>
                            <div 
                              onMouseDown={(e) => handleResizeMouseDown(e, clip, 'right')}
                              className="trim-handle absolute right-0 top-0 bottom-0 w-2 bg-green-500 hover:bg-green-600 cursor-ew-resize rounded-r z-20 flex items-center justify-center text-[8px] text-white font-black"
                            >
                              |
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. SFX AUDIO TRACK */}
                <div 
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, 'sfx')}
                  className="h-11 border-b border-neutral-200/70 flex items-center relative hover:bg-neutral-100/30"
                >
                  <div className="w-24 shrink-0 text-[10px] uppercase font-bold text-neutral-500 px-3 select-none z-10 sticky left-0 bg-white border-r border-neutral-200 h-full flex items-center justify-between gap-1">
                    <span className="truncate pr-1">SFX</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleTrackMute('sfx')}
                        className={`p-0.5 rounded hover:bg-neutral-100 ${mutedTracks.includes('sfx') ? 'text-red-500' : 'text-neutral-400 hover:text-black'}`}
                      >
                        <EyeOff className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleTrackLock('sfx')}
                        className={`p-0.5 rounded hover:bg-neutral-100 ${lockedTracks.includes('sfx') ? 'text-green-600' : 'text-neutral-400 hover:text-black'}`}
                      >
                        {lockedTracks.includes('sfx') ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 h-full relative">
                    {clips.filter(c => c.trackId === 'sfx').map((clip) => (
                      <div
                        key={clip.id}
                        onMouseDown={(e) => handleClipMouseDown(e, clip)}
                        style={{
                          left: clip.startTime * timelineZoom,
                          width: clip.duration * timelineZoom,
                        }}
                        className={`absolute top-1 bottom-1 rounded border text-[10px] font-bold flex items-center justify-between px-2.5 cursor-grab active:cursor-grabbing transition-all ${
                          selectedClipId === clip.id
                            ? 'bg-green-500/10 border-2 border-green-500 text-green-800 shadow-[0_2px_8px_rgba(34,197,94,0.15)] z-10'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50 shadow-sm'
                        } ${lockedTracks.includes('sfx') ? 'opacity-50 !cursor-not-allowed' : ''} ${mutedTracks.includes('sfx') ? 'border-dashed opacity-40' : ''}`}
                      >
                        <span className="truncate pr-1">{clip.name}</span>
                        <span className="text-[8px] opacity-65 font-mono shrink-0 font-semibold">({clip.duration}s)</span>

                        {selectedClipId === clip.id && !lockedTracks.includes('sfx') && (
                          <>
                            <div 
                              onMouseDown={(e) => handleResizeMouseDown(e, clip, 'left')}
                              className="trim-handle absolute left-0 top-0 bottom-0 w-2 bg-green-500 hover:bg-green-600 cursor-ew-resize rounded-l z-20 flex items-center justify-center text-[8px] text-white font-black"
                            >
                              |
                            </div>
                            <div 
                              onMouseDown={(e) => handleResizeMouseDown(e, clip, 'right')}
                              className="trim-handle absolute right-0 top-0 bottom-0 w-2 bg-green-500 hover:bg-green-600 cursor-ew-resize rounded-r z-20 flex items-center justify-center text-[8px] text-white font-black"
                            >
                              |
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Vertical Playhead Needle Line (scrolling-aligned) */}
              <div 
                className="absolute top-6 bottom-0 w-[1.5px] bg-rose-500/40 pointer-events-none z-15"
                style={{ left: currentTime * timelineZoom + 96 }}
              />

            </div>

          </div>
        </div>

      </div>

      {/* Premium Export Progress Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-neutral-200 shadow-2xl text-center space-y-4">
            {isExporting ? (
              <div className="space-y-4">
                <div className="size-12 mx-auto rounded-full bg-green-50 flex items-center justify-center text-green-600 animate-pulse">
                  <Download className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-800">Exporting Project</h3>
                  <p className="text-xs text-neutral-500">Preparing and rendering video clips...</p>
                </div>
                
                <div className="space-y-2">
                  <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden border border-neutral-200">
                    <div 
                      className="bg-green-500 h-full transition-all duration-200" 
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-neutral-600 font-mono">{exportProgress}%</span>
                </div>
              </div>
            ) : exportError ? (
              <div className="space-y-4">
                <div className="size-12 mx-auto rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <span className="text-xl font-bold">✕</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-red-800">Export Failed</h3>
                  <p className="text-xs text-neutral-500 px-2 break-words">{exportError}</p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-900 text-xs font-semibold text-white active:scale-95 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : exportComplete ? (
              <div className="space-y-4">
                <div className="size-12 mx-auto rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <span className="text-xl font-bold">✓</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-neutral-800">Export Complete!</h3>
                  <p className="text-xs text-neutral-500">Your video rendering has finished successfully.</p>
                </div>
                
                <div className="flex gap-2">
                  {exportDownloadUrl && (
                    <a
                      href={exportDownloadUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-xs font-semibold text-white active:scale-95 transition-all flex items-center justify-center decoration-none no-underline"
                    >
                      Download Video
                    </a>
                  )}
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="flex-1 py-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 active:scale-95 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Background audio player for audio clips */}
      {activeAudioClips.map((clip) => (
        <AudioClipPlayer
          key={clip.id}
          clip={clip}
          currentTime={currentTime}
          isPlaying={isPlaying}
          volume={volume}
          isMuted={isMuted}
        />
      ))}
    </div>
  )
}

function VideoClipPlayer({ clip, currentTime, isPlaying }) {
  const videoRef = useRef(null)
  const targetTime = (currentTime - clip.startTime) + (clip.trimStart || 0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    // Initial sync
    video.currentTime = targetTime
    if (isPlaying && video.paused) {
      video.play().catch(err => console.error("Error playing video:", err))
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Sync play/pause state
    if (isPlaying) {
      if (video.paused) {
        video.play().catch(err => console.error("Error playing video:", err))
      }
    } else {
      if (!video.paused) {
        video.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Sync current time if drift is too large
    const diff = Math.abs(video.currentTime - targetTime)
    if (diff > 0.15) {
      video.currentTime = targetTime
    }
  }, [currentTime])

  return (
    <video
      ref={videoRef}
      src={clip.url}
      className="w-full h-full object-cover"
      muted
      playsInline
    />
  )
}

function AudioClipPlayer({ clip, currentTime, isPlaying, volume, isMuted }) {
  const audioRef = useRef(null)
  const targetTime = (currentTime - clip.startTime) + (clip.trimStart || 0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    // Initial sync
    audio.currentTime = targetTime
    if (isPlaying && audio.paused) {
      audio.play().catch(err => console.error("Error playing audio:", err))
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Sync play/pause state
    if (isPlaying) {
      if (audio.paused) {
        audio.play().catch(err => console.error("Error playing audio:", err))
      }
    } else {
      if (!audio.paused) {
        audio.pause()
      }
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Sync current time if drift is too large
    const diff = Math.abs(audio.currentTime - targetTime)
    if (diff > 0.15) {
      audio.currentTime = targetTime
    }
  }, [currentTime])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    // Clip volume is 0-100, global volume is 0-100
    const clipVolume = clip.volume !== undefined ? clip.volume : 80
    audio.volume = isMuted ? 0 : (clipVolume / 100) * (volume / 100)
  }, [volume, isMuted, clip.volume])

  return (
    <audio
      ref={audioRef}
      src={clip.url}
    />
  )
}
