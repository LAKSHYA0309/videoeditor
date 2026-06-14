'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Upload, Loader } from 'lucide-react'
import { addMediaAsset } from '@/app/actions/projects'

interface MediaPanelProps {
  projectId: string
  assets: any[]
  onAssetsUpdate: (assets: any[]) => void
}

export function MediaPanel({ projectId, assets, onAssetsUpdate }: MediaPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (!files) return

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        // For now, we'll just add the asset to the list
        // In a real implementation, you'd upload to a service like Vercel Blob
        const asset = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : 'image',
          url: URL.createObjectURL(file),
          fileSize: file.size,
        }

        await addMediaAsset(
          projectId,
          file.name,
          asset.type,
          asset.url,
          { fileSize: file.size }
        )

        onAssetsUpdate([...assets, asset])
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="p-4 h-full flex flex-col">
      <h3 className="font-semibold text-foreground mb-4">Media Assets</h3>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,audio/*,image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        variant="outline"
        className="w-full gap-2 mb-4"
        size="sm"
      >
        {isUploading ? (
          <>
            <Loader className="w-4 h-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Upload Files
          </>
        )}
      </Button>

      <div className="flex-1 overflow-y-auto space-y-2">
        {assets.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No media assets yet. Upload files to get started.
          </p>
        ) : (
          assets.map((asset) => (
            <Card key={asset.id} className="p-2 text-xs hover:bg-accent/50 cursor-move transition">
              <div className="font-medium text-foreground truncate">{asset.name}</div>
              <div className="text-muted-foreground text-xs">
                {asset.type}
                {asset.duration && ` • ${asset.duration}s`}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
