import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const InputField = ({ label, type = 'text', value, onChange, ...props }) => {
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type
  const hasValue = value && value.length > 0

  return (
    <div className="relative w-full">
      <label
        className={`absolute left-0 pointer-events-none transition-all duration-200 ${
          focused || hasValue
            ? 'top-0 text-[11px] text-white/50 font-medium'
            : 'top-1/2 -translate-y-1/2 text-sm text-white/40'
        }`}
      >
        {label}
      </label>
      <input
        type={inputType}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full bg-transparent border-b border-white/15 focus:border-white/60 text-white text-sm pt-5 pb-2.5 pr-10 outline-none transition-colors duration-200"
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword((p) => !p)}
          className="absolute right-0 bottom-2 text-white/40 hover:text-white/80 transition-colors p-1 cursor-pointer"
          tabIndex={-1}
          aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      )}
    </div>
  )
}

export default InputField
