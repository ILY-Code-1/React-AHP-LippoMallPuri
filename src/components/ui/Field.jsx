import { useState } from 'react'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'

/** Shared label + error wrapper for form fields. */
const FieldShell = ({ label, error, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="text-white/70 text-xs font-semibold tracking-wide">{label}</label>
    )}
    {children}
    {hint && !error && <p className="text-white/35 text-[11px]">{hint}</p>}
    {error && <p className="text-red-400 text-[11px] font-medium">{error}</p>}
  </div>
)

const inputClass =
  'w-full bg-white/5 border border-white/12 focus:border-white/45 focus:bg-white/8 text-white text-sm px-3.5 py-2.5 rounded-lg outline-none transition-all duration-150 placeholder:text-white/25 disabled:opacity-50'

/** Plain text / number / email input. */
export const TextField = ({ label, error, hint, ...props }) => (
  <FieldShell label={label} error={error} hint={hint}>
    <input className={inputClass} {...props} />
  </FieldShell>
)

/** Textarea input. */
export const TextAreaField = ({ label, error, hint, rows = 3, ...props }) => (
  <FieldShell label={label} error={error} hint={hint}>
    <textarea rows={rows} className={`${inputClass} resize-none`} {...props} />
  </FieldShell>
)

/** Password input with a show/hide toggle. */
export const PasswordField = ({ label, error, hint, ...props }) => {
  const [show, setShow] = useState(false)
  return (
    <FieldShell label={label} error={error} hint={hint}>
      <div className="relative">
        <input type={show ? 'text' : 'password'} className={`${inputClass} pr-10`} {...props} />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          tabIndex={-1}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-colors cursor-pointer"
          aria-label={show ? 'Sembunyikan' : 'Tampilkan'}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </FieldShell>
  )
}

/** Native select styled to match the dark theme. */
export const SelectField = ({ label, error, hint, options = [], placeholder, ...props }) => (
  <FieldShell label={label} error={error} hint={hint}>
    <div className="relative">
      <select
        className={`${inputClass} appearance-none pr-9 cursor-pointer ${
          props.value ? 'text-white' : 'text-white/40'
        }`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-[#161616] text-white">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
      />
    </div>
  </FieldShell>
)
