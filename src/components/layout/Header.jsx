import { useState, useRef, useEffect } from 'react'
import { LogOut, Menu, KeyRound, ChevronDown } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import NotificationBell from './NotificationBell'
import ChangePasswordDialog from '../auth/ChangePasswordDialog'

const Header = ({ onLogout, onToggleSidebar }) => {
  const user = useAuthStore((s) => s.user)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pwdOpen, setPwdOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between h-20 px-6 md:px-12 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/6 transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <Menu size={20} strokeWidth={2} />
          </button>

          <div className="flex flex-col gap-0.5">
            <h1 className="text-white font-semibold text-lg tracking-tight leading-none">Enerlyze</h1>
            <p className="hidden sm:block text-white/40 text-xs font-medium leading-none">
              Smart Energy Analysis &amp; AHP Decision Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />

          <div className="w-px h-6 bg-white/8 mx-1" />

          {/* Avatar dropdown */}
          <div ref={ref} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((p) => !p)}
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-lg hover:bg-white/6 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-xs font-bold">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="hidden md:flex flex-col leading-tight items-start">
                <span className="text-white text-sm font-medium">{user?.name}</span>
                <span className="text-white/40 text-xs capitalize">{user?.role}</span>
              </div>
              <ChevronDown
                size={14}
                className={`text-white/40 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute top-full right-0 mt-2 w-56 bg-[#161616] border border-white/10 rounded-xl shadow-2xl shadow-black/60 z-40 overflow-hidden py-1.5">
                <div className="px-4 py-2.5 border-b border-white/8 md:hidden">
                  <p className="text-white text-sm font-medium">{user?.name}</p>
                  <p className="text-white/40 text-xs capitalize">{user?.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    setPwdOpen(true)
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-white/70 hover:text-white hover:bg-white/5 text-[13px] font-medium transition-colors cursor-pointer"
                >
                  <KeyRound size={15} />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onLogout?.()
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/8 text-[13px] font-medium transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <ChangePasswordDialog open={pwdOpen} onClose={() => setPwdOpen(false)} />
    </>
  )
}

export default Header
