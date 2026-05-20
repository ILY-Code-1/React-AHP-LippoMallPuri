import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

/**
 * Generic single-select dropdown styled for the dark theme.
 * `options` = [{ value, label }].
 */
const Dropdown = ({
  value,
  onChange,
  options = [],
  placeholder = 'Pilih',
  icon: Icon,
  className = '',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between gap-3 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/15 rounded-lg px-4 py-2.5 cursor-pointer transition-all duration-150 min-w-48 w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && <Icon size={14} className="text-white/40 shrink-0" />}
          <span
            className={`text-[13px] font-medium truncate ${selected ? 'text-white' : 'text-white/40'}`}
          >
            {selected ? selected.label : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-white/40 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && options.length > 0 && (
        <ul className="absolute top-full left-0 mt-2 w-full min-w-48 max-h-72 overflow-y-auto bg-[#161616] border border-white/8 rounded-lg shadow-2xl z-40 py-1.5">
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-[13px] transition-colors duration-100 ${
                  value === o.value
                    ? 'bg-white/8 text-white font-medium'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Dropdown
