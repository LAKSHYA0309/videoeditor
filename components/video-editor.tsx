'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Download, Play, Pause, Plus } from 'lucide-react'
import { EditorToolbar } from './editor/toolbar'
import { MediaPanel } from './editor/media-panel'
import { TimelinePanel } from './editor/timeline-panel'
import { PreviewPanel } from './editor/preview-panel'
import { PropertiesPanel } from './editor/properties-panel'

interface EditorProps {
  project: any
}

export function VideoEditor({ project }: EditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(project.title)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [clips, setClips] = useState([])
  const [mediaAssets, setMediaAssets] = useState([])
  const [selectedClip, setSelectedClip] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [zoom, setZoom] = useState(100)

  // Load project data
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const { getProjectClips, getProjectMediaAssets } = await import('@/app/actions/projects')
        const [clipsData, assetsData] = await Promise.all([
          getProjectClips(project.id),
          getProjectMediaAssets(project.id),
        ])
        setClips(clipsData || [])
        setMediaAssets(assetsData || [])
      } catch (error) {
        console.error('Failed to load project data:', error)
      }
    }

    loadProjectData()
  }, [project.id])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { updateProject } = await import('@/app/actions/projects')
      await updateProject(project.id, { title })
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to save project:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleBack = () => {
    router.push('/')
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between bg-muted/50">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="max-w-xs rounded-md border border-border bg-background px-3 py-2 text-foreground"
              autoFocus
            />
          ) : (
            <h1 className="text-xl font-semibold text-foreground cursor-pointer" onClick={() => setIsEditing(true)}>
              {title}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-2">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left Panel - Media Assets */}
        <div className="w-64 border-r border-border bg-muted/30 overflow-y-auto">
          <MediaPanel projectId={project.id} assets={mediaAssets} onAssetsUpdate={setMediaAssets} />
        </div>

        {/* Center - Preview and Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview */}
          <div className="flex-1 bg-black overflow-hidden border-b border-border">
            <PreviewPanel clips={clips} isPlaying={isPlaying} currentTime={currentTime} />
          </div>

          {/* Playback Controls */}
          <div className="px-4 py-3 border-b border-border flex items-center gap-4 bg-muted/50">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsPlaying(!isPlaying)}
              className="rounded-full"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <div className="text-xs text-muted-foreground">
              {(currentTime / 1000).toFixed(2)}s
            </div>
            <div className="flex-1 bg-muted rounded h-1" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Zoom:</span>
              <input
                type="range"
                min="50"
                max="200"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-xs text-muted-foreground">{zoom}%</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="h-48 border-t border-border overflow-x-auto overflow-y-hidden">
            <TimelinePanel
              clips={clips}
              selectedClip={selectedClip}
              onSelectClip={setSelectedClip}
              zoom={zoom}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
            />
          </div>
        </div>

        {/* Right Panel - Properties */}
        <div className="w-72 border-l border-border bg-muted/30 overflow-y-auto">
          <PropertiesPanel selectedClip={selectedClip} onClipUpdate={setClips} />
        </div>
      </div>
    </div>
  )
}
