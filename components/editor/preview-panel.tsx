'use client'

import { useEffect, useRef } from 'react'

interface PreviewPanelProps {
  clips: any[]
  isPlaying: boolean
  currentTime: number
}

export function PreviewPanel({ clips, isPlaying, currentTime }: PreviewPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Draw background
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw placeholder
    ctx.fillStyle = '#666666'
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Preview', canvas.width / 2, canvas.height / 2)

    // Draw current time
    ctx.fillStyle = '#ffffff'
    ctx.font = '12px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(`Time: ${(currentTime / 1000).toFixed(2)}s`, 10, 20)

    // Draw clip indicators
    ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
    clips.forEach((clip, index) => {
      const y = 50 + index * 30
      ctx.fillRect(10, y, 100, 20)
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(clip.name, 15, y + 15)
      ctx.fillStyle = 'rgba(255, 100, 100, 0.5)'
    })
  }, [clips, currentTime])

  return <canvas ref={canvasRef} className="w-full h-full" />
}
