import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Check } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate sending email reset link
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
    }, 1200)
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
          to="/sign-in" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to login
        </Link>

        <div className="text-left">
          <h1 className="text-[32px] font-[800] text-white tracking-tight leading-none mb-3">
            Reset Password
          </h1>
          <p className="text-[14px] text-neutral-400 font-[400] leading-relaxed">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 text-left flex gap-3"
          >
            <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-blue-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-[14px] font-[600] text-white">Reset link sent</h4>
              <p className="text-[12px] text-neutral-400 leading-relaxed">
                If that account exists, we sent an email with reset instructions to <strong className="text-neutral-200">{email}</strong>.
              </p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-lg bg-white text-black py-2.5 text-[15px] font-[600] hover:bg-neutral-200 disabled:opacity-50 active:scale-98 transition-all flex items-center justify-center shadow-lg shadow-white/5"
            >
              {loading ? 'Sending link...' : 'Send reset link'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
