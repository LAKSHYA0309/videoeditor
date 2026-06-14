'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

interface PropertiesPanelProps {
  selectedClip: string | null
  onClipUpdate: (clips: any[]) => void
}

export function PropertiesPanel({ selectedClip, onClipUpdate }: PropertiesPanelProps) {
  if (!selectedClip) {
    return (
      <div className="p-4 h-full flex flex-col">
        <h3 className="font-semibold text-foreground mb-4">Properties</h3>
        <p className="text-sm text-muted-foreground">Select a clip to edit its properties</p>
      </div>
    )
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="font-semibold text-foreground mb-4">Clip Properties</h3>

      <div className="space-y-4 flex-1 overflow-y-auto">
        <Card className="p-3">
          <Label className="text-xs text-muted-foreground">Opacity</Label>
          <input type="range" min="0" max="100" defaultValue="100" className="w-full mt-2" />
        </Card>

        <Card className="p-3">
          <Label className="text-xs text-muted-foreground">Scale</Label>
          <input type="range" min="50" max="200" defaultValue="100" className="w-full mt-2" />
        </Card>

        <Card className="p-3">
          <Label className="text-xs text-muted-foreground">Rotation</Label>
          <input type="range" min="0" max="360" defaultValue="0" className="w-full mt-2" />
        </Card>

        <Card className="p-3">
          <Label className="text-xs text-muted-foreground">Playback Speed</Label>
          <select className="w-full mt-2 bg-background border border-input rounded px-2 py-1 text-xs">
            <option>0.5x</option>
            <option>0.75x</option>
            <option selected>1x</option>
            <option>1.25x</option>
            <option>1.5x</option>
            <option>2x</option>
          </select>
        </Card>
      </div>

      <Button variant="destructive" size="sm" className="w-full gap-2 mt-4">
        <Trash2 className="w-4 h-4" />
        Delete Clip
      </Button>
    </div>
  )
}
