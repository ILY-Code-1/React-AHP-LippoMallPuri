import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import Button from './Button'

const variantStyles = {
  danger: {
    iconWrap: 'bg-red-500/10 text-red-400',
    confirmVariant: 'danger',
  },
  primary: {
    iconWrap: 'bg-white/8 text-white',
    confirmVariant: 'primary',
  },
}

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  description = 'Apakah Anda yakin?',
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal',
  variant = 'primary',
  icon: Icon = AlertTriangle,
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

  const styles = variantStyles[variant] ?? variantStyles.primary

  const handleBackdropClick = () => {
    if (!loading) onClose?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 animate-[fadeIn_0.15s_ease-out]">
      {/* Backdrop */}
      <div
        onClick={handleBackdropClick}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 animate-[scaleIn_0.18s_ease-out]"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          aria-label="Tutup"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <div className="p-7">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${styles.iconWrap}`}>
              <Icon size={20} strokeWidth={2} />
            </div>
            <div className="flex-1 pt-0.5">
              <h2 className="text-white font-semibold text-base leading-tight">{title}</h2>
              <p className="text-white/55 text-sm leading-relaxed mt-2">{description}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-7">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              {cancelText}
            </Button>
            <Button variant={styles.confirmVariant} onClick={onConfirm} disabled={loading}>
              {loading ? 'Memproses...' : confirmText}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export default ConfirmDialog
