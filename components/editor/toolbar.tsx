'use client'

import { Button } from '@/components/ui/button'
import { Scissors, Type, Volume2, Zap } from 'lucide-react'

export function EditorToolbar() {
  return (
    <div className="flex items-center gap-2 border-b border-border px-4 py-2 bg-muted/50">
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" title="Cut" className="gap-2">
          <Scissors className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Add Text" className="gap-2">
          <Type className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Audio" className="gap-2">
          <Volume2 className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" title="Effects" className="gap-2">
          <Zap className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
