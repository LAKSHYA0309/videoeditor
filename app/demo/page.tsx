'use client'

import { VideoEditor } from '@/components/video-editor'

export default function DemoPage() {
  const demoProject = {
    id: 'demo-project',
    title: 'Demo Project',
    description: 'Welcome to Swift Video Editor',
    duration: 0,
    userId: 'demo-user',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return <VideoEditor project={demoProject} />
}
