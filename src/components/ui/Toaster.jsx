import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import useToastStore from '../../stores/toastStore'

const config = {
  success: { icon: CheckCircle2, accent: 'text-emerald-400', bar: 'bg-emerald-400' },
  error: { icon: XCircle, accent: 'text-red-400', bar: 'bg-red-400' },
  info: { icon: Info, accent: 'text-white/70', bar: 'bg-white/40' },
}

/** Fixed-position toast stack. Mounted once at the app root. */
const Toaster = () => {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 w-80 max-w-[calc(100vw-3rem)]">
      {toasts.map((t) => {
        const c = config[t.type] || config.info
        const Icon = c.icon
        return (
          <div
            key={t.id}
            className="relative flex items-start gap-3 bg-[#161616] border border-white/10 rounded-xl px-4 py-3 shadow-2xl shadow-black/60 animate-[slideIn_0.2s_ease-out] overflow-hidden"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
            <Icon size={17} className={`${c.accent} shrink-0 mt-0.5`} strokeWidth={2} />
            <p className="text-white/85 text-[13px] leading-snug flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="text-white/30 hover:text-white transition-colors cursor-pointer shrink-0"
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}

export default Toaster
