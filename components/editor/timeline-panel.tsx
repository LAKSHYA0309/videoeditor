'use client'

import { useRef, useEffect } from 'react'

interface TimelinePanelProps {
  clips: any[]
  selectedClip: string | null
  onSelectClip: (id: string | null) => void
  zoom: number
  currentTime: number
  onTimeUpdate: (time: number) => void
}

export function TimelinePanel({
  clips,
  selectedClip,
  onSelectClip,
  zoom,
  currentTime,
  onTimeUpdate,
}: TimelinePanelProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLCanvasElement>(null)

  // Draw timeline ruler and clips
  useEffect(() => {
    const canvas = timelineRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate dimensions based on zoom
    const pixelsPerSecond = (zoom / 100) * 50
    const maxDuration = Math.max(
      10000,
      Math.max(...clips.map((c) => (c.endTime || c.startTime + c.duration) || 0))
    )
    const canvasWidth = (maxDuration / 1000) * pixelsPerSecond

    canvas.width = Math.max(canvasWidth, 800)
    canvas.height = 200

    // Draw background
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw time ruler
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px monospace'
    ctx.textAlign = 'center'
    for (let i = 0; i <= maxDuration; i += 1000) {
      const x = (i / 1000) * pixelsPerSecond
      ctx.fillRect(x, 0, 1, 20)
      ctx.fillText(`${(i / 1000).toFixed(0)}s`, x, 35)
    }

    // Draw clips
    clips.forEach((clip, index) => {
      const startX = (clip.startTime / 1000) * pixelsPerSecond
      const endX = ((clip.endTime || clip.startTime + clip.duration) / 1000) * pixelsPerSecond
      const width = endX - startX

      const y = 60 + index * 60
      const height = 50

      // Draw clip background
      ctx.fillStyle = selectedClip === clip.id ? '#3b82f6' : '#4b5563'
      ctx.fillRect(startX, y, width, height)

      // Draw clip border
      ctx.strokeStyle = selectedClip === clip.id ? '#60a5fa' : '#6b7280'
      ctx.lineWidth = 2
      ctx.strokeRect(startX, y, width, height)

      // Draw clip name
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(clip.name, startX + 5, y + 25)
    })

    // Draw playhead
    const playheadX = (currentTime / 1000) * pixelsPerSecond
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(playheadX, 0)
    ctx.lineTo(playheadX, canvas.height)
    ctx.stroke()
  }, [clips, selectedClip, zoom, currentTime])

  const handleTimelineClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = timelineRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0)

    const pixelsPerSecond = (zoom / 100) * 50
    const newTime = (x / pixelsPerSecond) * 1000

    onTimeUpdate(Math.max(0, newTime))

    // Check if clicked on a clip
    clips.forEach((clip) => {
      const startX = (clip.startTime / 1000) * pixelsPerSecond
      const endX = ((clip.endTime || clip.startTime + clip.duration) / 1000) * pixelsPerSecond

      if (x >= startX && x <= endX) {
        onSelectClip(clip.id)
      }
    })
  }

  return (
    <div
      ref={scrollContainerRef}
      className="overflow-x-auto overflow-y-hidden bg-muted w-full h-full cursor-crosshair"
    >
      <canvas
        ref={timelineRef}
        onClick={handleTimelineClick}
        className="block"
      />
    </div>
  )
}
