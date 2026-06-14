import { useState } from 'react'
import { ArrowLeft, Save, Download, Play, Pause, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Demo() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('My Video Project')
  const [isEditing, setIsEditing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(100)
  const [zoom, setZoom] = useState(100)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-muted rounded-md"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            {isEditing ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="px-3 py-2 rounded-md border border-border bg-background text-foreground"
                autoFocus
              />
            ) : (
              <h1
                className="text-xl font-semibold text-foreground cursor-pointer hover:text-primary"
                onClick={() => setIsEditing(true)}
              >
                {title}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-muted rounded-md text-foreground">
              <Save className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-muted rounded-md text-foreground">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main editor layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Media Assets */}
        <div className="w-64 border-r border-border bg-card overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Media Assets</h3>
            <button className="w-full px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 mb-4">
              <Plus className="w-4 h-4" />
              Upload Media
            </button>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Video files: MP4, WebM, MOV</p>
              <p>Audio files: MP3, WAV, AAC</p>
              <p>Images: JPG, PNG, GIF</p>
            </div>
          </div>
        </div>

        {/* Center panel - Preview and Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview area */}
          <div className="flex-1 bg-black flex items-center justify-center border-b border-border">
            <div className="text-center">
              <div className="w-96 h-56 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-white text-sm font-semibold">Video Preview Area</div>
              </div>
            </div>
          </div>

          {/* Playback controls */}
          <div className="bg-card border-b border-border p-4">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-muted rounded-md text-foreground transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </button>
              <div className="flex-1 bg-muted rounded-full h-2 cursor-pointer hover:bg-muted/80"></div>
              <span className="text-sm text-muted-foreground w-20 text-right">{currentTime.toFixed(1)}s / {duration.toFixed(1)}s</span>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-2">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">−</button>
              <span className="text-sm text-muted-foreground w-12 text-center">{zoom}%</span>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">+</button>
            </div>
          </div>

          {/* Timeline */}
          <div className="h-48 bg-muted border-t border-border overflow-x-auto">
            <div className="p-4 min-w-max">
              <div className="mb-4">
                <div className="text-sm font-semibold text-foreground mb-2">Video Track 1</div>
                <div className="h-20 bg-card rounded-md border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm hover:border-primary/50 transition-colors">
                  Drag & drop video clips here
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm font-semibold text-foreground mb-2">Video Track 2</div>
                <div className="h-20 bg-card rounded-md border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm hover:border-primary/50 transition-colors">
                  Drag & drop video clips here
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground mb-2">Audio Track</div>
                <div className="h-12 bg-card rounded-md border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm hover:border-primary/50 transition-colors">
                  Drag & drop audio here
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - Properties */}
        <div className="w-64 border-l border-border bg-card overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Properties</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Opacity</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="100"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-8">100%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Scale</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="200"
                    defaultValue="100"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-8">100%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Rotation</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    defaultValue="0"
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-8">0°</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
