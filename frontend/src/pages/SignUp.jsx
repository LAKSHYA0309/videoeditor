import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

export default function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signUp(email, password, name)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#fafafa] relative overflow-hidden font-sans selection:bg-blue-500/20 selection:text-white bg-grid-pattern flex items-center justify-center px-6">
      {/* Glow effect */}
      <div className="absolute top-[20%] left-[30%] w-[40%] h-[40%] rounded-full bg-blue-500/[0.03] blur-[130px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md space-y-8 p-8 rounded-2xl border border-white/[0.06] bg-black/40 backdrop-blur-xl shadow-2xl relative"
      >
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>

        <div className="text-left">
          <h1 className="text-[32px] font-[800] text-white tracking-tight leading-none mb-3">
            Create Account
          </h1>
          <p className="text-[14px] text-neutral-400 font-[400] leading-relaxed">
            Get started by spinning up your free editor workspace.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-[13px] text-red-400 text-left"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2 text-left">
            <label className="text-[12px] font-[600] uppercase tracking-wider text-neutral-400">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-[14px] text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none disabled:opacity-50 transition-colors"
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[12px] font-[600] uppercase tracking-wider text-neutral-400">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-[14px] text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none disabled:opacity-50 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2 text-left">
            <label className="text-[12px] font-[600] uppercase tracking-wider text-neutral-400">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-[14px] text-white placeholder-neutral-500 focus:border-white/[0.2] focus:outline-none disabled:opacity-50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white text-black py-2.5 text-[15px] font-[600] hover:bg-neutral-200 disabled:opacity-50 active:scale-98 transition-all flex items-center justify-center shadow-lg shadow-white/5 font-sans"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-[13px] border-t border-white/[0.04] pt-4">
          <p className="text-neutral-400">
            Already have an account?{' '}
            <Link to="/sign-in" className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
