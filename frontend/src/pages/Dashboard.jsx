import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Search, Sliders, Play, Scissors, Layers } from 'lucide-react'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('recent') // 'recent' | 'templates' | 'drafts'
  
  const navigate = useNavigate()
  const { user, sessionToken, signOut } = useAuth()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${sessionToken}` }
      })
      const data = await res.json()
      setProjects(data)
    } catch (error) {
      console.error('[v0] Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (titleText) => {
    const title = titleText || newProjectTitle
    if (!title.trim()) return

    setCreating(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ title })
      })
      const newProject = await res.json()
      setProjects([newProject, ...projects])
      setNewProjectTitle('')
    } catch (error) {
      console.error('[v0] Error creating project:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation() // Prevent clicking the card
    try {
      await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${sessionToken}` }
      })
      setProjects(projects.filter(p => p.id !== id))
    } catch (error) {
      console.error('[v0] Error deleting project:', error)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/sign-in')
  }

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    return projects.filter(project => 
      project.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [projects, searchQuery])

  // Mock drafts for the 'drafts' tab
  const mockDrafts = useMemo(() => {
    return [
      { id: 'draft-1', title: 'Untitled Draft 1', description: 'Modified 2 hours ago', duration: 15 },
      { id: 'draft-2', title: 'Summer Vlog Outline', description: 'Modified yesterday', duration: 45 }
    ].filter(draft => draft.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery])


  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505] text-[#fafafa] bg-grid-pattern">
        <div className="text-center space-y-4">
          <div className="size-10 mx-auto rounded-lg border-2 border-white/20 border-t-white animate-spin"></div>
          <p className="text-xs text-neutral-400 font-mono">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafafa] relative overflow-hidden font-sans selection:bg-blue-500/20 selection:text-white bg-grid-pattern flex flex-col">
      {/* Glow effect */}
      <div className="absolute top-[-10%] right-[20%] w-[50%] h-[50%] rounded-full bg-blue-500/[0.03] blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/[0.06] bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-white text-black flex items-center justify-center font-bold text-xs tracking-tighter">
              E
            </div>
            <span className="font-semibold text-sm tracking-tight text-white select-none">
              Editro Dashboard
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[12px] text-neutral-400 font-mono hidden sm:inline">Welcome, {user?.name || user?.email}</span>
            <button
              onClick={handleSignOut}
              className="px-4 py-1.5 rounded-full border border-white/[0.08] hover:bg-white/[0.04] text-xs font-semibold text-white transition-all active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="mx-auto max-w-7xl px-6 py-10 w-full flex-1 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav Categories */}
        <div className="w-full md:w-56 shrink-0 flex flex-col gap-6 text-left">
          <div className="flex flex-col gap-1 select-none">
            <span className="text-[9px] uppercase font-bold tracking-wider text-neutral-500 mb-2">Workspace</span>
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'recent' 
                  ? 'bg-white/[0.04] border border-white/[0.08] text-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Recent Projects
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={`px-4 py-2.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2.5 transition-all ${
                activeTab === 'drafts' 
                  ? 'bg-white/[0.04] border border-white/[0.08] text-white' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              Drafts
            </button>
          </div>

          <div className="h-[1px] bg-white/[0.06]" />

          {/* Quick Create Action */}
          <div className="p-4 rounded-xl border border-white/[0.06] bg-black/40 backdrop-blur-xl space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">New Project</h4>
            <input
              type="text"
              placeholder="Title (e.g. Cinematic Intro)"
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              disabled={creating}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none"
            />
            <button
              onClick={() => handleCreateProject()}
              disabled={creating || !newProjectTitle.trim()}
              className="w-full py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col gap-6 text-left">
          
          {/* Top Bar with Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-[28px] font-[800] text-white tracking-tight leading-none mb-1">
                {activeTab === 'recent' && 'Recent Projects'}
                {activeTab === 'drafts' && 'Project Drafts'}
              </h2>
              <p className="text-[12px] text-neutral-500 font-mono">
                {activeTab === 'recent' && `${filteredProjects.length} active projects`}
                {activeTab === 'drafts' && `${mockDrafts.length} drafts saved`}
              </p>
            </div>

            {/* Search Input */}
            {activeTab !== 'templates' && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-[50%] translate-y-[-50%]" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-white/[0.08] bg-white/[0.02] pl-9 pr-4 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none transition-colors"
                />
              </div>
            )}
          </div>

          <div className="h-[1px] bg-white/[0.06]" />

          {/* List display */}
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {/* RECENTS TAB */}
              {activeTab === 'recent' && (
                <motion.div 
                  key="recent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {filteredProjects.length === 0 ? (
                    <div className="col-span-full py-16 text-center rounded-2xl border border-white/[0.06] bg-black/20">
                      <p className="text-xs text-neutral-400 font-mono">No projects found. Create one to get started!</p>
                    </div>
                  ) : (
                    filteredProjects.map((project) => (
                      <motion.div 
                        key={project.id}
                        layoutId={project.id}
                        onClick={() => navigate(`/editor/${project.id}`)}
                        className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#0c0c0e] hover:border-white/[0.12] hover:scale-[1.02] active:scale-98 transition-all duration-300 cursor-pointer shadow-lg shadow-black/40 flex flex-col justify-between h-48"
                      >
                        {/* Mock image background / cover */}
                        <div className="h-24 bg-gradient-to-tr from-neutral-900 via-neutral-950 to-neutral-900 border-b border-white/[0.04] relative flex items-center justify-center group-hover:opacity-90">
                          <Play className="w-6 h-6 text-white/20 group-hover:text-white/60 transition-colors" />
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-0.5">
                            <h3 className="text-[14px] font-semibold text-white tracking-tight truncate group-hover:text-blue-400 transition-colors">{project.title}</h3>
                            <p className="text-[10px] text-neutral-500 font-mono">
                              Created {new Date(project.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center justify-end">
                            <button
                              onClick={(e) => handleDeleteProject(project.id, e)}
                              className="p-1 rounded hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}


              {/* DRAFTS TAB */}
              {activeTab === 'drafts' && (
                <motion.div 
                  key="drafts"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                  {mockDrafts.length === 0 ? (
                    <div className="col-span-full py-16 text-center rounded-2xl border border-white/[0.06] bg-black/20">
                      <p className="text-xs text-neutral-400 font-mono">No drafts matching query.</p>
                    </div>
                  ) : (
                    mockDrafts.map((draft) => (
                      <div 
                        key={draft.id}
                        className="p-5 rounded-xl border border-white/[0.06] bg-[#0c0c0e] flex flex-col justify-between h-36"
                      >
                        <div className="space-y-1">
                          <h3 className="text-[14px] font-semibold text-white tracking-tight">{draft.title}</h3>
                          <p className="text-[12px] text-neutral-400 leading-normal">{draft.description}</p>
                        </div>
                        <div className="flex items-center justify-between font-mono text-[9px] text-neutral-600">
                          <span>{draft.duration}s length</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.02] border border-white/[0.06] text-neutral-500">Draft</span>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
