import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import LippoLogo from '../../components/layout/LippoLogo'
import useAuthStore, { hasSessionCookie } from '../../stores/authStore'
import { login as loginService } from '../../services/authService'
import { generateNotifications } from '../../services/notificationService'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const { isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  // Already-logged-in users (valid cookie) skip the login screen.
  useEffect(() => {
    if (isAuthenticated && hasSessionCookie() && user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const account = await loginService({ email, password })
      login(account)
      // Notifications are regenerated on every login.
      generateNotifications(account).catch(() => {})
      navigate(account.role === 'admin' ? '/admin/dashboard' : '/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Gagal masuk. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-150 h-100 bg-white/4 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 w-100 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-100 flex flex-col gap-10">
          {/* Brand block */}
          <div className="flex flex-col items-center text-center gap-3">
            <LippoLogo size="lg" className="mb-4" />
            <h1 className="text-white font-bold text-5xl tracking-tight leading-none">Enerlyze</h1>
            <p className="text-white/55 text-sm font-medium leading-relaxed max-w-xs">
              Smart Energy Analysis &amp; AHP Decision Engine
            </p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* Email */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-white font-semibold text-sm tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                className="w-full bg-white/5 border border-white/15 focus:border-white/60 focus:bg-white/10 text-white text-[15px] px-4 py-3 rounded-xl outline-none transition-all duration-200"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-white font-semibold text-sm tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/15 focus:border-white/60 focus:bg-white/10 text-white text-[17px] px-4 py-3 pr-12 rounded-xl outline-none transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 animate-[shake_0.4s_ease-in-out]">
                <div className="w-1 h-4 bg-red-400 rounded-full shrink-0" />
                <p className="text-red-400 text-xs font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="group w-full bg-white text-black font-semibold text-sm h-12 rounded-full hover:bg-white/95 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer shadow-[0_10px_40px_-12px_rgba(255,255,255,0.3)] hover:shadow-[0_14px_44px_-10px_rgba(255,255,255,0.4)] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  <span>Memuat...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight
                    size={15}
                    strokeWidth={2.5}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </form>

          <p className="text-white/30 text-[10px] tracking-[0.25em] uppercase text-center">
            © 2026 Lippo Mall Puri
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}

export default LoginPage
