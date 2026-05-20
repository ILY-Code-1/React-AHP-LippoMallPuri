import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Calendar } from 'lucide-react'
import { toMonthKey, shiftMonthKey, formatMonthKey } from '../../lib/format'

/**
 * Month picker returning a `YYYY-MM` key.
 * Lists the last `count` months (default 24), newest first.
 */
const MonthSelect = ({ value, onChange, count = 24, className = '', placeholder = 'Pilih Bulan' }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const months = useMemo(() => {
    const now = toMonthKey()
    return Array.from({ length: count }, (_, i) => shiftMonthKey(now, -i))
  }, [count])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between gap-3 bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/15 rounded-lg px-4 py-2.5 cursor-pointer transition-all duration-150 min-w-48 w-full"
      >
        <div className="flex items-center gap-2.5">
          <Calendar size={14} className="text-white/40" />
          <span className={`text-[13px] font-medium ${value ? 'text-white' : 'text-white/40'}`}>
            {value ? formatMonthKey(value) : placeholder}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-white/40 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul className="absolute top-full right-0 mt-2 w-full min-w-48 max-h-72 overflow-y-auto bg-[#161616] border border-white/8 rounded-lg shadow-2xl z-40 py-1.5">
          {months.map((m) => (
            <li key={m}>
              <button
                type="button"
                onClick={() => {
                  onChange(m)
                  setOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-[13px] transition-colors duration-100 ${
                  value === m
                    ? 'bg-white/8 text-white font-medium'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
              >
                {formatMonthKey(m)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MonthSelect
