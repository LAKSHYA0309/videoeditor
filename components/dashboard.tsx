'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useSession, signOut } from '@/lib/auth-client'
import { getProjects, createProject, deleteProject } from '@/app/actions/projects'
import { Trash2, Plus, Edit, Play } from 'lucide-react'

interface Project {
  id: string
  title: string
  description?: string
  thumbnail?: string
  duration: number
  createdAt: Date
  updatedAt: Date
}

export function Dashboard() {
  const router = useRouter()
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = await getProjects()
        setProjects(data as Project[])
      } catch (error) {
        console.error('Failed to load projects:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectTitle.trim()) return

    setIsCreating(true)
    try {
      const result = await createProject(newProjectTitle, newProjectDescription)
      setNewProjectTitle('')
      setNewProjectDescription('')
      setShowNewProject(false)

      // Reload projects
      const data = await getProjects()
      setProjects(data as Project[])

      // Navigate to the new project
      router.push(`/editor/${result.id}`)
    } catch (error) {
      console.error('Failed to create project:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      await deleteProject(projectId)
      setProjects((prev) => prev.filter((p) => p.id !== projectId))
    } catch (error) {
      console.error('Failed to delete project:', error)
    }
  }

  const handleLogout = async () => {
    await signOut()
    router.push('/sign-in')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading projects...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Swift Editor</h1>
            <p className="text-sm text-muted-foreground mt-1">Welcome, {session?.user?.name}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      <main className="px-6 py-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-foreground">Your Projects</h2>
          <Button onClick={() => setShowNewProject(!showNewProject)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {showNewProject && (
          <div className="rounded-lg border border-border bg-card p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Create New Project</h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="Enter project title"
                  required
                  disabled={isCreating}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description (optional)
                </label>
                <input
                  type="text"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Enter project description"
                  disabled={isCreating}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowNewProject(false)
                    setNewProjectTitle('')
                    setNewProjectDescription('')
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No projects yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="overflow-hidden rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
                {project.thumbnail ? (
                  <img src={project.thumbnail} alt={project.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <Play className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No thumbnail</p>
                    </div>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-1">{project.title}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground mb-4">
                    {project.duration > 0 ? `${(project.duration / 1000).toFixed(1)}s` : 'No content'}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/editor/${project.id}`} className="flex-1">
                      <Button variant="default" className="w-full gap-2">
                        <Edit className="w-4 h-4" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
