import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'
import { 
  Play, 
  ArrowRight, 
  Layers, 
  Tv, 
  Sliders, 
  Music, 
  Zap, 
  Download, 
  Twitter, 
  Youtube, 
  Instagram,
  Upload,
  Sparkles,
  Scissors
} from 'lucide-react'

// Common Framer Motion animation presets for consistent ultra-premium feel
const fadeUp = {
  initial: { opacity: 0, y: 40, filter: "blur(10px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
}

const scaleUp = {
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 1, ease: [0.16, 1, 0.3, 1] }
}

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const handleStartEditing = () => {
    if (isAuthenticated) {
      navigate('/dashboard')
    } else {
      navigate('/sign-in')
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafafa] relative overflow-hidden selection:bg-blue-500/20 selection:text-white bg-grid-pattern">
      
      {/* Soft Blue Ambient Glow Accents */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-blue-500/[0.04] blur-[160px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/[0.02] blur-[180px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/[0.02] blur-[150px] pointer-events-none" />

      {/* Floating Header Navbar */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="fixed top-5 left-0 right-0 z-50 px-6"
      >
        <div className="mx-auto max-w-5xl h-14 rounded-full border border-white/[0.08] bg-black/40 backdrop-blur-xl px-6 flex items-center justify-between shadow-2xl">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold text-sm tracking-tighter">
              E
            </div>
            <span className="text-[20px] font-[700] tracking-tight text-white select-none">
              Editro
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-[14px] font-[500] text-neutral-400 hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="text-[14px] font-[500] text-neutral-400 hover:text-white transition-colors">Workflow</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-1.5 text-[14px] font-[600] rounded-full bg-white text-black hover:bg-neutral-200 active:scale-95 transition-all"
              >
                Dashboard
              </button>
            ) : (
              <>
                <Link to="/sign-in" className="text-[14px] font-[500] text-neutral-400 hover:text-white transition-colors px-3 py-1.5">
                  Login
                </Link>
                <button
                  onClick={handleStartEditing}
                  className="px-4 py-1.5 text-[14px] font-[600] rounded-full bg-white text-black hover:bg-neutral-200 shadow-md shadow-white/5 active:scale-95 transition-all"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative pt-36 pb-20 md:pt-48 md:pb-28 px-6 text-center">
        <div className="mx-auto max-w-[1000px] flex flex-col items-center">
          
          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[14px] font-[500] text-blue-400 mb-8 select-none hover:bg-blue-500/20 transition-all cursor-pointer">
            <span className="bg-blue-500 text-neutral-950 px-1.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase">New</span>
            <span>AI Captions just get even better →</span>
          </div>

          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[48px] sm:text-[72px] md:text-[96px] font-[800] leading-[0.95] tracking-[-0.05em] max-w-[1000px] text-white select-none"
          >
            Professional Video Editing, <br />
            Directly In Your Browser.
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-8 text-[20px] font-[400] leading-[1.6] max-w-[650px] text-[#A1A1AA]"
          >
            No downloads. No installs. Edit, collaborate and publish videos from anywhere.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex items-center gap-4"
          >
            <button
              onClick={handleStartEditing}
              className="px-6 py-3 rounded-full bg-white text-black text-[15px] font-[600] hover:bg-neutral-200 active:scale-95 transition-all shadow-xl shadow-white/5 flex items-center gap-2 group"
            >
              Start Editing
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => navigate('/demo')}
              className="px-6 py-3 rounded-full bg-white/[0.02] border border-white/[0.08] text-white text-[15px] font-[500] hover:bg-white/[0.06] active:scale-95 transition-all flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-white text-white" />
              Watch Demo
            </button>
          </motion.div>

          {/* Main Editor Showcase */}
          <motion.div 
            {...scaleUp}
            className="relative mt-24 w-full max-w-5xl"
          >
            {/* Soft Ambient Blue Glow behind the editor */}
            <div className="absolute inset-0 -m-8 bg-blue-500/[0.04] blur-[80px] rounded-[32px] pointer-events-none" />

            {/* Floating Media Thumbnail Left */}
            <motion.div 
              initial={{ x: -20, rotate: -4, opacity: 0 }}
              whileInView={{ x: 0, rotate: -8, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.4 }}
              className="absolute left-[-100px] top-[15%] hidden lg:flex flex-col p-2 rounded-xl bg-black/60 border border-white/[0.08] shadow-2xl backdrop-blur-md w-44 select-none z-10 hover:rotate-0 hover:scale-105 transition-all duration-300"
            >
              <div className="aspect-video rounded-lg bg-neutral-900 border border-white/[0.04] relative overflow-hidden">
                <div className="w-full h-full bg-gradient-to-tr from-neutral-900 via-neutral-950 to-neutral-900 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white/20" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent flex items-end p-2 justify-between text-[9px] text-white font-mono font-medium">
                  <span>Nature_4K.mp4</span>
                  <span>00:15</span>
                </div>
              </div>
            </motion.div>

            {/* Floating Media Thumbnail Right */}
            <motion.div 
              initial={{ x: 20, rotate: 4, opacity: 0 }}
              whileInView={{ x: 0, rotate: 6, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="absolute right-[-100px] top-[25%] hidden lg:flex flex-col p-2 rounded-xl bg-black/60 border border-white/[0.08] shadow-2xl backdrop-blur-md w-44 select-none z-10 hover:rotate-0 hover:scale-105 transition-all duration-300"
            >
              <div className="aspect-video rounded-lg bg-neutral-900 border border-white/[0.04] relative overflow-hidden">
                <div className="w-full h-full bg-gradient-to-tr from-neutral-900 via-neutral-950 to-neutral-900 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white/20" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent flex items-end p-2 justify-between text-[9px] text-white font-mono font-medium">
                  <span>Studio_Vlog.mp4</span>
                  <span>00:09</span>
                </div>
              </div>
            </motion.div>

            {/* Large Realistic Editor Mockup Container */}
            <div className="w-full rounded-xl border border-white/[0.08] bg-[#08080a] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
              
              {/* Mockup Header */}
              <div className="h-10 border-b border-white/[0.06] px-4 flex items-center justify-between bg-black/30 select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/[0.06]" />
                  <span className="text-[10px] text-neutral-500 font-medium ml-3 font-mono">Editro Workspace</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06] text-[9px] text-neutral-400 font-mono">16:9 Aspect</span>
                  <button className="px-2.5 py-0.5 rounded bg-blue-600/90 text-white text-[9px] font-semibold hover:bg-blue-500">Share</button>
                </div>
              </div>

              {/* Mockup Content Panel */}
              <div className="flex h-[340px] md:h-[420px]">
                {/* Left Sidebar */}
                <div className="w-12 border-r border-white/[0.06] bg-black/20 py-4 flex flex-col items-center gap-5 select-none">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center bg-blue-600/10 border border-blue-500/20 text-blue-500"><Layers className="w-4 h-4" /></div>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-500 hover:text-white"><Sparkles className="w-4 h-4" /></div>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-500 hover:text-white"><Music className="w-4 h-4" /></div>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-500 hover:text-white"><Sliders className="w-4 h-4" /></div>
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-neutral-500 hover:text-white"><Zap className="w-4 h-4" /></div>
                </div>

                {/* Left Asset Pane */}
                <div className="w-44 border-r border-white/[0.06] bg-black/10 p-3 flex flex-col gap-2 select-none text-left">
                  <span className="text-[9px] uppercase font-bold text-neutral-600 tracking-wider">Media Files</span>
                  <div className="flex flex-col gap-1">
                    {[
                      { name: 'City_Landscape.mp4', dur: '00:10', active: true },
                      { name: 'Drone_Shot.mp4', dur: '00:15', active: false },
                      { name: 'Vocal_Record.wav', dur: '00:24', active: false },
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        className={`p-2 rounded border flex flex-col gap-0.5 ${
                          item.active 
                            ? 'bg-blue-500/10 border-blue-500/20 text-neutral-200' 
                            : 'bg-white/[0.01] border-white/[0.04] text-neutral-500 hover:bg-white/[0.03]'
                        }`}
                      >
                        <span className="text-[9px] font-medium truncate">{item.name}</span>
                        <span className="text-[7px] font-mono opacity-60">{item.dur}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Center Preview Display */}
                <div className="flex-1 bg-black/45 p-4 flex flex-col justify-between relative overflow-hidden select-none">
                  <div className="w-full flex-1 rounded-lg border border-white/[0.04] bg-[#040405] overflow-hidden relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-neutral-900 via-neutral-950 to-neutral-900 flex items-center justify-center">
                      <Play className="w-8 h-8 text-white/20" />
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/55 backdrop-blur text-[8px] text-white font-mono">
                      City_Landscape.mp4
                    </div>
                  </div>

                  {/* Player controls */}
                  <div className="w-full flex items-center justify-between text-neutral-500 text-[9px] pt-3 font-mono">
                    <span>00:08.12</span>
                    <div className="flex items-center gap-3">
                      <button className="hover:text-white">◀</button>
                      <button className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center hover:bg-neutral-200">▶</button>
                      <button className="hover:text-white">▶</button>
                    </div>
                    <span>100% Fit</span>
                  </div>
                </div>

                {/* Right Properties Sidepane */}
                <div className="w-40 border-l border-white/[0.06] bg-black/10 p-3 flex flex-col gap-4 text-left select-none">
                  <span className="text-[9px] uppercase font-bold text-neutral-600 tracking-wider">Properties</span>
                  <div className="flex flex-col gap-3 font-mono text-[9px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-neutral-400">Position</span>
                      <div className="flex gap-1">
                        <span className="flex-1 text-center py-0.5 bg-black/45 rounded border border-white/[0.04] text-neutral-400">X: 0</span>
                        <span className="flex-1 text-center py-0.5 bg-black/45 rounded border border-white/[0.04] text-neutral-400">Y: 0</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-neutral-400">
                        <span>Opacity</span>
                        <span className="text-white">100%</span>
                      </div>
                      <div className="h-1 bg-neutral-800 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Bottom Timeline */}
              <div className="border-t border-white/[0.06] bg-[#040405] p-3 flex flex-col gap-2 relative select-none">
                <div className="flex flex-col gap-1.5 font-mono text-[9px]">
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-neutral-600 text-left">Video 1</span>
                    <div className="flex-1 h-6 rounded bg-blue-500/10 border border-blue-500/20 flex items-center px-2 text-blue-400">
                      <span>City_Landscape.mp4</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-neutral-600 text-left">Audio 1</span>
                    <div className="flex-1 h-6 rounded bg-blue-500/5 border border-blue-500/10 flex items-center px-2 text-neutral-400 relative overflow-hidden">
                      <div className="absolute inset-x-0 bottom-1 h-2 opacity-20 flex items-center gap-0.5">
                        {[20, 50, 30, 70, 40, 80, 50, 30, 60, 20, 80, 40].map((h, i) => (
                          <div key={i} className="flex-1 bg-white rounded-sm" style={{ height: `${h}%` }} />
                        ))}
                      </div>
                      <span>Vocal_Record.wav</span>
                    </div>
                  </div>
                </div>

                {/* Vertical Playhead Cursor */}
                <div className="absolute left-[38%] top-0 bottom-0 w-[1px] bg-blue-500 z-20 flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-neutral-900 mt-[-4px]" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Creator Features Section */}
      <section id="features" className="py-24 md:py-32 border-t border-white/[0.06] bg-black/20 px-6 relative">
        <div className="mx-auto max-w-5xl text-center">
          
          <motion.h2 
            {...fadeUp}
            className="text-[36px] sm:text-[48px] md:text-[56px] font-[700] leading-[1.1] tracking-[-0.04em] text-white select-none max-w-xl mx-auto"
          >
            Everything you need to create without limits.
          </motion.h2>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Layers className="w-4 h-4 text-blue-400" />,
                title: "Multi-track Timeline",
                desc: "Layer videos, audio, text, and effects with precision and ease."
              },
              {
                icon: <Tv className="w-4 h-4 text-blue-400" />,
                title: "Video Transitions",
                desc: "Smooth, cinematic transitions to elevate your edits."
              },
              {
                icon: <Sliders className="w-4 h-4 text-blue-400" />,
                title: "Color Grading",
                desc: "Professional color tools to make your footage stand out."
              },
              {
                icon: <Music className="w-4 h-4 text-blue-400" />,
                title: "Audio Editing",
                desc: "Edit, clean, and enhance audio with powerful tools."
              },
              {
                icon: <Sparkles className="w-4 h-4 text-blue-400" />,
                title: "Motion Effects",
                desc: "Cinematic, custom motion presets built for modern creators."
              },
              {
                icon: <Zap className="w-4 h-4 text-blue-400" />,
                title: "Export in 4K",
                desc: "Export your videos in stunning 4K quality."
              }
            ].map((feat, idx) => (
              <motion.div 
                key={idx}
                {...fadeUp}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
                className="p-8 rounded-[20px] border border-white/[0.06] bg-black/40 hover:bg-white/[0.02] hover:border-white/[0.12] transition-all duration-300 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                    {feat.icon}
                  </div>
                  <h3 className="mt-6 text-[22px] font-[600] text-white tracking-tight">{feat.title}</h3>
                  <p className="mt-2 text-[16px] font-[400] leading-relaxed text-neutral-400">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Edit With Absolute Precision Timeline Section */}
      <section className="py-24 md:py-32 border-t border-white/[0.06] px-6">
        <div className="mx-auto max-w-5xl flex flex-col items-center">
          
          <motion.h2 
            {...fadeUp}
            className="text-[36px] sm:text-[48px] md:text-[56px] font-[700] leading-[1.1] tracking-[-0.04em] text-white select-none max-w-xl text-center"
          >
            Edit With Absolute Precision
          </motion.h2>
          
          <motion.p
            {...fadeUp}
            className="mt-4 text-[16px] sm:text-[18px] font-[400] leading-[1.7] text-[#A1A1AA] max-w-[650px] text-center mb-16"
          >
            Our high-performance timeline editor offers granular control over every frame, track, and layer without browser slowdowns.
          </motion.p>

          {/* Large Timeline Preview */}
          <motion.div 
            {...scaleUp}
            className="w-full rounded-xl border border-white/[0.08] bg-[#08080a] p-4 flex flex-col gap-3.5 select-none font-mono text-[9px] shadow-2xl relative"
          >
            {/* Header / Info row */}
            <div className="flex items-center justify-between text-neutral-500 border-b border-white/[0.04] pb-2">
              <span>Timeline Workspace</span>
              <span>00:12.18 / 00:45.00</span>
            </div>

            {/* Timeline Tracks */}
            <div className="flex flex-col gap-2 text-left">
              {/* Video track 1 */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-neutral-600 text-left font-semibold">Video Track</span>
                <div className="flex-1 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center px-3 text-blue-400 relative">
                  <span>Intro_A.mp4</span>
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-blue-500/20 rounded-r" />
                </div>
              </div>

              {/* Text track 1 */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-neutral-600 text-left font-semibold">Text Track</span>
                <div className="flex-[0.6] h-8 rounded bg-white/[0.03] border border-white/[0.08] flex items-center px-3 text-neutral-200">
                  <span>Lower Third Overlay</span>
                </div>
                <div className="flex-[0.4]" />
              </div>

              {/* Audio track 1 */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-neutral-600 text-left font-semibold">Audio Track</span>
                <div className="flex-1 h-8 rounded bg-white/[0.01] border border-white/[0.04] flex items-center px-3 text-neutral-400 relative overflow-hidden">
                  <div className="absolute inset-x-0 bottom-1.5 h-3 opacity-20 flex items-center gap-0.5">
                    {[10, 40, 60, 20, 80, 50, 30, 90, 40, 70, 30, 50, 20, 60, 40].map((h, i) => (
                      <div key={i} className="flex-1 bg-white rounded-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <span>Background_Soundtrack.mp3</span>
                </div>
              </div>
            </div>

            {/* Playhead Marker */}
            <div className="relative h-2 w-full">
              <div className="absolute left-[45%] top-[-100px] bottom-0 w-[1px] bg-blue-500 flex flex-col items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 border border-[#08080a] mt-[-5px]" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* Workflow Section */}
      <section id="workflow" className="py-24 md:py-32 border-t border-white/[0.06] px-6">
        <div className="mx-auto max-w-5xl text-center">
          
          <motion.h2 
            {...fadeUp}
            className="text-[36px] sm:text-[48px] md:text-[56px] font-[700] leading-[1.1] tracking-[-0.04em] text-white select-none max-w-xl mx-auto text-center"
          >
            How it works
          </motion.h2>

          <div className="mt-20 grid gap-8 md:grid-cols-4 text-left">
            {[
              {
                step: "01",
                icon: <Upload className="w-4 h-4 text-blue-400" />,
                title: "Import Media",
                desc: "Upload local video files and sound clips securely onto our serverless media drive."
              },
              {
                step: "02",
                icon: <Scissors className="w-4 h-4 text-blue-400" />,
                title: "Edit Timeline",
                desc: "Trim, slice, and sequence your assets along our high-performance multitrack layout."
              },
              {
                step: "03",
                icon: <Sparkles className="w-4 h-4 text-blue-400" />,
                title: "Add Effects",
                desc: "Apply cinematic speed presets, visual parameters, and overlays instantly."
              },
              {
                step: "04",
                icon: <Download className="w-4 h-4 text-blue-400" />,
                title: "Export Video",
                desc: "Render high-bitrate outputs or publish direct link sharing."
              }
            ].map((step, idx) => (
              <motion.div 
                key={idx}
                {...fadeUp}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                className="relative flex flex-col gap-5 p-8 rounded-[20px] border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03] transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-white/[0.02] border border-white/[0.08] flex items-center justify-center">
                    {step.icon}
                  </div>
                  <span className="text-[14px] font-[700] font-mono text-neutral-500">{step.step}</span>
                </div>
                <h3 className="text-[22px] font-[600] text-white tracking-tight mt-2">{step.title}</h3>
                <p className="text-[16px] font-[400] leading-relaxed text-neutral-400">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#020203] px-6 py-16 text-left text-neutral-500 select-none">
        <div className="mx-auto max-w-5xl grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Logo brand */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-white text-black flex items-center justify-center font-bold text-xs">
                E
              </div>
              <span className="text-[14px] font-[600] text-white">Editro</span>
            </Link>
            <p className="text-[13px] text-neutral-600 max-w-xs leading-relaxed">
              Professional browser-based video editing framework. Minimalist design, cinematic performance.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 mt-2">
              <a href="#" className="w-7 h-7 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-center hover:text-white transition-colors"><Twitter className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-7 h-7 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-center hover:text-white transition-colors"><Youtube className="w-3.5 h-3.5" /></a>
              <a href="#" className="w-7 h-7 rounded-md bg-white/[0.02] border border-white/[0.06] flex items-center justify-center hover:text-white transition-colors"><Instagram className="w-3.5 h-3.5" /></a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <span className="text-[14px] font-[600] uppercase tracking-wider text-white">Product</span>
            <ul className="mt-4 space-y-2.5 text-[14px] font-[400]">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Workflow</a></li>
            </ul>
          </div>

          <div>
            <span className="text-[14px] font-[600] uppercase tracking-wider text-white">Resources</span>
            <ul className="mt-4 space-y-2.5 text-[14px] font-[400]">
              <li><a href="#" className="hover:text-white transition-colors">Docs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tutorials</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
            </ul>
          </div>

          <div>
            <span className="text-[14px] font-[600] uppercase tracking-wider text-white">Company</span>
            <ul className="mt-4 space-y-2.5 text-[14px] font-[400]">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mx-auto max-w-5xl border-t border-white/[0.04] mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-neutral-600">
          <span>&copy; {new Date().getFullYear()} Editro, Inc. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-neutral-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-neutral-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-neutral-400 transition-colors">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
