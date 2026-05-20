import { useEffect } from 'react'
import { X } from 'lucide-react'

/**
 * Generic modal shell (dark theme). Used for add/edit forms across the app.
 * Pass `footer` for action buttons; the body is `children`.
 */
const Modal = ({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  children,
  footer,
  maxWidth = 'max-w-lg',
  loading = false,
}) => {
  useEffect(() => {
    if (!open) return
    const handleKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, loading, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 animate-[fadeIn_0.15s_ease-out] overflow-y-auto">
      <div
        onClick={() => !loading && onClose?.()}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${maxWidth} bg-[#111111] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 animate-[scaleIn_0.18s_ease-out] my-auto`}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="p-7">
          <div className="flex items-start gap-4 mb-6">
            {Icon && (
              <div className="w-11 h-11 shrink-0 rounded-xl bg-white/8 text-white flex items-center justify-center">
                <Icon size={20} strokeWidth={2} />
              </div>
            )}
            <div className="flex-1 pt-0.5 pr-6">
              <h2 className="text-white font-semibold text-base leading-tight">{title}</h2>
              {description && (
                <p className="text-white/50 text-sm leading-relaxed mt-1.5">{description}</p>
              )}
            </div>
          </div>

          <div className="space-y-5">{children}</div>

          {footer && <div className="flex items-center justify-end gap-2 mt-7">{footer}</div>}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export default Modal
