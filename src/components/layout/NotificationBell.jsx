import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, AlertCircle, CalendarClock } from 'lucide-react'
import useAuthStore from '../../stores/authStore'
import useNotificationStore from '../../stores/notificationStore'
import {
  getNotifications, deleteNotification, clearNotifications,
} from '../../services/notificationService'

const typeIcon = {
  'missing-data': AlertCircle,
  'ahp-pending': CalendarClock,
}

/** Header bell: lists the user's AHP-data notifications generated at login. */
const NotificationBell = () => {
  const user = useAuthStore((s) => s.user)
  const refreshKey = useNotificationStore((s) => s.refreshKey)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const ref = useRef(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setItems(await getNotifications(user.id))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [user])

  // Reload on mount and whenever login-time generation signals completion.
  useEffect(() => {
    load()
  }, [load, refreshKey])

  // Re-fetch on open: notifications are generated asynchronously at login,
  // so the initial mount fetch can race ahead of the freshly-written docs.
  const toggleOpen = () => {
    setOpen((p) => {
      const next = !p
      if (next) load()
      return next
    })
  }

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Clicking one notification removes it and navigates to the related page.
  const handleClick = async (n) => {
    setItems((prev) => prev.filter((x) => x.id !== n.id))
    setOpen(false)
    deleteNotification(n.id).catch(() => {})
    if (n.link) navigate(n.link)
  }

  const handleClearAll = async () => {
    setItems([])
    clearNotifications(user.id).catch(() => {})
  }

  const count = items.length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="relative w-10 h-10 flex items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/6 transition-colors cursor-pointer"
        aria-label="Notifikasi"
      >
        <Bell size={18} strokeWidth={2} />
        {count > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-4 h-4 px-1 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-86 max-w-[calc(100vw-2rem)] bg-[#161616] border border-white/10 rounded-xl shadow-2xl shadow-black/60 z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <p className="text-white text-[13px] font-semibold">
              Notifikasi {count > 0 && <span className="text-white/40">({count})</span>}
            </p>
            {count > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 text-white/45 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
              >
                <CheckCheck size={13} />
                Tandai sudah dibaca semua
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && count === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <p className="text-white/35 text-xs">Memuat notifikasi...</p>
              </div>
            ) : count === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2">
                <Bell size={20} className="text-white/20" />
                <p className="text-white/35 text-xs">Tidak ada notifikasi</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = typeIcon[n.type] || Bell
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 shrink-0 rounded-lg bg-white/6 flex items-center justify-center mt-0.5">
                      <Icon size={13} className="text-white/60" />
                    </div>
                    <p className="text-white/70 text-[12px] leading-snug">{n.message}</p>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
